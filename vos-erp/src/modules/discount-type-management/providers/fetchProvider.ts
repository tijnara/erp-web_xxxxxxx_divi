import type { DiscountType } from "../types";

const BASE = "http://100.119.3.44:8090/items/discount_type";

export type ListParams = {
    q?: string;
    limit?: number;
    offset?: number;
};

function toUI(row: any): DiscountType {
  return {
    id: row.id,
    discount_type: row.discount_type,
  };
}

async function http<T = any>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      'Authorization': 'Bearer hTovVgKHSA-XqQFinWFQn6dOu9MFTMs2',
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText}: ${text}`);
  }
  return (await res.json()) as T;
}

export const fetchProvider = () => ({
  async listDiscountTypes({ q, limit = 20, offset = 0 }: ListParams) {
    const url = new URL(BASE);
    if (q && q.trim().length > 0) {
        url.searchParams.set("search", q.trim());
    }
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("offset", String(offset));
    url.searchParams.set("sort", "-id");
    const { data, meta } = await http<{ data: any[]; meta: { total_count: number } }>(url.toString());
    return {
      items: data.map(toUI),
      total: meta?.total_count ?? data.length,
    };
  },
  async createDiscountType(data: Omit<DiscountType, "id">) {
    return await http(BASE, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  async updateDiscountType(id: number, data: Partial<Omit<DiscountType, "id">>) {
    return await http(`${BASE}/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },
});

