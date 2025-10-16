const API_BASE = 'http://100.119.3.44:8090/items';

interface ListParams {
    q?: string;
    limit?: number;
    offset?: number;
}

export function fetchProvider() {
    return {
        async getPurchaseOrder(id: number) {
            const response = await fetch(`${API_BASE}/purchase_order/${id}`);
            if (!response.ok) throw new Error("Failed to fetch purchase order");
            return response.json();
        },

        async listPurchaseOrders({ q = "", limit = 20, offset = 0 }: ListParams) {
            const params = new URLSearchParams({
                limit: String(limit),
                offset: String(offset),
                ...(q ? { search: q } : {}),
            });

            const response = await fetch(`${API_BASE}/purchase_order?${params}`);
            if (!response.ok) throw new Error("Failed to list purchase orders");
            const json = await response.json();
            return {
                items: json.data || [],
                total: json.data?.length || 0,
            };
        },

        async createPurchaseOrder(data: any) {
            const lastResponse = await fetch(`${API_BASE}/purchase_order?limit=1&sort=-purchase_order_no`);
            const lastJson = await lastResponse.json();
            const lastPONumber = lastJson.data?.[0]?.purchase_order_no || "PO-2025-1112";

            const lastNumber = parseInt(lastPONumber.split('-').pop(), 10);
            data.purchase_order_no = `PO-2025-${(lastNumber + 1).toString().padStart(4, '0')}`;

            const response = await fetch(`${API_BASE}/purchase_order`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            });
            if (!response.ok) throw new Error("Failed to create purchase order");
            return response.json();
        },

        async updatePurchaseOrder(id: number, data: any) {
            const response = await fetch(`${API_BASE}/purchase_order/${id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            });
            if (!response.ok) throw new Error("Failed to update purchase order");
            return response.json();
        },

        async deletePurchaseOrder(id: number) {
            const response = await fetch(`${API_BASE}/purchase_order/${id}`, {
                method: "DELETE",
            });
            if (!response.ok) throw new Error("Failed to delete purchase order");
            return { success: true };
        },

        async listSuppliers() {
            const response = await fetch(`${API_BASE}/suppliers`);
            const json = await response.json();
            return json.data || [];
        },

        async listPaymentTerms() {
            const response = await fetch(`${API_BASE}/payment_terms`);
            const json = await response.json();
            return json.data || [];
        },

        async listReceivingTypes() {
            const response = await fetch(`${API_BASE}/receiving_type`);
            const json = await response.json();
            return json.data || [];
        },
    };
}