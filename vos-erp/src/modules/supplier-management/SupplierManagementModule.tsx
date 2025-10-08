"use client";
import { fetchProvider } from "./providers/fetchProvider";
import { SuppliersView } from "./components/SuppliersView";
import { DataProvider } from "./providers/DataProvider";

export function SupplierManagementModule() {
  const provider = fetchProvider() as DataProvider;
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Supplier Management</h1>
        <p className="text-base text-muted-foreground">
          Manage your HVAC supplier relationships and track performance
        </p>
      </div>
      <SuppliersView provider={provider} />
    </div>
  );
}
