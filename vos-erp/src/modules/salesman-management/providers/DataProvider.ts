// src/modules/salesman-management/providers/DataProvider.ts
import type { Salesman, UpsertSalesmanDTO } from "../types";

export type ListParams = {
    q?: string;
    limit?: number;
    offset?: number;
};

export interface DataProvider {
    listSalesmen(params: ListParams): Promise<{ items: Salesman[]; total: number }>;
    getSalesman(id: string | number): Promise<Salesman>;
    createSalesman(data: UpsertSalesmanDTO): Promise<Salesman>;
    updateSalesman(id: string | number, data: UpsertSalesmanDTO): Promise<Salesman>;
    deleteSalesman(id: string | number): Promise<void>;
}
