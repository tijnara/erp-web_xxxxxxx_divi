// src/modules/inventory-management/InventoryReportModule.tsx
import InventoryReport from "./components/InventoryReport";
import { fetchInventory } from "./provider/HttpDataProvider";

export default async function InventoryReportModule() {
    const inventory = await fetchInventory();

    return <InventoryReport inventory={inventory} lowStockThreshold={50} />;
}
