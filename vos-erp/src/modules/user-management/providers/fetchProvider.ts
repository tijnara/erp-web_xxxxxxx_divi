// src/modules/user-management/providers/fetchProvider.ts
import type { DataProvider, ListParams } from "./DataProvider";
import type { User, UpsertUserDTO } from "../types";
import { itemsUrl } from "../../../config/api";

const BASE = itemsUrl("user");

function toUI(row: any): User {
    return {
        user_id: row.user_id,
        user_email: row.user_email,
        user_fname: row.user_fname,
        user_mname: row.user_mname,
        user_lname: row.user_lname,
        user_contact: row.user_contact,
        user_province: row.user_province,
        user_city: row.user_city,
        user_brgy: row.user_brgy,
        user_department: row.user_department,
        user_position: row.user_position,
        user_dateOfHire: row.user_dateOfHire,
        isAdmin: row.isAdmin,
        user_sss: row.user_sss,
        user_philhealth: row.user_philhealth,
        user_tin: row.user_tin,
        user_tags: row.user_tags,
        user_bday: row.user_bday,
        role_id: row.role_id,
        rf_id: row.rf_id,
    };
}

function toAPI(dto: UpsertUserDTO): Record<string, any> {
    const body: Record<string, any> = {};
    if (dto.user_email !== undefined) body["user_email"] = dto.user_email;
    if (dto.user_password !== undefined) body["user_password"] = dto.user_password;
    if (dto.user_fname !== undefined) body["user_fname"] = dto.user_fname;
    if (dto.user_mname !== undefined) body["user_mname"] = dto.user_mname;
    if (dto.user_lname !== undefined) body["user_lname"] = dto.user_lname;
    if (dto.user_contact !== undefined) body["user_contact"] = dto.user_contact;
    if (dto.user_province !== undefined) body["user_province"] = dto.user_province;
    if (dto.user_city !== undefined) body["user_city"] = dto.user_city;
    if (dto.user_brgy !== undefined) body["user_brgy"] = dto.user_brgy;
    if (dto.user_department !== undefined) body["user_department"] = dto.user_department;
    if (dto.user_position !== undefined) body["user_position"] = dto.user_position;
    if (dto.user_dateOfHire !== undefined) body["user_dateOfHire"] = dto.user_dateOfHire;
    if (dto.isAdmin !== undefined) body["isAdmin"] = dto.isAdmin;
    if (dto.user_sss !== undefined) body["user_sss"] = dto.user_sss;
    if (dto.user_philhealth !== undefined) body["user_philhealth"] = dto.user_philhealth;
    if (dto.user_tin !== undefined) body["user_tin"] = dto.user_tin;
    if (dto.user_tags !== undefined) body["user_tags"] = dto.user_tags;
    if (dto.user_bday !== undefined) body["user_bday"] = dto.user_bday;
    if (dto.role_id !== undefined) body["role_id"] = dto.role_id;
    if (dto.rf_id !== undefined) body["rf_id"] = dto.rf_id;
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
    async listUsers({ q, limit = 20, offset = 0 }: ListParams) {
        const url = new URL(BASE);
        if (q && q.trim().length > 0) url.searchParams.set("search", q.trim());
        url.searchParams.set("limit", String(limit));
        url.searchParams.set("offset", String(offset));
        url.searchParams.set("meta", "filter_count");

        const json = await http<{ data: any[], meta: { filter_count: number } }>(url.toString());
        const items = (json.data || []).map(toUI);
        return { items, total: json.meta?.filter_count ?? items.length };
    },

    async getUser(id) {
        const url = new URL(`${BASE}/${id}`);
        const json = await http<{ data: any }>(url.toString());
        return toUI(json.data);
    },

    async createUser(data) {
        // Validation: Ensure required fields are present
        if (!data || typeof data !== "object" || !data.user_email || !data.user_fname || !data.user_lname) {
            console.error("Validation failed: Missing required user fields.", data);
            throw new Error("Missing required user fields (user_email, user_fname, user_lname)");
        }
        try {
            // Timeout configuration
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 10000); // 10 seconds
            const json = await http<{ data: any }>(BASE, {
                method: "POST",
                body: JSON.stringify(toAPI(data)),
                signal: controller.signal,
            });
            clearTimeout(timeout);
            // Response handling
            if (!json || !json.data) {
                console.error("Invalid response structure", json);
                throw new Error("Invalid response structure: missing 'data'");
            }
            console.log("User created successfully:", json.data);
            return toUI(json.data);
        } catch (error) {
            console.error("Error creating user:", error);
            throw error;
        }
    },

    async updateUser(id, data) {
        const json = await http<{ data: any }>(`${BASE}/${id}`, {
            method: "PATCH",
            body: JSON.stringify(toAPI(data)),
        });
        return toUI(json.data);
    },

    async deleteUser(id) {
        await http(`${BASE}/${id}`, { method: "DELETE" });
    },
});
