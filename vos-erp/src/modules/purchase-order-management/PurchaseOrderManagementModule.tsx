"use client";

import { useState } from "react";
import { PurchaseOrderView } from "./components/PurchaseOrderView";
import { fetchProvider } from "./providers/fetchProvider";

export function PurchaseOrderManagementModule() {
    const provider = fetchProvider();
    const [tab] = useState<"orders">("orders");

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-2xl font-bold">Purchase Order Management</h1>
                <p className="text-base text-muted-foreground">
                </p>
            </div>
            {tab === "orders" && <PurchaseOrderView />}
        </div>
    );
}