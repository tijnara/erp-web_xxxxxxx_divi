// src/modules/customer-management/components/CustomerDiscountBrandFormDialog.tsx
"use client";

import { useEffect, useState } from "react";
import { Modal } from "../../../components/ui/Modal";
import { Button } from "../../../components/ui/button";
import { fetchProvider } from "../providers/fetchProvider";
import type { Customer } from "../types";

type Brand = { brand_id: number; brand_name: string };
type LineDiscount = { id: number; line_discount: string };

export function CustomerDiscountBrandFormDialog({
  open,
  onClose,
  onSubmit,
  customer,
  provider,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { brand_id: number; line_discount_id: number }) => void;
  customer: Customer;
  provider: ReturnType<typeof fetchProvider>;
}) {
  const [brandId, setBrandId] = useState<number | null>(null);
  const [lineDiscountId, setLineDiscountId] = useState<number | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [lineDiscounts, setLineDiscounts] = useState<LineDiscount[]>([]);

  useEffect(() => {
    if (open) {
      // @ts-ignore
        provider.listBrands([]).then(setBrands);
      provider.listLineDiscounts([]).then(setLineDiscounts);
    }
  }, [open, provider]);

  const handleSubmit = () => {
    if (brandId && lineDiscountId) {
      onSubmit({
        brand_id: brandId,
        line_discount_id: lineDiscountId,
      });
      onClose();
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={`Add Brand Discount for ${customer.customer_name}`}>
      <div className="space-y-4 p-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Brand</label>
          <select
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            onChange={(e) => setBrandId(Number(e.target.value))}
            value={brandId ?? ""}
          >
            <option value="" disabled>Select a brand</option>
            {brands.map((b) => (
              <option key={`brand-${b.brand_id}`} value={b.brand_id}>
                {b.brand_name}
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
              <option key={`discount-${ld.id}`} value={ld.id}>
                {ld.line_discount}
              </option>
            ))}
          </select>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!brandId || !lineDiscountId}>Add Discount</Button>
        </div>
      </div>
    </Modal>
  );
}
