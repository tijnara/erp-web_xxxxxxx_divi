export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { cookies as nextCookies } from 'next/headers';
import { ENRICHED_FIELDS, fromDirectusRow, toDirectusBody } from '@/modules/product-management/adapter';

const DIRECTUS = process.env.NEXT_PUBLIC_DIRECTUS_URL ?? '';
const ACCESS   = process.env.AUTH_ACCESS_COOKIE ?? 'vos_access';

export async function GET(
    _req: Request,
    ctx: { params: { id: string } }         // 👈 accept params here
) {
    const cookieStore = await nextCookies();
    const auth = cookieStore.get(ACCESS)?.value;

    const res = await fetch(
        `${DIRECTUS}/items/products/${encodeURIComponent(ctx.params.id)}?fields=${ENRICHED_FIELDS}`,
        { headers: auth ? { Authorization: `Bearer ${auth}` } : undefined, cache: 'no-store' }
    );
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return NextResponse.json({ error: json?.errors?.[0]?.message || 'Fetch failed' }, { status: res.status });
    return NextResponse.json(fromDirectusRow(json.data));
}

export async function PATCH(
    req: Request,
    ctx: { params: { id: string } }         // 👈 accept params here
) {
    const cookieStore = await nextCookies();
    const auth = cookieStore.get(ACCESS)?.value;
    const body = await req.json().catch(() => ({}));

    const res = await fetch(`${DIRECTUS}/items/products/${encodeURIComponent(ctx.params.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(auth ? { Authorization: `Bearer ${auth}` } : {}) },
        body: JSON.stringify(toDirectusBody(body)),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return NextResponse.json({ error: json?.errors?.[0]?.message || 'Update failed' }, { status: res.status });
    return NextResponse.json(fromDirectusRow(json.data));
}

export async function DELETE(
    _req: Request,
    ctx: { params: { id: string } }         // 👈 accept params here
) {
    const cookieStore = await nextCookies();
    const auth = cookieStore.get(ACCESS)?.value;

    const res = await fetch(`${DIRECTUS}/items/products/${encodeURIComponent(ctx.params.id)}`, {
        method: 'DELETE',
        headers: auth ? { Authorization: `Bearer ${auth}` } : undefined,
    });
    if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        const msg = json?.errors?.[0]?.message || 'Delete failed';
        return NextResponse.json({ error: msg }, { status: res.status });
    }
    return NextResponse.json({ ok: true });
}
