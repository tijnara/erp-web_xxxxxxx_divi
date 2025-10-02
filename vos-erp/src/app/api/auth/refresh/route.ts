import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const DIRECTUS = process.env.NEXT_PUBLIC_DIRECTUS_URL!;
const ACCESS = process.env.AUTH_ACCESS_COOKIE!;
const REFRESH = process.env.AUTH_REFRESH_COOKIE!;

export async function POST() {
    const refresh = (await cookies()).get(REFRESH)?.value;
    if (!refresh) return NextResponse.json({ error: 'No refresh token' }, { status: 401 });

    const res = await fetch(`${DIRECTUS}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refresh }),
    });

    if (!res.ok) return NextResponse.json({ error: 'Refresh failed' }, { status: 401 });
    const data = await res.json();
    const access = data?.data?.access_token;
    if (!access) return NextResponse.json({ error: 'No access token' }, { status: 401 });

    const isProd = process.env.NODE_ENV === 'production';
    (await cookies()).set(ACCESS, access, { httpOnly: true, sameSite: 'lax', secure: isProd, path: '/', maxAge: 60 * 15 });
    return NextResponse.json({ ok: true });
}
