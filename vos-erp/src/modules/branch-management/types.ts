export type Branch = {
    id: number | string;
    branch_name: string;
    branch_description?: string | null;
    branch_code: string;
    branch_head?: number | null;
    state_province?: string | null;
    city?: string | null;
    brgy?: string | null;
    phone_number?: string | null;
    postal_code?: string | null;
    date_added?: string | null; // ISO string
    isMoving?: boolean;
    isReturn?: boolean;
    isActive?: boolean;
};

export type UpsertBranchDTO = Partial<Omit<Branch, "id">> & { branch_name: string };
