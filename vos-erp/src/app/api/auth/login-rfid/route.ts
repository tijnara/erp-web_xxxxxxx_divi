// src/app/api/auth/login-rfid/route.ts
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { SignJWT } from 'jose';

const DIRECTUS = (process.env.NEXT_PUBLIC_DIRECTUS_URL ?? '').replace(/\/+$/,'');
const M_EMAIL = process.env.DIRECTUS_MACHINE_EMAIL;
const M_PASS  = process.env.DIRECTUS_MACHINE_PASSWORD;

const APP_ACCESS  = process.env.APP_ACCESS_COOKIE  ?? 'vos_app_access';
const APP_REFRESH = process.env.APP_REFRESH_COOKIE ?? 'vos_app_refresh';
const secret = new TextEncoder().encode(process.env.AUTH_JWT_SECRET ?? 'dev-secret-change-me');

const Body = z.object({ rf: z.string().min(1) });

function bitAsBool(v: any): boolean {
    if (v === 1 || v === true) return true;
    if (v === 0 || v === false || v == null) return false;
    if (typeof v === 'object' && Array.isArray(v.data)) return v.data[0] === 1;
    return false;
}

async function sign(payload: any, seconds: number) {
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(`${seconds}s`)
        .sign(secret);
}

export async function POST(req: Request) {
    try {
        if (!DIRECTUS) {
            return NextResponse.json({ error: 'Missing NEXT_PUBLIC_DIRECTUS_URL' }, { status: 500 });
        }

        const body = await req.json().catch(() => ({}));
        const p = Body.safeParse(body);
        if (!p.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

        // 1) optional: login as machine user for a scoped token
        let token: string | undefined;
        if (M_EMAIL && M_PASS) {
            const authRes = await fetch(`${DIRECTUS}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: M_EMAIL, password: M_PASS }),
            });
            const auth = await authRes.json().catch(() => ({}));
            if (authRes.ok) {
                token = auth?.data?.access_token;
            } else {
                console.warn('RFID machine login failed:', authRes.status, auth?.errors?.[0]?.message);
                token = undefined; // proceed without token; permissions may allow public lookup
            }
        }

        // 2) lookup by rf_id (DO NOT request user_password)
        const url =
            `${DIRECTUS}/items/user` +
            `?limit=1` +
            `&fields=user_id,user_email,user_fname,user_lname,role_id,isAdmin,rf_id,is_deleted,isDeleted` +
            `&filter[rf_id][_eq]=${encodeURIComponent(p.data.rf)}`;

        const ures = await fetch(url, {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            cache: 'no-store',
        });

        const json = await ures.json().catch(() => ({}));

        if (!ures.ok) {
            const msg = json?.errors?.[0]?.message || 'RFID lookup failed (permissions /items/user)';
            return NextResponse.json({ error: msg }, { status: ures.status || 401 });
        }

        const u = json?.data?.[0];
        if (!u) return NextResponse.json({ error: 'RFID not found' }, { status: 404 });

        const deleted  = bitAsBool(u.is_deleted) || bitAsBool(u.isDeleted);
        const inactive = (u.status ?? 'active') === 'inactive';
        if (deleted || inactive) {
            return NextResponse.json({ error: 'Account disabled' }, { status: 403 });
        }

        // 3) mint app-session cookies (JWT)
        const name = [u.user_fname, u.user_lname].filter(Boolean).join(' ') || u.user_email || u.rf_id || '';
        const payload = {
            sub: String(u.user_id),
            email: u.user_email ?? '',
            name,
            isAdmin: !!u.isAdmin,
            role_id: u.role_id ?? null,
            auth_kind: 'rfid' as const,
        };

        const access  = await sign(payload, 60 * 15);       // 15m
        const refresh = await sign(payload, 60 * 60 * 24);  // 1d

        const isProd = process.env.NODE_ENV === 'production';
        const res = NextResponse.json({ ok: true, user: payload });
        res.cookies.set(APP_ACCESS,  access,  { httpOnly: true, sameSite: 'lax', secure: isProd, path: '/', maxAge: 60 * 15 });
        res.cookies.set(APP_REFRESH, refresh, { httpOnly: true, sameSite: 'lax', secure: isProd, path: '/', maxAge: 60 * 60 * 24 });
        return res;
    } catch (e: any) {
        console.error('RFID_LOGIN_ERROR:', e);
        return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 });
    }
}
