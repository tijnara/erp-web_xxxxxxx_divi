// src/app/api/products/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { cookies as nextCookies } from "next/headers";
import { ENRICHED_FIELDS, fromDirectusRow, toDirectusBody } from "@/modules/product-management/adapter";

const DIRECTUS = process.env.NEXT_PUBLIC_DIRECTUS_URL ?? "";
const ACCESS   = process.env.AUTH_ACCESS_COOKIE ?? "vos_access";

export async function GET(req: Request) {
    if (!DIRECTUS) {
        return NextResponse.json({ error: "Missing NEXT_PUBLIC_DIRECTUS_URL" }, { status: 500 });
    }

    const url   = new URL(req.url);
    const q     = url.searchParams.get("q") ?? "";
    const limit = Math.max(1, Math.min(100, Number(url.searchParams.get("limit") ?? "20")));
    const offset= Math.max(0, Number(url.searchParams.get("offset") ?? "0"));
    const sort  = url.searchParams.get("sort") ?? "-product_name";

    const parts: string[] = [
        `fields=${encodeURIComponent(ENRICHED_FIELDS)}`,
        `limit=${limit}`,
        `offset=${offset}`,
        `sort=${encodeURIComponent(sort)}`,
    ];

    if (q.trim()) {
        parts.push(
            `filter[_or][0][product_name][_icontains]=${encodeURIComponent(q)}`,
            `filter[_or][1][product_code][_icontains]=${encodeURIComponent(q)}`,
            `filter[_or][2][barcode][_icontains]=${encodeURIComponent(q)}`,
            `filter[_or][3][product_brand][brand_name][_icontains]=${encodeURIComponent(q)}`,
            `filter[_or][4][product_category][category_name][_icontains]=${encodeURIComponent(q)}`
        );
    }

    const cookieStore = await nextCookies();
    const auth = cookieStore.get(ACCESS)?.value;

    const res = await fetch(`${DIRECTUS}/items/products?${parts.join("&")}`, {
        headers: auth ? { Authorization: `Bearer ${auth}` } : undefined,
        cache: "no-store",
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
        const msg = json?.errors?.[0]?.message || `Directus error (${res.status})`;
        return NextResponse.json({ error: msg }, { status: res.status });
    }

    const rows  = json?.data ?? [];
    const items = rows.map(fromDirectusRow);
    // If you have meta.total in Directus, prefer that; else fallback
    const total = json?.meta?.total ?? items.length;

    return NextResponse.json({ items, total });
}

export async function POST(req: Request) {
    if (!DIRECTUS) {
        return NextResponse.json({ error: "Missing NEXT_PUBLIC_DIRECTUS_URL" }, { status: 500 });
    }

    const body = await req.json().catch(() => ({}));
    const cookieStore = await nextCookies();
    const auth = cookieStore.get(ACCESS)?.value;

    const res = await fetch(`${DIRECTUS}/items/products`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(auth ? { Authorization: `Bearer ${auth}` } : {}),
        },
        body: JSON.stringify(toDirectusBody(body)),
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
        const msg = json?.errors?.[0]?.message || "Create failed";
        return NextResponse.json({ error: msg }, { status: res.status });
    }

    return NextResponse.json(fromDirectusRow(json.data), { status: 201 });
}
