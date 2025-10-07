// src/app/api/auth/session/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

const APP_ACCESS = process.env.APP_ACCESS_COOKIE  ?? 'vos_app_access';
const secret = new TextEncoder().encode(process.env.AUTH_JWT_SECRET ?? 'dev-secret-change-me');

export async function GET() {
    const cookieStore = await cookies();
    const token = cookieStore.get(APP_ACCESS)?.value;

    if (!token) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    try {
        const { payload } = await jwtVerify(token, secret);
        // The payload from the JWT is the user object
        return NextResponse.json({ user: payload, accessToken: token });
    } catch (e) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
}
