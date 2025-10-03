// src/app/api/customer/route.ts
import { NextRequest, NextResponse } from "next/server";
import { apiUrl } from "@/config/api";

export const dynamic = "force-dynamic";

const TARGET = apiUrl("items/customer");

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

function idPathUrl(id: string): string {
  const base = new URL(TARGET);
  base.pathname = base.pathname.replace(/\/$/, "");
  base.pathname += "/" + encodeURIComponent(id);
  return base.toString();
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const url = new URL(req.url);
  const id = url.searchParams.get("id") || url.searchParams.get("customer_id");
  const targetUrl = id ? idPathUrl(id) : buildTargetUrl(req);
  return forward("GET", req, targetUrl);
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const targetUrl = buildTargetUrl(req);
  return forward("POST", req, targetUrl);
}

export async function PUT(req: NextRequest): Promise<NextResponse> {
  const url = new URL(req.url);
  const id = url.searchParams.get("id") || url.searchParams.get("customer_id");
  const targetUrl = id ? idPathUrl(id) : buildTargetUrl(req);
  return forward("PUT", req, targetUrl);
}

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  const url = new URL(req.url);
  const id = url.searchParams.get("id") || url.searchParams.get("customer_id");
  const targetUrl = id ? idPathUrl(id) : buildTargetUrl(req);
  return forward("PATCH", req, targetUrl);
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  const url = new URL(req.url);
  const id = url.searchParams.get("id") || url.searchParams.get("customer_id");
  if (id) {
    return forward("DELETE", req, idPathUrl(id));
  }
  return forward("DELETE", req, buildTargetUrl(req));
}
