// src/modules/inventory-management/InventoryModuleManagement.tsx
import InventoryListView from "./components/InventoryList";
import { fetchInventory } from "./provider/HttpDataProvider";

export default async function InventoryModuleManagement() {
    const inventory = await fetchInventory(); // fetch full inventory once
    const pageSize = 15;

    return (
        <InventoryListView
            initialData={inventory}
            currentPage={1}      // default page
            pageSize={pageSize}
            totalItems={inventory.length}
        />
    );
}
