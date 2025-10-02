// src/app/api/auth/me/route.ts
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify, type JWTPayload } from 'jose';

const DIRECTUS = process.env.NEXT_PUBLIC_DIRECTUS_URL ?? '';
const ACCESS    = process.env.AUTH_ACCESS_COOKIE ?? 'vos_access';        // Directus access cookie
const APP_ACCESS= process.env.APP_ACCESS_COOKIE  ?? 'vos_app_access';    // RFID app cookie
const secret    = new TextEncoder().encode(process.env.AUTH_JWT_SECRET ?? 'dev-secret-change-me');

type RfidPayload = JWTPayload & {
    email?: string;
    name?: string;
    isAdmin?: boolean;
    role_id?: number | null;
};

export async function GET() {
    const c = await cookies(); // ✅ no await
    const directusToken = c.get(ACCESS)?.value;

    // Case 1: Directus session cookie present → fetch /users/me
    if (directusToken && DIRECTUS) {
        try {
            const ures = await fetch(`${DIRECTUS}/users/me`, {
                headers: { Authorization: `Bearer ${directusToken}` },
                cache: 'no-store',
            });

            if (ures.ok) {
                const udata = await ures.json().catch(() => ({}));
                return NextResponse.json({ user: { directus: udata?.data ?? null, profile: null } });
            }
            // if 401/403, fall through to RFID or null
        } catch {
            // network error -> fall through
        }
    }

    // Case 2: RFID app-session cookie present → verify JWT and map to profile
    const appToken = c.get(APP_ACCESS)?.value;
    if (appToken) {
        try {
            const { payload } = await jwtVerify<RfidPayload>(appToken, secret);

            const nameStr = typeof payload.name === 'string' ? payload.name : '';
            const parts   = nameStr.trim().split(/\s+/).filter(Boolean);
            const first   = parts[0] ?? null;
            const last    = parts.length > 1 ? parts.slice(1).join(' ') : null;

            return NextResponse.json({
                user: {
                    directus: null,
                    profile: {
                        user_email: typeof payload.email === 'string' ? payload.email : null,
                        user_fname: first,
                        user_lname: last,
                        isAdmin: !!payload.isAdmin,
                        role_id: (typeof payload.role_id === 'number' || payload.role_id === null) ? payload.role_id : null,
                    },
                },
            });
        } catch {
            // bad/expired token -> fall through to null
        }
    }

    // No valid session
    return NextResponse.json({ user: null }, { status: 200 });
}
