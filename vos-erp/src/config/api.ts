// src/config/api.ts
// Centralized API base URL and helpers for vos-erp

export type ApiConfig = {
  baseUrl: string;
};

// Default API base URL (preserves current behavior)
const DEFAULT_BASE_URL = "http://100.119.3.44:8090";

// Resolve base URL with a runtime override if provided via window.__VOS_API_BASE__
function resolveBaseUrl(): string {
  const w: any = typeof window !== "undefined" ? (window as any) : undefined;
  const fromWindow = w?.__VOS_API_BASE__;
  if (typeof fromWindow === "string" && fromWindow.trim().length > 0) {
    // Ensure no trailing slash
    return fromWindow.replace(/\/+$/, "");
  }
  return DEFAULT_BASE_URL;
}

export const API_BASE_URL: string = resolveBaseUrl();

export function apiUrl(path: string): string {
  const base = API_BASE_URL.replace(/\/+$/, "");
  const cleanPath = path.replace(/^\/+/, "");
  return `${base}/${cleanPath}`;
}


export const ITEMS_BASE = apiUrl("items");

export function itemsUrl(path: string = ""): string {
  const clean = path.replace(/^\/+/, "");
  return clean ? `${ITEMS_BASE}/${clean}` : ITEMS_BASE;
}
