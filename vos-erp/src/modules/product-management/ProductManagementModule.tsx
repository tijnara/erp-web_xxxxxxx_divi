"use client";

import { useEffect, useState } from "react";
import { HeaderTabs } from "./components/HeaderTabs";
import { ProductsView } from "./components/ProductsView";
import { PricingView } from "./components/PricingView";
import { PriceTypesView } from "./components/PriceTypesView";
import { demoMemoryProvider } from "./providers/demoMemoryProvider";

export function ProductManagementModule() {
    const provider = demoMemoryProvider(); // ✅ now created on client
    const [tab, setTab] = useState<"products" | "pricing" | "types">("products");

    const [priceTypesReady, setPriceTypesReady] = useState(false);
    useEffect(() => {
        provider.listPriceTypes().then(() => setPriceTypesReady(true));
    }, [provider]);

    return (
        <div className="mx-auto max-w-6xl">
            <HeaderTabs tab={tab} onChange={setTab} />
            <div className="mt-4">
                {tab === "products" && <ProductsView provider={provider} />}
                {tab === "pricing" && (
                    <PricingView provider={provider} priceTypesPreloaded={priceTypesReady} />
                )}
                {tab === "types" && <PriceTypesView provider={provider} />}
            </div>
        </div>
    );
}
