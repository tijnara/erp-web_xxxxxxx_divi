// src/app/api/line-discount/route.ts
import { NextRequest, NextResponse } from "next/server";
import { directusServer } from "@/lib/directus";
import { readItems } from "@directus/sdk";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("query");

  try {
    const filter: any = {};
    if (query) {
      filter.discount_name = { _contains: query };
    }
    const res = await directusServer.request(
      readItems("line_discount", {
        fields: ["id", "discount_name as name", "discount_value"],
        filter,
        limit: 20,
      })
    );

    return NextResponse.json({ data: res });
  } catch (error) {
    console.error("Error fetching line discounts:", error);
    return NextResponse.json({ error: "Failed to fetch line discounts" }, { status: 500 });
  }
}
