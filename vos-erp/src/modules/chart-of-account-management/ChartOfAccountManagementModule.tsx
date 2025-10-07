"use client";

import { useState } from "react";
import { HeaderTabs } from "./components/HeaderTabs";
import { ChartOfAccountsView } from "./components/ChartOfAccountsView";
import { fetchProvider } from "./providers/fetchProvider";

export function ChartOfAccountManagementModule() {
    const provider = fetchProvider();
    const [tab, setTab] = useState<"chart-of-accounts">("chart-of-accounts");

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-2xl font-bold">Chart of Account Management</h1>
                <p className="text-base text-muted-foreground">
                    Manage your chart of accounts
                </p>
            </div>
            <HeaderTabs tab={tab} onChange={setTab} />
            <div className="mt-4">
                {tab === "chart-of-accounts" && <ChartOfAccountsView provider={provider} />}
            </div>
        </div>
    );
}
