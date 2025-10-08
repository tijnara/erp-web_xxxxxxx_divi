// src/modules/customer-management/components/CustomerDiscountFormDialog.tsx
"use client";

import { useEffect, useState } from "react";
import { Modal } from "../../../components/ui/Modal";
import { Button } from "../../../components/ui/button";
import { fetchProvider } from "../providers/fetchProvider";
import type { Customer } from "../types";

type Product = { product_id: number; product_name: string };
type LineDiscount = { id: number; line_discount: string };

export function CustomerDiscountFormDialog({
  open,
  onClose,
  onSubmit,
  customer,
  provider,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { product_id: number; line_discount_id: number }) => void;
  customer: Customer;
  provider: ReturnType<typeof fetchProvider>;
}) {
  const [productId, setProductId] = useState<number | null>(null);
  const [lineDiscountId, setLineDiscountId] = useState<number | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [lineDiscounts, setLineDiscounts] = useState<LineDiscount[]>([]);

  useEffect(() => {
    if (open) {
      provider.listProducts([]).then(setProducts); // Fetch all products initially
      provider.listLineDiscounts([]).then(setLineDiscounts); // Fetch all line discounts
    }
  }, [open, provider]);

  const handleSubmit = () => {
    if (productId && lineDiscountId) {
      onSubmit({
        product_id: productId,
        line_discount_id: lineDiscountId,
      });
      onClose();
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={`Add Discount for ${customer.customer_name}`}>
      <div className="space-y-4 p-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Product</label>
          <select
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            onChange={(e) => setProductId(Number(e.target.value))}
            value={productId ?? ""}
          >
            <option value="" disabled>Select a product</option>
            {products.map((p) => (
              <option key={p.product_id} value={p.product_id}>
                {p.product_name}
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
          <Button onClick={handleSubmit} disabled={!productId || !lineDiscountId}>Add Discount</Button>
        </div>
      </div>
    </Modal>
  );
}

