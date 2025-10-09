"use client";

import { PurchaseOrderManagementModule } from "@/modules/purchase-order-management/PurchaseOrderManagementModule";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <div className="p-4 md:p-6">
      <PurchaseOrderManagementModule />
    </div>
  );
}
