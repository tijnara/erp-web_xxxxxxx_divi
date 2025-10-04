import type { DataProvider, ListParams } from "./DataProvider";
import type { Supplier, UpsertSupplierDTO } from "../types";
import { itemsUrl } from "../../../config/api";

const BASE = "http://100.119.3.44:8090/items/suppliers";

function toUI(row: any): Supplier {
    return {
        id: row.id,
        supplier_name: row.supplier_name,
        supplier_shortcut: row.supplier_shortcut,
        contact_person: row.contact_person,
        email_address: row.email_address,
        phone_number: row.phone_number,
        address: row.address,
        city: row.city,
        brgy: row.brgy,
        state_province: row.state_province,
        postal_code: row.postal_code,
        country: row.country,
        supplier_type: row.supplier_type,
        tin_number: row.tin_number,
        bank_details: row.bank_details,
        payment_terms: row.payment_terms,
        delivery_terms: row.delivery_terms,
        agreement_or_contract: row.agreement_or_contract,
        preferred_communication_method: row.preferred_communication_method,
        notes_or_comments: row.notes_or_comments,
        date_added: row.date_added,
        supplier_image: row.supplier_image,
        isActive: row.isActive,
        nonBuy: row.nonBuy,
    };
}

function toAPI(dto: UpsertSupplierDTO): Record<string, any> {
    const body: Record<string, any> = {};
    for (const [key, value] of Object.entries(dto)) {
        if (value !== undefined) {
            body[key] = value;
        }
    }
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
    async listSuppliers({ q, limit = 20, offset = 0 }: ListParams) {
        const url = new URL(BASE);
        if (q && q.trim().length > 0) url.searchParams.set("search", q.trim());
        url.searchParams.set("limit", String(limit));
        url.searchParams.set("offset", String(offset));
        url.searchParams.set("meta", "filter_count");

        const json = await http<{ data: any[], meta: { filter_count: number } }>(url.toString());
        const items = (json.data || []).map(toUI);
        return { items, total: json.meta?.filter_count ?? items.length };
    },

    async getSupplier(id) {
        const url = new URL(`${BASE}/${id}`);
        const json = await http<{ data: any }>(url.toString());
        return toUI(json.data);
    },

    async createSupplier(data) {
        const json = await http<{ data: any }>(BASE, {
            method: "POST",
            body: JSON.stringify(toAPI(data)),
        });
        return toUI(json.data);
    },

    async updateSupplier(id, data) {
        const json = await http<{ data: any }>(`${BASE}/${id}`, {
            method: "PATCH",
            body: JSON.stringify(toAPI(data)),
        });
        return toUI(json.data);
    },

    async deleteSupplier(id) {
        await http(`${BASE}/${id}`, { method: "DELETE" });
    },
});

