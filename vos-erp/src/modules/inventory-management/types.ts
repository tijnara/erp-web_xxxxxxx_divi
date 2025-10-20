export interface InventoryItem {
    branch_id: number;
    branch_name: string;
    product_id: number;
    product_code: string;
    product_name: string;
    product_category: number | string;
    product_brand: number | string;
    cost_per_unit: number;
    price_per_unit: number;
    quantity: number;
    reserved_quantity: number;
    available_quantity: number;
    last_restock_date: string;
    last_updated: string;
    supplier_id: number; // add this
    ordered_quantity?: number; // ✅ add this


}
