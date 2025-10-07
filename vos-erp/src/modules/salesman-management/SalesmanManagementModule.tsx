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
        <div className="space-y-4">
            <div>
                <h1 className="text-2xl font-bold">Salesman Management</h1>
                <p className="text-base text-muted-foreground">
                    Manage your salesman relationships and track performance
                </p>
            </div>
            <HeaderTabs tab={tab} onChange={setTab} />
            <div className="mt-4">
                {tab === "salesmen" && <SalesmenView provider={provider} />}
            </div>
        </div>
    );
}
