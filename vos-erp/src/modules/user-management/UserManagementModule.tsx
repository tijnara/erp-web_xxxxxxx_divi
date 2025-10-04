"use client";

import { useMemo } from "react";
import { fetchProvider } from "./providers/fetchProvider";
import { UsersView } from "./components/UsersView";

export function UserManagementModule() {
    const provider = useMemo(() => fetchProvider(), []);
    return <UsersView provider={provider} />;
}

