const API_BASE = 'http://100.119.3.44:8090/items';

interface ListParams {
  q?: string;
  limit?: number;
  offset?: number;
}

export function fetchProvider() {
  return {
    async listPurchaseOrders({ q = "", limit = 20, offset = 0 }: ListParams) {
      const params = new URLSearchParams({
        limit: String(limit),
        offset: String(offset),
        ...(q ? { search: q } : {}),
      });

      const response = await fetch(`${API_BASE}/purchase_order?${params}`);
      const json = await response.json();
      return {
        items: json.data || [],
        total: json.data?.length || 0,
      };
    },

    async createPurchaseOrder(data: any) {
      const response = await fetch(`${API_BASE}/purchase_order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
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
      return response.json();
    },

    async listSuppliers() {
      const response = await fetch(`${API_BASE}/suppliers`);
      const json = await response.json();
      return json.data || [];
    },

    async listPaymentMethods() {
      const response = await fetch(`${API_BASE}/payment_methods`);
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
