// src/modules/salesman-management/types.ts
export type Salesman = {
    id: number | string;
    code?: string | null;
    name: string;
    email?: string | null;
    phone?: string | null;
    territory?: string | null;
    truck_plate?: string | null;
    branch_code?: string | number | null;
    isActive?: boolean;
    hireDate?: string | null; // ISO string
    targetMonthly?: number | null; // Sales target
    totalSalesYTD?: number | null; // Year-to-date sales
};

export type UpsertSalesmanDTO = Partial<Omit<Salesman, "id">> & { name: string };
