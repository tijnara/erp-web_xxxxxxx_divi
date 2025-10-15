// src/modules/consumables-management/providers/HttpDataProvider.ts
import { Consumable, ConsumableCategory } from "../types";
import { ConsumablesDataAdapter } from "../adapter";

export class HttpDataProvider implements ConsumablesDataAdapter {
    baseUrl = "http://100.119.3.44:8090/items";

    async listConsumables(): Promise<Consumable[]> {
        const res = await fetch(`${this.baseUrl}/consumable_item`);
        if (!res.ok) throw new Error("Failed to fetch consumable items");
        const json = await res.json();
        // 🩹 FIX: unwrap `data` if present
        const data = Array.isArray(json) ? json : json.data || [];
        return data;
    }

    async createConsumable(data: Partial<Consumable>): Promise<Consumable> {
        try {
            const res = await fetch(`${this.baseUrl}/consumable_item`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            const text = await res.text();
            console.log("[CREATE] POST", `${this.baseUrl}/consumable_item`, "=>", res.status, text);

            if (!res.ok) {
                throw new Error(`Failed to create consumable item: ${res.status} ${text}`);
            }

            // parse JSON after checking ok
            return JSON.parse(text) as Consumable;
        } catch (err) {
            console.error("Create consumable error:", err);
            throw err;
        }
    }


    async createCategory(data: { category_name: string; category_description: string }) {
        const res = await fetch("http://100.119.3.44:8090/items/consumable_category", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Failed to create category");
        return res.json();
    }

    async deleteConsumable(id: number): Promise<void> {
        try {
            // Adjust the endpoint to match your backend
            const endpoint = `${this.baseUrl}/consumable_item/${id}`; // <-- double-check your API

            const res = await fetch(endpoint, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json", // some APIs require this even for DELETE
                    // "Authorization": `Bearer ${token}`, // uncomment if your API requires auth
                },
            });

            // Log full response for debugging
            const text = await res.text();
            console.log(`[DELETE] ${endpoint} => status: ${res.status}, body: ${text}`);

            if (!res.ok) {
                throw new Error(`Failed to delete consumable item: ${res.status} ${text}`);
            }
        } catch (err) {
            console.error("Delete error:", err);
            throw err; // re-throw so the UI alert still works
        }
    }


    async listCategories(): Promise<ConsumableCategory[]> {
        const res = await fetch(`${this.baseUrl}/consumable_category`);
        if (!res.ok) throw new Error("Failed to fetch consumable categories");

        // Explicitly type the JSON response to avoid 'never'
        const result: unknown = await res.json();

        // Handle both array and wrapped formats
        if (Array.isArray(result)) {
            return result as ConsumableCategory[];
        } else if (result && typeof result === "object" && "data" in result) {
            return (result as { data: ConsumableCategory[] }).data;
        }

        return [];
    }
    async updateConsumable(id: number, data: any) {
        const res = await fetch(`${this.baseUrl}/consumable_items/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });

        if (!res.ok) {
            const errText = await res.text();
            console.error("Update error:", errText);
            throw new Error("Failed to update consumable");
        }

        return res.json();
    }

}
