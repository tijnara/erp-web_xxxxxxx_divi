"use client";
import { fetchProvider } from "./providers/fetchProvider";
import { SuppliersView } from "./components/SuppliersView";

export function SupplierManagementModule() {
  return <SuppliersView provider={fetchProvider()} />;
}

