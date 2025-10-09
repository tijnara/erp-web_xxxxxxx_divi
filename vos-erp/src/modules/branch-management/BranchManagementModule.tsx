"use client";

import { useState } from "react";
import { HeaderTabs } from "./components/HeaderTabs";
import { BranchesView } from "./components/BranchesView";
import { fetchProvider } from "./providers/fetchProvider";

export function BranchManagementModule() {
    const provider = fetchProvider();
    const [tab, setTab] = useState<"branches">("branches");

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-2xl font-bold">Branch Management</h1>
                <p className="text-base text-muted-foreground">
                    Manage your branch relationships and track performance
                </p>
            </div>
            <HeaderTabs tab={tab} onChange={setTab} />
            <div className="mt-4">
                {tab === "branches" && <BranchesView provider={provider} />}
            </div>
        </div>
    );
}
