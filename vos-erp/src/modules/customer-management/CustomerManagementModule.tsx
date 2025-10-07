// src/modules/customer-management/CustomerManagementModule.tsx
"use client";

import { useState } from "react";
import { CustomerView } from "./components/CustomerView";
import { fetchProvider } from "./providers/fetchProvider";

export function CustomerManagementModule() {
  const provider = fetchProvider();
  const [tab] = useState<"customers">("customers");
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Customer Management</h1>
        <p className="text-base text-muted-foreground">
          Manage your customer relationships and track performance
        </p>
      </div>
      {tab === "customers" && <CustomerView provider={provider} />}
    </div>
  );
}
