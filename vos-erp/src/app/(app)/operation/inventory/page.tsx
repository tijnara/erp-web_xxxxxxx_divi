// src/app/(app)/operation/inventory/page.tsx
import InventoryModuleManagement from "@/modules/inventory-management/InventoryModuleManagement";

interface InventoryPageProps {
    searchParams?: { page?: string };
}

export default function InventoryPage({ searchParams }: InventoryPageProps) {
    return <InventoryModuleManagement searchParams={searchParams} />;
}
