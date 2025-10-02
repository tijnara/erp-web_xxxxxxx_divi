// src/modules/salesman-management/SalesmanManagementModule.tsx
"use client";

import { useState } from "react";
import { HeaderTabs } from "./components/HeaderTabs";
import { SalesmenView } from "./components/SalesmenView";
import { fetchProvider } from "./providers/fetchProvider";

export function SalesmanManagementModule() {
    const provider = fetchProvider();
    const [tab, setTab] = useState<"salesmen">("salesmen");

    return (
        <div className="mx-auto max-w-6xl">
            <HeaderTabs tab={tab} onChange={setTab} />
            <div className="mt-4">
                {tab === "salesmen" && <SalesmenView provider={provider} />}
            </div>
        </div>
    );
}
