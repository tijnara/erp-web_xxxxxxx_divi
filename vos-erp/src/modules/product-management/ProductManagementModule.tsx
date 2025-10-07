// src/modules/product-management/ProductManagementModule.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { HeaderTabs } from "./components/HeaderTabs";
import { ProductsView } from "./components/ProductsView";
import { PricingView } from "./components/PricingView";
import { PriceTypesView } from "./components/PriceTypesView";

// ⬇️ use the real provider
import { HttpDataProvider } from "./providers/HttpDataProvider";

export function ProductManagementModule() {
    // create once per mount
    const provider = useMemo(() => new HttpDataProvider(), []);

    const [tab, setTab] = useState<"products" | "pricing" | "types">("products");

    const [priceTypesReady, setPriceTypesReady] = useState(false);
    useEffect(() => {
        let alive = true;
        provider.listPriceTypes().then(() => alive && setPriceTypesReady(true));
        return () => { alive = false; };
    }, [provider]);

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-2xl font-bold">Product Management</h1>
                <p className="text-base text-muted-foreground">
                </p>
            </div>
            <HeaderTabs tab={tab} onChange={setTab} />
            <div className="mt-4">
                {tab === "products" && <ProductsView provider={provider} />}
                {tab === "pricing"  && <PricingView provider={provider} priceTypesPreloaded={priceTypesReady} />}
                {tab === "types"    && <PriceTypesView provider={provider} />}
            </div>
        </div>
    );
}
