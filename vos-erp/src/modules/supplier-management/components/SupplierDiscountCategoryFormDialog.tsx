// src/modules/supplier-management/components/SupplierDiscountCategoryFormDialog.tsx
"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/button";
import { fetchProvider } from "../providers/fetchProvider";
import type { Supplier } from "../types";

type Category = { category_id: number; category_name: string };
type LineDiscount = { id: number; line_discount: string };

export function SupplierDiscountCategoryFormDialog({
  open,
  onClose,
  onSubmit,
  supplier,
  provider,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { category_id: number; line_discount_id: number }) => void;
  supplier: Supplier;
  provider: ReturnType<typeof fetchProvider>;
}) {
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [lineDiscountId, setLineDiscountId] = useState<number | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [lineDiscounts, setLineDiscounts] = useState<LineDiscount[]>([]);

  useEffect(() => {
    if (open) {
      provider.listCategories([]).then(setCategories); // Fetch all categories initially
      provider.listLineDiscounts([]).then(setLineDiscounts); // Fetch all line discounts
    }
  }, [open, provider]);

  const handleSubmit = () => {
    if (categoryId && lineDiscountId) {
      onSubmit({
        category_id: categoryId,
        line_discount_id: lineDiscountId,
      });
      onClose();
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={`Add Discount for ${supplier.supplier_name}`}>
      <div className="space-y-4 p-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Category</label>
          <select
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            onChange={(e) => setCategoryId(Number(e.target.value))}
            value={categoryId ?? ""}
          >
            <option value="" disabled>Select a category</option>
            {categories.map((c) => (
              <option key={c.category_id} value={c.category_id}>
                {c.category_name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Discount</label>
          <select
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            onChange={(e) => setLineDiscountId(Number(e.target.value))}
            value={lineDiscountId ?? ""}
          >
            <option value="" disabled>Select a discount</option>
            {lineDiscounts.map((ld) => (
              <option key={ld.id} value={ld.id}>
                {ld.line_discount}
              </option>
            ))}
          </select>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!categoryId || !lineDiscountId}>Add Discount</Button>
        </div>
      </div>
    </Modal>
  );
}

