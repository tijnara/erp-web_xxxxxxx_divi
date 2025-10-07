import type { DataProvider, ListParams } from "./DataProvider";
import type { ChartOfAccount, UpsertChartOfAccountDTO } from "../types";

const BASE = "http://100.119.3.44:8090/items/chart_of_accounts";

function toUI(row: any): ChartOfAccount {
    return {
        coa_id: row.coa_id,
        gl_code: row.gl_code,
        account_title: row.account_title,
        bsis_code: row.bsis_code,
        account_type: row.account_type,
        balance_type: row.balance_type,
        description: row.description,
        memo_type: row.memo_type,
        date_added: row.date_added,
        added_by: row.added_by,
        isPayment: row.isPayment,
        is_payment: row.is_payment,
    };
}

function toAPI(dto: UpsertChartOfAccountDTO): Record<string, any> {
    const body: Record<string, any> = {};

    if (dto.account_title !== undefined) body["account_title"] = dto.account_title;
    if (dto.gl_code !== undefined) body["gl_code"] = dto.gl_code;
    if (dto.bsis_code !== undefined) body["bsis_code"] = dto.bsis_code;
    if (dto.account_type !== undefined) body["account_type"] = dto.account_type;
    if (dto.balance_type !== undefined) body["balance_type"] = dto.balance_type;
    if (dto.description !== undefined) body["description"] = dto.description;
    if (dto.memo_type !== undefined) body["memo_type"] = dto.memo_type;
    if (dto.is_payment !== undefined) body["is_payment"] = dto.is_payment;
    if (dto.added_by !== undefined) body["added_by"] = dto.added_by;

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
    async listChartOfAccounts({ q, limit = 20, offset = 0 }: ListParams) {
        const url = new URL(BASE);
        if (q && q.trim().length > 0) url.searchParams.set("search", q.trim());
        url.searchParams.set("limit", String(limit));
        url.searchParams.set("offset", String(offset));
        url.searchParams.set("meta", "filter_count");

        const json = await http<{ data: any[], meta: { filter_count: number } }>(url.toString());
        const items = (json.data || []).map(toUI);
        return { items, total: json.meta?.filter_count ?? items.length };
    },

    async getChartOfAccount(id) {
        const url = `${BASE}/${id}`;
        const json = await http<{ data: any }>(url);
        return toUI(json.data);
    },

    async createChartOfAccount(data) {
        const body = toAPI(data);
        const json = await http<{ data: any }>(BASE, {
            method: "POST",
            body: JSON.stringify(body),
        });
        return toUI(json.data);
    },

    async updateChartOfAccount(id, data) {
        const body = toAPI(data);
        const url = `${BASE}/${id}`;
        const json = await http<{ data: any }>(url, {
            method: "PATCH",
            body: JSON.stringify(body),
        });
        return toUI(json.data);
    },

    async deleteChartOfAccount(id) {
        const url = `${BASE}/${id}`;
        await http(url, { method: "DELETE" });
    },
});
