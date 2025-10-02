// src/modules/salesman-management/providers/demoMemoryProvider.ts
import type { DataProvider, ListParams } from "./DataProvider";
import type { Salesman, UpsertSalesmanDTO } from "../types";

export const demoMemoryProvider = (): DataProvider => {
    let salesmen: Salesman[] = [
        {
            id: 1,
            code: "SM-001",
            name: "Juan Dela Cruz",
            email: "juan@example.com",
            phone: "+63 900 111 2222",
            territory: "NCR",
            isActive: true,
            hireDate: "2022-05-03",
            targetMonthly: 500000,
            totalSalesYTD: 3200000,
        },
        {
            id: 2,
            code: "SM-002",
            name: "Maria Santos",
            email: "maria@example.com",
            phone: "+63 900 333 4444",
            territory: "CALABARZON",
            isActive: true,
            hireDate: "2023-01-15",
            targetMonthly: 300000,
            totalSalesYTD: 1100000,
        },
    ];

    const nextId = () => Math.max(0, ...salesmen.map((s) => Number(s.id))) + 1;

    return {
        async listSalesmen({ q, limit = 50, offset = 0 }: ListParams) {
            let items = salesmen;
            if (q) {
                const needle = q.toLowerCase();
                items = items.filter((s) =>
                    [s.name, s.code, s.email, s.phone, s.territory]
                        .map((v) => (v ?? "").toLowerCase())
                        .some((v) => v.includes(needle))
                );
            }
            return { items: items.slice(offset, offset + limit), total: items.length };
        },

        async getSalesman(id) {
            return salesmen.find((s) => String(s.id) === String(id))!;
        },

        async createSalesman(data: UpsertSalesmanDTO) {
            const s: Salesman = { id: nextId(), isActive: true, ...data };
            salesmen.unshift(s);
            return s;
        },

        async updateSalesman(id, data) {
            const i = salesmen.findIndex((s) => String(s.id) === String(id));
            salesmen[i] = { ...salesmen[i], ...data };
            return salesmen[i];
        },

        async deleteSalesman(id) {
            throw new Error("Delete salesman is disabled");
        },
    };
};
