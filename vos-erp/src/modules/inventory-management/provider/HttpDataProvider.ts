import { supabase } from "../../../lib/supabase";
import { InventoryItem } from "../types";

export async function fetchInventory(): Promise<InventoryItem[]> {
    // Fetch inventory and join related tables (products, branches)
    const { data, error } = await supabase
        .from("inventory")
        .select(`
            quantity,
            reserved_quantity,
            last_restock_date,
            last_updated,
            products (
                product_id,
                product_name,
                product_code,
                cost_per_unit,
                price_per_unit,
                product_brand,
                product_category
            ),
            branches (
                id,
                branch_name
            )
        `);

    if (error) {
        console.error("Error fetching inventory:", error);
        return [];
    }

    // Map the nested Supabase response to your flat InventoryItem type
    return (data ?? []).map((row: any) => {
        const p = row.products;
        const b = row.branches;
        return {
            branch_id: b?.id,
            branch_name: b?.branch_name || "Unknown Branch",
            product_id: p?.product_id,
            product_name: p?.product_name,
            product_code: p?.product_code || "",
            product_category: p?.product_category ?? "Uncategorized",
            product_brand: p?.product_brand || "",
            cost_per_unit: p?.cost_per_unit || 0,
            price_per_unit: p?.price_per_unit || 0,
            quantity: row.quantity || 0,
            reserved_quantity: row.reserved_quantity || 0,
            available_quantity: (row.quantity || 0) - (row.reserved_quantity || 0),
            last_restock_date: row.last_restock_date || "",
            last_updated: row.last_updated || "",
            supplier_id: row.supplier_id ?? 0,
            ordered_quantity: row.ordered_quantity ?? 0,
        };
    });
}
