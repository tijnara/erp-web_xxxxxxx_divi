// src/middleware.ts
import { NextResponse, type NextRequest } from 'next/server';

// Always provide safe fallbacks for cookie names
const DIRECTUS_ACCESS = process.env.AUTH_ACCESS_COOKIE ?? 'vos_access';
const APP_ACCESS      = process.env.APP_ACCESS_COOKIE  ?? 'vos_app_access';

// Only protect these URL prefixes
const PROTECTED = ['/dashboard', '/admin', '/operation', '/hr', '/reports'];

export function middleware(req: NextRequest) {
    const { pathname, search, origin } = req.nextUrl;

    // only run on protected paths
    const isProtected = PROTECTED.some((p) => pathname.startsWith(p));
    if (!isProtected) return NextResponse.next();

    // Read cookies safely
    const hasDirectus = !!req.cookies.get(DIRECTUS_ACCESS)?.value;
    const hasApp      = !!req.cookies.get(APP_ACCESS)?.value;

    if (!(hasDirectus || hasApp)) {
        const url = new URL('/login', origin);
        url.searchParams.set('next', `${pathname}${search || ''}`);
        return NextResponse.redirect(url);
    }

    return NextResponse.next();
}

export const config = {
    // DO NOT include /api here
    matcher: ['/dashboard/:path*', '/admin/:path*', '/operation/:path*', '/hr/:path*', '/reports/:path*'],
};
