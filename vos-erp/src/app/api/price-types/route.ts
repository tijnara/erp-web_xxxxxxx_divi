import { NextResponse } from "next/server";
import { directusServer } from "@/lib/directus";
import { readItems } from "@directus/sdk";

export async function GET() {
    try {
        const priceTypes = await directusServer.request(readItems("price_types", {
            limit: -1,
        }));
        return NextResponse.json(priceTypes);
    } catch (error) {
        console.error("Error fetching price types:", error);
        return NextResponse.json({ error: "Failed to fetch price types" }, { status: 500 });
    }
}
