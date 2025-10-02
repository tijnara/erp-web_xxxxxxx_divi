// src/app/api/auth/login/route.ts
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const DIRECTUS = process.env.NEXT_PUBLIC_DIRECTUS_URL ?? '';
const ACCESS = process.env.AUTH_ACCESS_COOKIE ?? 'vos_access';
const REFRESH = process.env.AUTH_REFRESH_COOKIE ?? 'vos_refresh';

export async function POST(req: Request) {
    try {
        if (!DIRECTUS) {
            return NextResponse.json({ error: 'Missing NEXT_PUBLIC_DIRECTUS_URL' }, { status: 500 });
        }

        const { email, password } = await req.json().catch(() => ({}));
        if (!email || !password) {
            return NextResponse.json({ error: 'Missing email/password' }, { status: 400 });
        }

        const authRes = await fetch(`${DIRECTUS}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        const body = await authRes.json().catch(() => ({}));

        if (!authRes.ok) {
            // surface the real error from Directus
            const msg =
                body?.errors?.[0]?.message ||
                body?.error ||
                `Directus login failed (${authRes.status})`;
            return NextResponse.json({ error: msg }, { status: authRes.status || 401 });
        }

        const { access_token, refresh_token, expires } = body?.data ?? {};
        if (!access_token || !refresh_token) {
            return NextResponse.json({ error: 'Invalid Directus response' }, { status: 500 });
        }

        const isProd = process.env.NODE_ENV === 'production';
        const c = await cookies();
        c.set(ACCESS, access_token, { httpOnly: true, sameSite: 'lax', secure: isProd, path: '/', maxAge: 60 * 15 });
        c.set(REFRESH, refresh_token, { httpOnly: true, sameSite: 'lax', secure: isProd, path: '/', maxAge: 60 * 60 * 24 * 30 });

        return NextResponse.json({ ok: true, expires });
    } catch (e: any) {
        console.error('LOGIN_ROUTE_ERROR:', e);
        return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 });
    }
}
