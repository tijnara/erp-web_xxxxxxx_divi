// src/modules/salesman-management/providers/fetchProvider.ts
import type { DataProvider, ListParams } from "./DataProvider";
import type { Salesman, UpsertSalesmanDTO } from "../types";
import { apiUrl } from "../../../config/api";

const BASE = apiUrl("items/salesman");

function toUI(row: any): Salesman {
  return {
    id: row.id,
    code: row.salesman_code ?? null,
    name: row.salesman_name ?? (row.id != null ? String(row.id) : "Unnamed"),
    // The API may provide these; default to null for stability
    email: null,
    phone: null,
    // Map branch_code for display and keep old territory for stats compatibility
    territory: row.branch_code != null ? String(row.branch_code) : null,
    truck_plate: row.truck_plate ?? null,
    branch_code: row.branch_code ?? null,
    isActive: row.isActive ?? true,
    // Show modified_date as a rough hire/update date if present
    hireDate: row.modified_date ?? null,
    targetMonthly: null,
    totalSalesYTD: null,
  };
}

function toAPI(dto: UpsertSalesmanDTO): Record<string, any> {
  const body: Record<string, any> = {};
  if (dto.name !== undefined) body["salesman_name"] = dto.name;
  if (dto.code !== undefined) body["salesman_code"] = dto.code;
  if (dto.truck_plate !== undefined) body["truck_plate"] = dto.truck_plate;
  if (dto.branch_code !== undefined) body["branch_code"] = dto.branch_code;
  if (dto.isActive !== undefined) body["isActive"] = dto.isActive;
  // Other UI-only fields (email, phone, territory, etc.) are not part of the API
  return body;
}

async function http<T = any>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText}: ${text}`);
  }
  return (await res.json()) as T;
}

export const fetchProvider = (): DataProvider => ({
  async listSalesmen({ q, limit = 50, offset = 0 }: ListParams) {
    const url = new URL(BASE);
    if (q && q.trim().length > 0) url.searchParams.set("search", q.trim());
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("offset", String(offset));

    const json = await http<{ data: any[] }>(url.toString());
    const items = (json.data || []).map(toUI);
    return { items, total: items.length };
  },

  async getSalesman(id) {
    const json = await http<{ data: any }>(`${BASE}/${id}`);
    return toUI(json.data);
  },

  async createSalesman(data: UpsertSalesmanDTO) {
    const payload = toAPI(data);
    const json = await http<{ data: any }>(BASE, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return toUI(json.data);
  },

  async updateSalesman(id, data: UpsertSalesmanDTO) {
    const payload = toAPI(data);
    const json = await http<{ data: any }>(`${BASE}/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    return toUI(json.data);
  },

  async deleteSalesman(id) {
    await http(`${BASE}/${id}`, { method: "DELETE" });
  },
});
