"use client";
import { useState } from "react";
import DiscountTypeView from "./components/DiscountTypeView";
import {
  DiscountTypeManagementProvider,
  useDiscountTypeManagement,
} from "./providers/DiscountTypeManagementProvider";
import { Button } from "@/components/ui/button";
import { DiscountTypeFormDialog } from "./components/DiscountTypeFormDialog";
import StatBar from "./components/StatBar";
import type { DiscountType } from "./types";

function PageHeader() {
  const [open, setOpen] = useState(false);
  const { provider, fetchDiscountTypes } = useDiscountTypeManagement();
  return (
    <>
      <DiscountTypeFormDialog
        open={open}
        setOpen={setOpen}
        mode="create"
        current={null}
        provider={provider}
        onSuccess={() => {
          fetchDiscountTypes();
        }}
      />
      <div className="flex justify-between">
        <div>
          <h1 className="text-2xl font-bold">Discount Type Management</h1>
          <p className="text-base text-muted-foreground">
            Manage your discount types
          </p>
        </div>
        <div>
          <Button onClick={() => setOpen(true)}>Add Discount Type</Button>
        </div>
      </div>
    </>
  );
}

function SearchBar() {
  const { search } = useDiscountTypeManagement();
  return (
    <div className="flex items-center">
      <input
        type="text"
        placeholder="Search by name, shortcut, or contact person..."
        className="w-full px-3 py-2 border rounded-lg"
        onChange={(e) => search(e.target.value)}
      />
    </div>
  );
}

export function DiscountTypeManagementModule() {
  return (
    <DiscountTypeManagementProvider>
      <div className="space-y-4">
        <PageHeader />
        <SearchBar />
        <StatBar />
        <DiscountTypeView />
      </div>
    </DiscountTypeManagementProvider>
  );
}
