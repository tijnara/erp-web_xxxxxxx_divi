// src/modules/salesman-management/providers/fetchProvider.ts
import type { DataProvider, ListParams } from "./DataProvider";
import type { Salesman, UpsertSalesmanDTO } from "../types";
import { itemsUrl } from "../../../config/api";

const BASE = itemsUrl("salesman");

function toUI(row: any): Salesman {
    return {
        id: row.id,
        code: row.salesman_code ?? null,
        name: row.salesman_name ?? (row.id != null ? String(row.id) : "Unnamed"),
        employee_id: row.employee_id ?? null,
        email: null,
        phone: null,
        territory: row.branch_code != null ? String(row.branch_code) : null,
        truck_plate: row.truck_plate ?? null,
        branch_code: row.branch_code ?? null,
        division_id: row.division_id ?? null,
        operation: row.operation ?? null,
        company_code: row.company_code ?? null,
        supplier_code: row.supplier_code ?? null,
        price_type: row.price_type ?? null,
        isActive: row.isActive ?? true,
        hireDate: row.modified_date ?? null,
        targetMonthly: null,
        totalSalesYTD: null,
    };
}

function toAPI(dto: UpsertSalesmanDTO): Record<string, any> {
    const body: Record<string, any> = {};

    const num = (v: any) => {
        if (v === "" || v === null || v === undefined) return undefined;
        const n = Number(v);
        return Number.isFinite(n) ? n : undefined;
    };

    if (dto.name !== undefined) body["salesman_name"] = dto.name;
    if (dto.code !== undefined) body["salesman_code"] = dto.code;

    const emp = num((dto as any).employee_id);
    if (emp !== undefined) body["employee_id"] = emp;

    if (dto.truck_plate !== undefined) body["truck_plate"] = dto.truck_plate;

    const branch = num((dto as any).branch_code);
    if (branch !== undefined) body["branch_code"] = branch;

    const division = num((dto as any).division_id);
    if (division !== undefined) body["division_id"] = division;

    const op = num((dto as any).operation);
    if (op !== undefined) body["operation"] = op;

    const comp = num((dto as any).company_code);
    if (comp !== undefined) body["company_code"] = comp;

    const sup = num((dto as any).supplier_code);
    if (sup !== undefined) body["supplier_code"] = sup;

    const pt = num((dto as any).price_type);
    if (pt !== undefined) {
        body["price_type"] = pt;
    }

    if (dto.isActive !== undefined) body["isActive"] = !!dto.isActive;

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
        // Ensure modified_date is set to "now" when saving changes
        payload["modified_date"] = new Date().toISOString();
        const json = await http<{ data: any }>(`${BASE}/${id}`, {
            method: "PATCH",
            body: JSON.stringify(payload),
        });
        return toUI(json.data);
    },

    async deleteSalesman(id) {
        throw new Error("Delete salesman is disabled");
    },
});