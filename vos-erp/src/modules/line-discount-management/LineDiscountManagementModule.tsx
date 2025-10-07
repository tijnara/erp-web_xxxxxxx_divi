"use client";

import { useState } from "react";
import { LineDiscountView } from "./components/LineDiscountView";
import { fetchProvider } from "./providers/fetchProvider";

export function LineDiscountManagementModule() {
  const provider = fetchProvider();
  const [tab] = useState<"linediscounts">("linediscounts");
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Line Discount Management</h1>
        <p className="text-base text-muted-foreground">
          Manage your line discounts
        </p>
      </div>
      {tab === "linediscounts" && <LineDiscountView provider={provider} />}
    </div>
  );
}
