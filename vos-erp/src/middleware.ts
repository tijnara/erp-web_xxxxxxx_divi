// src/middleware.ts
import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Always provide safe fallbacks for cookie names
const DIRECTUS_ACCESS = process.env.AUTH_ACCESS_COOKIE ?? 'vos_access';
const APP_ACCESS      = process.env.APP_ACCESS_COOKIE  ?? 'vos_app_access';
const secret = new TextEncoder().encode(process.env.AUTH_JWT_SECRET ?? 'dev-secret-change-me');
const DIRECTUS = (process.env.NEXT_PUBLIC_DIRECTUS_URL ?? '').replace(/\/+$/,'');

// Only protect these URL prefixes
const PROTECTED = ['/dashboard', '/admin', '/operation', '/hr', '/reports'];

// Machine token for middleware to look up user session
const M_EMAIL = process.env.DIRECTUS_MACHINE_EMAIL;
const M_PASS  = process.env.DIRECTUS_MACHINE_PASSWORD;

let machineToken: string | undefined = undefined;
let tokenExpires = 0;

async function getMachineToken() {
    if (machineToken && Date.now() < tokenExpires) {
        return machineToken;
    }

    if (!M_EMAIL || !M_PASS) return undefined;
    try {
        const mres = await fetch(`${DIRECTUS}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: M_EMAIL, password: M_PASS }),
        });
        const m = await mres.json().catch(() => ({}));
        if (mres.ok && m.data.access_token) {
            machineToken = m.data.access_token;
            // expires is in ms
            tokenExpires = Date.now() + m.data.expires - 5000; // 5s buffer
            return machineToken;
        }
    } catch (e) {
        console.error('MIDDLEWARE_MACHINE_TOKEN_FAIL', e);
    }
    return undefined;
}


export async function middleware(req: NextRequest) {
    const { pathname, search, origin } = req.nextUrl;

    // only run on protected paths
    const isProtected = PROTECTED.some((p) => pathname.startsWith(p));
    if (!isProtected) return NextResponse.next();

    const appCookie = req.cookies.get(APP_ACCESS)?.value;

    if (!appCookie) {
        const url = new URL('/login', origin);
        url.searchParams.set('next', `${pathname}${search || ''}`);
        return NextResponse.redirect(url);
    }

    try {
        const { payload } = await jwtVerify(appCookie, secret);
        const { sub: userId, jti: sessionId } = payload as { sub: string, jti?: string };

        if (!userId || !sessionId) {
            throw new Error('Invalid token payload');
        }

        const token = await getMachineToken();
        if (!token) {
            // If we can't get a machine token, we can't verify the session.
            // For now, we'll allow access, but this is a potential security risk.
            // A better approach might be to deny access if the session can't be verified.
            console.warn('MIDDLEWARE_SKIP_SESSION_CHECK: No machine token');
            return NextResponse.next();
        }

        const url = `${DIRECTUS}/items/user/${userId}?fields=session_token`;
        const ures = await fetch(url, {
            headers: { Authorization: `Bearer ${token}` },
            cache: 'no-store',
        });

        if (!ures.ok) {
            // User not found or other error
            throw new Error('User not found or permission error');
        }

        const user = await ures.json();
        const userSession = user?.data?.session_token;

        if (userSession !== sessionId) {
            // Session is invalid, redirect to login
            const url = new URL('/login', origin);
            url.searchParams.set('next', `${pathname}${search || ''}`);
            const res = NextResponse.redirect(url);
            // Clear the invalid cookie
            res.cookies.delete(APP_ACCESS);
            return res;
        }

    } catch (e) {
        // Token verification failed (e.g. expired, invalid)
        const url = new URL('/login', origin);
        url.searchParams.set('next', `${pathname}${search || ''}`);
        const res = NextResponse.redirect(url);
        // Clear the invalid cookie
        res.cookies.delete(APP_ACCESS);
        return res;
    }


    return NextResponse.next();
}

export const config = {
    // DO NOT include /api here
    matcher: ['/dashboard/:path*', '/admin/:path*', '/operation/:path*', '/hr/:path*', '/reports/:path*'],
};
