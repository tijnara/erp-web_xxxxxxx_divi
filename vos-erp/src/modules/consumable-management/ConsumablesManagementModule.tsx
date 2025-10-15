// src/modules/consumables-management/ConsumablesManagementModule.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { HeaderTabs } from "./components/HeaderTabs";
import { ConsumablesView } from "./components/ConsumablesView";
import { CategoriesView } from "./components/CategoriesView"; // 👈 add this import
import { HttpDataProvider } from "./providers/HttpDataProvider";

export function ConsumablesManagementModule() {
    const provider = useMemo(() => new HttpDataProvider(), []);
    const [tab, setTab] = useState<"consumables" | "categories" | "suppliers">("consumables");

    // preload categories to ensure the API is available
    const [dataReady, setDataReady] = useState(false);
    useEffect(() => {
        let alive = true;
        provider.listCategories().then(() => alive && setDataReady(true));
        return () => {
            alive = false;
        };
    }, [provider]);

    if (!dataReady) {
        return <p>Loading data...</p>;
    }

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-2xl font-bold">Consumables Management</h1>

            </div>

            <HeaderTabs tab={tab} onChange={setTab} />

            <div className="mt-4">
                {tab === "consumables" && <ConsumablesView provider={provider} />}
                {tab === "categories" && <CategoriesView provider={provider} />} {/* ✅ now showing categories */}
                {tab === "suppliers" && <p>Suppliers view coming soon...</p>}
            </div>
        </div>
    );
}
