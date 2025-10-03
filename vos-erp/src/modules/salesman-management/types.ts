// src/modules/salesman-management/types.ts
export type Salesman = {
    id: number | string;
    code?: string | null; // salesman_code
    name: string; // salesman_name
    employee_id?: number | null;
    encoder_id?: number | null; // NEW: encoder (current logged-in user)
    email?: string | null;
    phone?: string | null;
    territory?: string | null;
    truck_plate?: string | null;
    branch_code?: string | number | null;
    division_id?: number | string | null; // NEW: division reference
    operation?: number | string | null;
    company_code?: number | string | null;
    supplier_code?: number | string | null; // selected supplier id
    price_type?: number | string | null;
    isActive?: boolean;
    hireDate?: string | null; // ISO string
    targetMonthly?: number | null; // Sales target
    totalSalesYTD?: number | null; // Year-to-date sales
};

export type UpsertSalesmanDTO = Partial<Omit<Salesman, "id">> & { name: string };
