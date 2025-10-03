// src/app/api/auth/me/route.ts
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const APP_ACCESS  = process.env.APP_ACCESS_COOKIE  ?? 'vos_app_access';
const APP_REFRESH = process.env.APP_REFRESH_COOKIE ?? 'vos_app_refresh';
const secret = new TextEncoder().encode(process.env.AUTH_JWT_SECRET ?? 'dev-secret-change-me');

async function verify(token?: string | null) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as any;
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  try {
    // Read cookies from the request headers (works in edge/node runtimes)
    const cookieHeader = req.headers.get('cookie') ?? '';
    const cookies: Record<string, string> = Object.fromEntries(
      cookieHeader
        .split(';')
        .map((c) => c.trim())
        .filter(Boolean)
        .map((c) => {
          const i = c.indexOf('=');
          if (i === -1) return [c, ''];
          const k = decodeURIComponent(c.slice(0, i).trim());
          const v = decodeURIComponent(c.slice(i + 1).trim());
          return [k, v];
        })
    );

    const access = cookies[APP_ACCESS];
    const refresh = cookies[APP_REFRESH];

    const payload = (await verify(access)) || (await verify(refresh));
    if (!payload) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    // Normalize response fields
    const data = {
      sub: payload.sub ? String(payload.sub) : null,
      email: (payload as any).email ?? null,
      name: (payload as any).name ?? null,
      isAdmin: !!(payload as any).isAdmin,
      role_id: (payload as any).role_id ?? null,
      auth_kind: (payload as any).auth_kind ?? null,
    };

    return NextResponse.json({ ok: true, user: data });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 });
  }
}
