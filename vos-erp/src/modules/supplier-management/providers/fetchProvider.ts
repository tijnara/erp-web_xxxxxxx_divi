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
        specialty: row.specialty,
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

    async listProducts(productIds: number[]) {
        const url = new URL(itemsUrl("products"));
        if (productIds.length > 0) {
          url.searchParams.set("filter[product_id][_in]", productIds.join(","));
        }
        url.searchParams.set("fields", "product_id,product_name");
        const json = await http<{ data: { product_id: number; product_name: string }[] }>(url.toString());
        return json.data || [];
    },

    async listLineDiscounts(lineDiscountIds: number[]) {
        const url = new URL(itemsUrl("line_discount"));
        if (lineDiscountIds.length > 0) {
          url.searchParams.set("filter[id][_in]", lineDiscountIds.join(","));
        }
        url.searchParams.set("fields", "id,line_discount");
        const json = await http<{ data: { id: number; line_discount: string }[] }>(url.toString());
        return json.data || [];
    },

    async createSupplierDiscountProduct(data: { supplier_id: number; product_id: number; line_discount_id: number; }) {
        const url = itemsUrl("supplier_discount_products");
        await http(url, {
          method: "POST",
          body: JSON.stringify(data),
        });
    },

    async listSupplierDiscountProducts(supplierId: number) {
        const url = new URL(itemsUrl("supplier_discount_products"));
        url.searchParams.set("filter[supplier_id][_eq]", String(supplierId));
        const json = await http<{ data: any[] }>(url.toString());
        return (json.data || []).map(row => ({
          id: row.id,
          supplier_id: row.supplier_id,
          product_id: row.product_id,
          line_discount_id: row.line_discount_id,
          created_at: row.created_at,
          updated_at: row.updated_at,
          created_by: row.created_by,
        }));
    },

    async listBrands(brandIds: number[]) {
        const url = new URL(itemsUrl("brand"));
        if (brandIds.length > 0) {
            url.searchParams.set("filter[brand_id][_in]", brandIds.join(","));
        }
        url.searchParams.set("fields", "brand_id,brand_name");
        const json = await http<{ data: { brand_id: number; brand_name: string }[] }>(url.toString());
        return json.data || [];
    },

    async createSupplierDiscountBrand(data: { supplier_id: number; brand_id: number; line_discount_id: number; }) {
        const url = itemsUrl("supplier_discount_brand");
        await http(url, {
            method: "POST",
            body: JSON.stringify(data),
        });
    },

    async listSupplierDiscountBrands(supplierId: number) {
        const url = new URL(itemsUrl("supplier_discount_brand"));
        url.searchParams.set("filter[supplier_id][_eq]", String(supplierId));
        const json = await http<{ data: any[] }>(url.toString());
        return (json.data || []).map(row => ({
            id: row.id,
            supplier_id: row.supplier_id,
            brand_id: row.brand_id,
            line_discount_id: row.line_discount_id,
            created_at: row.created_at,
            updated_at: row.updated_at,
            created_by: row.created_by,
        }));
    },

    async listCategories(categoryIds: number[]) {
        const url = new URL(itemsUrl("categories"));
        if (categoryIds.length > 0) {
            url.searchParams.set("filter[category_id][_in]", categoryIds.join(","));
        }
        url.searchParams.set("fields", "category_id,category_name");
        const json = await http<{ data: { category_id: number; category_name: string }[] }>(url.toString());
        return json.data || [];
    },

    async createSupplierDiscountCategory(data: { supplier_id: number; category_id: number; line_discount_id: number; }) {
        const url = itemsUrl("supplier_discount_categories");
        await http(url, {
            method: "POST",
            body: JSON.stringify(data),
        });
    },

    async listSupplierDiscountCategories(supplierId: number) {
        const url = new URL(itemsUrl("supplier_discount_categories"));
        url.searchParams.set("filter[supplier_id][_eq]", String(supplierId));
        const json = await http<{ data: any[] }>(url.toString());
        return (json.data || []).map(row => ({
            id: row.id,
            supplier_id: row.supplier_id,
            category_id: row.category_id,
            line_discount_id: row.line_discount_id,
            created_at: row.created_at,
            updated_at: row.updated_at,
            created_by: row.created_by,
        }));
    },
});
