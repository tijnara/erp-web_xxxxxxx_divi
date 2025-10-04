// src/modules/customer-management/providers/fetchProvider.ts
import type { Customer, UpsertCustomerDTO } from "../types";
import { itemsUrl } from "../../../config/api";

const BASE = itemsUrl("customer"); // Use absolute URL to external API

export type ListParams = {
    q?: string;
    limit?: number;
    offset?: number;
};

function toUI(row: any): Customer {
  return {
    id: row.id,
    customer_code: row.customer_code ?? "",
    customer_name: row.customer_name ?? "",
    customer_image: row.customer_image ?? null,
    store_name: row.store_name ?? "",
    store_signage: row.store_signage ?? "",
    brgy: row.brgy ?? null,
    city: row.city ?? null,
    province: row.province ?? null,
    contact_number: row.contact_number ?? "",
    customer_email: row.customer_email ?? null,
    tel_number: row.tel_number ?? null,
    bank_details: row.bank_details ?? null,
    customer_tin: row.customer_tin ?? null,
    payment_term: row.payment_term ?? null,
    store_type: row.store_type ?? 0,
    price_type: row.price_type ?? null,
    encoder_id: row.encoder_id ?? 0,
    credit_type: row.credit_type ?? 0,
    company_code: row.company_code ?? -1,
    date_entered: row.date_entered ?? row.dateEntered ?? null,
    isActive: row.isActive ?? 0,
    isVAT: row.isVAT ?? 0,
    isEWT: row.isEWT ?? 0,
    discount_type: row.discount_type ?? null,
    otherDetails: row.otherDetails ?? null,
    classification: row.classification ?? null,
    location: row.location ?? null,
  } as Customer;
}

function toAPI(dto: UpsertCustomerDTO): Record<string, any> {
  const body: Record<string, any> = {};
  if (dto.customer_code !== undefined) body["customer_code"] = dto.customer_code;
  if (dto.customer_name !== undefined) body["customer_name"] = dto.customer_name;
  if (dto.customer_image !== undefined) body["customer_image"] = dto.customer_image;
  if (dto.store_name !== undefined) body["store_name"] = dto.store_name;
  if (dto.store_signage !== undefined) body["store_signage"] = dto.store_signage;
  if (dto.brgy !== undefined) body["brgy"] = dto.brgy;
  if (dto.city !== undefined) body["city"] = dto.city;
  if (dto.province !== undefined) body["province"] = dto.province;
  if (dto.contact_number !== undefined) body["contact_number"] = dto.contact_number;
  if (dto.customer_email !== undefined) body["customer_email"] = dto.customer_email;
  if (dto.tel_number !== undefined) body["tel_number"] = dto.tel_number;
  if (dto.bank_details !== undefined) body["bank_details"] = dto.bank_details;
  if (dto.customer_tin !== undefined) body["customer_tin"] = dto.customer_tin;
  if (dto.payment_term !== undefined) body["payment_term"] = dto.payment_term;
  if (dto.store_type !== undefined) body["store_type"] = dto.store_type;
  if (dto.price_type !== undefined) body["price_type"] = dto.price_type;
  if (dto.encoder_id !== undefined) body["encoder_id"] = dto.encoder_id;
  if (dto.credit_type !== undefined) body["credit_type"] = dto.credit_type;
  if (dto.company_code !== undefined) body["company_code"] = dto.company_code;
  if (dto.date_entered !== undefined) body["date_entered"] = dto.date_entered;
  if (dto.isActive !== undefined) body["isActive"] = dto.isActive;
  if (dto.isVAT !== undefined) body["isVAT"] = dto.isVAT;
  if (dto.isEWT !== undefined) body["isEWT"] = dto.isEWT;
  if (dto.discount_type !== undefined) body["discount_type"] = dto.discount_type;
  if (dto.otherDetails !== undefined) body["otherDetails"] = dto.otherDetails;
  if (dto.classification !== undefined) body["classification"] = dto.classification;
  if (dto.location !== undefined) body["location"] = dto.location;
  return body;
}

async function http<T = any>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
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
  async listCustomers({ q, limit = 20, offset = 0 }: ListParams) {
    const url = new URL(BASE);
    if (q && q.trim().length > 0) {
        url.searchParams.set("search", q.trim());
    }
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("offset", String(offset));
    url.searchParams.set("meta", "filter_count");

    try {
      const json = await http<{ data: any[], meta: { filter_count: number } }>(url.toString());
      const items = (json?.data ?? []).map(toUI);
      return { items, total: json.meta?.filter_count ?? items.length };
    } catch (e) {
      console.error("Failed to list customers:", e);
      return { items: [], total: 0 }; // Return empty on error
    }
  },

  async getCustomer(id: string | number) {
    const json = await http<{ data: any }>(`${BASE}?id=${encodeURIComponent(String(id))}`);
    const data: any = (json as any).data;
    const row = Array.isArray(data) ? data.find((r: any) => String(r.id) === String(id)) : data;
    return toUI(row ?? {});
  },

  async createCustomer(dto: UpsertCustomerDTO) {
    const payload = toAPI(dto);
    const json = await http<{ data: any }>(BASE, { method: "POST", body: JSON.stringify(payload) });
    return toUI((json as any).data ?? json);
  },

  async updateCustomer(id: string | number, dto: UpsertCustomerDTO) {
    const payload = toAPI(dto);
    const url = `${BASE}?id=${encodeURIComponent(String(id))}`;
    const json = await http<{ data: any }>(url, { method: "PATCH", body: JSON.stringify(payload) });
    return toUI((json as any).data ?? json);
  },

  async deleteCustomer(id: string | number) {
    await http(`${BASE}?id=${encodeURIComponent(String(id))}`, { method: "DELETE" });
  },

  async listStoreTypes() {
    const json = await http<{ data: { id: number; store_type: string }[] }>(itemsUrl("store_type"));
    return json.data || [];
  },

  async listDiscountTypes() {
    const json = await http<{ data: { id: number; discount_type: string }[] }>(itemsUrl("discount_type"));
    return json.data || [];
  },

  async listUsers() {
    const json = await http<{ data: { user_id: number; user_fname: string; user_lname: string }[] }>(itemsUrl("user"));
    return json.data || [];
  },
});
