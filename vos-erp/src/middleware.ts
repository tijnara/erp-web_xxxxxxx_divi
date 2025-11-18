// src/middleware.ts
import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { createClient } from '@supabase/supabase-js';

// Environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const APP_ACCESS   = process.env.APP_ACCESS_COOKIE  ?? 'vos_app_access';
const secret       = new TextEncoder().encode(process.env.AUTH_JWT_SECRET ?? 'dev-secret-change-me');

// Only protect these URL prefixes
const PROTECTED = ['/dashboard', '/admin', '/operation', '/hr', '/reports'];

export async function middleware(req: NextRequest) {
    const { pathname, search, origin } = req.nextUrl;

    // 1. Check if path is protected
    const isProtected = PROTECTED.some((p) => pathname.startsWith(p));
    if (!isProtected) return NextResponse.next();

    // 2. Check for cookie
    const appCookie = req.cookies.get(APP_ACCESS)?.value;
    if (!appCookie) {
        return redirectToLogin(req);
    }

    try {
        // 3. Verify JWT signature (Local check for speed and validity)
        const { payload } = await jwtVerify(appCookie, secret);
        const { sub: userId, jti: sessionId } = payload as { sub: string, jti?: string };

        if (!userId || !sessionId) {
            throw new Error('Invalid token payload');
        }

        // 4. Verify Session against Supabase Database (Remote check for security)
        // We create a lightweight client just for this Edge function
        const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

        // Query the user to ensure the session token in the DB matches the cookie
        const { data: user, error } = await supabase
            .from('users')
            .select('session_token')
            .eq('user_id', userId)
            .single();

        if (error || !user) {
            console.warn('MIDDLEWARE_USER_LOOKUP_FAIL', error);
            throw new Error('User lookup failed');
        }

        // 5. Check if session matches (Enforce single session)
        if (user.session_token !== sessionId) {
            console.warn('MIDDLEWARE_SESSION_MISMATCH');
            const res = redirectToLogin(req);
            res.cookies.delete(APP_ACCESS); // Kill the invalid cookie
            return res;
        }
    } catch (e) {
        // Token verification failed (e.g. expired, invalid, or database error)
        console.error("Middleware Auth Error:", e);
        const res = redirectToLogin(req);
        res.cookies.delete(APP_ACCESS);
        return res;
    }

    return NextResponse.next();
}

function redirectToLogin(req: NextRequest) {
    const url = new URL('/login', req.nextUrl.origin);
    url.searchParams.set('next', `${req.nextUrl.pathname}${req.nextUrl.search || ''}`);
    return NextResponse.redirect(url);
}

export const config = {
    // DO NOT include /api here
    matcher: ['/dashboard/:path*', '/admin/:path*', '/operation/:path*', '/hr/:path*', '/reports/:path*'],
};
