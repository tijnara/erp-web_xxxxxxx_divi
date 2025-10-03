// src/app/api/store_type/route.ts
import { NextRequest, NextResponse } from "next/server";
import { apiUrl } from "@/config/api";

export const dynamic = "force-dynamic";

const TARGET = apiUrl("items/store_type");

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
    "Access-Control-Max-Age": "86400",
  } as Record<string, string>;
}

function withCORS(resp: NextResponse) {
  const headers = corsHeaders();
  Object.entries(headers).forEach(([k, v]) => resp.headers.set(k, v));
  return resp;
}

export async function OPTIONS(): Promise<NextResponse> {
  return withCORS(new NextResponse(null, { status: 204 }));
}

function buildTargetUrl(req: NextRequest): string {
  const url = new URL(req.url);
  const target = new URL(TARGET);
  url.searchParams.forEach((v, k) => target.searchParams.set(k, v));
  return target.toString();
}

async function forward(method: string, req: NextRequest, targetUrl: string) {
  const init: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(req.headers.get("authorization") ? { Authorization: req.headers.get("authorization")! } : {}),
    },
    body: method === "GET" || method === "HEAD" ? undefined : await req.text(),
    cache: "no-store",
  };

  const res = await fetch(targetUrl, init);
  const text = await res.text();
  const resp = new NextResponse(text, {
    status: res.status,
    headers: { "Content-Type": res.headers.get("content-type") || "application/json" },
  });
  return withCORS(resp);
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  return forward("GET", req, buildTargetUrl(req));
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  return forward("POST", req, buildTargetUrl(req));
}

export async function PUT(req: NextRequest): Promise<NextResponse> {
  return forward("PUT", req, buildTargetUrl(req));
}

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  return forward("PATCH", req, buildTargetUrl(req));
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  return forward("DELETE", req, buildTargetUrl(req));
}
