// src/modules/customer-management/CustomerManagementModule.tsx
"use client";

import { useState } from "react";
import { CustomerView } from "./components/CustomerView";
import { fetchProvider } from "./providers/fetchProvider";

export function CustomerManagementModule() {
  const provider = fetchProvider();
  const [tab] = useState<"customers">("customers");
  return (
    <div className="mx-auto max-w-6xl">
      <div className="border-b mb-4">
        <div className="flex gap-4">
          <button className="px-3 py-2 text-sm font-medium text-black border-b-2 border-black">Customers</button>
        </div>
      </div>
      {tab === "customers" && <CustomerView provider={provider} />}
    </div>
  );
}
