// src/app/api/lookup/[resource]/route.ts
export const runtime = "nodejs";

import {NextResponse} from "next/server";
import {cookies as nextCookies} from "next/headers";

// Default to the provided Directus server if the env var is not set.
const DIRECTUS = process.env.NEXT_PUBLIC_DIRECTUS_URL ?? "http://100.119.3.44:8090";
const ACCESS = process.env.AUTH_ACCESS_COOKIE ?? "vos_access";

// map your resources -> directus collection + fields + mapping
const MAP: Record<
    string,
    { path: string; fields: string; nameField: string; idField: string; extra?: string[] }
> = {
    units: {
        path: "units",
        fields: "unit_id,unit_name,unit_shortcut",
        nameField: "unit_name",
        idField: "unit_id",
        extra: ["unit_shortcut"]
    },
    brand: {path: "brand", fields: "brand_id,brand_name", nameField: "brand_name", idField: "brand_id"},
    categories: {
        path: "categories",
        fields: "category_id,category_name",
        nameField: "category_name",
        idField: "category_id"
    },
    segment: {path: "segment", fields: "segment_id,segment_name", nameField: "segment_name", idField: "segment_id"},
    sections: {path: "sections", fields: "section_id,section_name", nameField: "section_name", idField: "section_id"}
};

export async function GET(req: Request, context: { params: { resource: string } }) {
    if (!DIRECTUS) return NextResponse.json([], {status: 200});

    // Await context.params as required by Next.js 14+
    const { resource } = await context.params;
    const cfg = MAP[resource];
    if (!cfg) return NextResponse.json([], {status: 200});

    const url = new URL(req.url);
    const q = url.searchParams.get("q") ?? "";

    const cookieStore = await nextCookies();
    const auth = cookieStore.get(ACCESS)?.value;

    const parts: string[] = [
        `fields=${encodeURIComponent(cfg.fields)}`,
        `limit=20`,
        `sort=${encodeURIComponent(cfg.nameField)}`,
    ];

    if (q.trim()) {
        // deep filter on the "name" field
        parts.push(
            `filter[${cfg.nameField}][_icontains]=${encodeURIComponent(q.trim())}`
        );
    }

    const r = await fetch(`${DIRECTUS}/items/${cfg.path}?${parts.join("&")}` , {
        headers: auth ? {Authorization: `Bearer ${auth}`} : undefined,
        cache: "no-store",
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
        // don't explode the UI on lookup failures—just return empty
        return NextResponse.json([], {status: 200});
    }

    const data = (j?.data ?? []) as any[];
    const options = data.map((row) => {
        const id = row[cfg.idField];
        const name = row[cfg.nameField];
        const meta: any = {};
        if (cfg.extra?.includes("unit_shortcut") && row.unit_shortcut) {
            meta.subtitle = row.unit_shortcut;
        }
        return {id, name, meta};
    });

    return NextResponse.json(options);
}
