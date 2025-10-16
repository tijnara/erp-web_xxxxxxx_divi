import axios from "axios";
import { InventoryItem } from "../types";

export async function fetchInventory(): Promise<InventoryItem[]> {
    try {
        // Fetch inventory
        const inventoryRes = await axios.get("http://100.119.3.44:8090/items/inventory");
        const inventoryData = Array.isArray(inventoryRes.data) ? inventoryRes.data : inventoryRes.data?.data || [];

        // Fetch all products at once
        const productRes = await axios.get("http://100.119.3.44:8090/items/products");
        const productData = Array.isArray(productRes.data) ? productRes.data : productRes.data?.data || [];

        // Fetch all branches at once
        const branchRes = await axios.get("http://100.119.3.44:8090/items/branches");
        const branchData = Array.isArray(branchRes.data) ? branchRes.data : branchRes.data?.data || [];

        // Build maps for fast lookup
        const productMap = new Map<number | string, any>();
        productData.forEach((p: any) => {
            // Store product by id as number or string
            productMap.set(p.product_id, p);
            productMap.set(String(p.product_id), p);
            productMap.set(Number(p.product_id), p);
        });

        const branchMap = new Map<number | string, any>();
        branchData.forEach((b: any) => {
            branchMap.set(b.id, b);
            branchMap.set(String(b.id), b);
            branchMap.set(Number(b.id), b);
        });

        // Combine inventory with product name and branch name
        return inventoryData.map((inv: any) => {

            const product = productMap.get(inv.product_id) || {};
            const branch = branchMap.get(inv.branch_id) || {};

            return {
                branch_id: inv.branch_id,
                branch_name: branch.branch_name || "Unknown Branch",
                product_id: inv.product_id,
                product_name: product.product_name,
                product_code: product.product_code || "",
                product_category: product.product_category ?? "Uncategorized",
                product_brand: product.product_brand || "",
                cost_per_unit: product.cost_per_unit || 0,
                price_per_unit: product.price_per_unit || 0,
                quantity: inv.quantity || 0,
                reserved_quantity: inv.reserved_quantity || 0,
                available_quantity: (inv.quantity || 0) - (inv.reserved_quantity || 0),
                last_restock_date: inv.last_restock_date || "",
                last_updated: inv.last_updated || "",
            };
        });
    } catch (error) {
        console.error("Error fetching inventory:", error);
        return [];
    }
}
