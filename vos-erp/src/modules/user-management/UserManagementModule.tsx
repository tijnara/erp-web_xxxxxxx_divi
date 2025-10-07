"use client";

import { useMemo } from "react";
import { fetchProvider } from "./providers/fetchProvider";
import { UsersView } from "./components/UsersView";

export function UserManagementModule() {
    const provider = useMemo(() => fetchProvider(), []);
    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-2xl font-bold">User Management</h1>
                <p className="text-base text-muted-foreground">
                    Manage your user relationships and track performance
                </p>
            </div>
            <UsersView provider={provider} />
        </div>
    );
}
