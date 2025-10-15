export interface Consumable {
    item_id: number;
    item_code: string;
    item_name: string;
    item_description?: string | null;
    category_id?: number | null;
    category_name?: string; // added for display convenience
    quantity: number;
    unit: string;
    date_added?: string;
    updated_at?: string;
}

export interface ConsumableCategory {
    category_id: number;
    category_name: string;
    category_description?: string;
}