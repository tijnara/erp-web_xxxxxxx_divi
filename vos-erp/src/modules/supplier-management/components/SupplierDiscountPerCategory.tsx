// src/modules/supplier-management/components/SupplierDiscountPerCategory.tsx
"use client";

import { useEffect, useState } from "react";
import type { Supplier, SupplierDiscountCategory as SupplierDiscountCategoryType } from "../types";
import { fetchProvider } from "../providers/fetchProvider";
import { Button } from "@/components/ui/button";
import { SupplierDiscountCategoryFormDialog } from "./SupplierDiscountCategoryFormDialog";

export function SupplierDiscountPerCategory({
  supplier,
  provider,
}: {
  supplier: Supplier;
  provider: ReturnType<typeof fetchProvider>;
}) {
  const [discounts, setDiscounts] = useState<SupplierDiscountCategoryType[]>([]);
  const [categoryMap, setCategoryMap] = useState<Record<number, string>>({});
  const [lineDiscountMap, setLineDiscountMap] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const fetchDiscounts = () => {
    setLoading(true);
    provider.listSupplierDiscountCategories(supplier.id as number)
      .then(async (discountItems) => {
        setDiscounts(discountItems);
        if (discountItems.length > 0) {
          const categoryIds = [...new Set(discountItems.map(d => d.category_id))];
          const lineDiscountIds = [...new Set(discountItems.map(d => d.line_discount_id))];

          const [categories, lineDiscounts] = await Promise.all([
            provider.listCategories(categoryIds),
            provider.listLineDiscounts(lineDiscountIds),
          ]);

          const newCategoryMap = categories.reduce((acc, category) => {
            acc[category.category_id] = category.category_name;
            return acc;
          }, {} as Record<number, string>);
          setCategoryMap(newCategoryMap);

          const newLineDiscountMap = lineDiscounts.reduce((acc, ld) => {
            acc[ld.id] = ld.line_discount;
            return acc;
          }, {} as Record<number, string>);
          setLineDiscountMap(newLineDiscountMap);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (supplier) {
      fetchDiscounts();
    }
  }, [supplier, provider]);

  const handleAddDiscount = async (data: { category_id: number; line_discount_id: number; }) => {
    await provider.createSupplierDiscountCategory({
      ...data,
      supplier_id: supplier.id as number,
    });
    fetchDiscounts();
  };

  const StatItem = ({ label, value }: { label: string; value: number }) => (
    <div className="flex items-baseline gap-2">
      <div className="text-blue-600 text-xl font-semibold">{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );

  return (
    <div>
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Supplier Discount per Category</h3>
          <p className="text-sm text-muted-foreground">
            Manage discounts for specific categories for {supplier.supplier_name}.
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>+ Add Discount</Button>
      </div>

      {loading ? (
        <div className="p-4 border border-dashed border-gray-300 rounded-lg mt-4">
          <p className="text-center text-gray-500">Loading discounts...</p>
        </div>
      ) : (
        <>
          {discounts.length === 0 ? (
            <div className="p-4 border border-dashed border-gray-300 rounded-lg mt-4">
              <p className="text-center text-gray-500">No discounts found for this supplier.</p>
            </div>
          ) : (
            <div className="overflow-hidden border border-gray-200 rounded-xl mt-4">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="text-left p-3 font-medium">Category Name</th>
                    <th className="text-left p-3 font-medium">Discount</th>
                    <th className="text-left p-3 font-medium">Created At</th>
                  </tr>
                </thead>
                <tbody>
                  {discounts.map((d) => (
                    <tr key={d.id} className="border-t hover:bg-gray-50">
                      <td className="p-3">{categoryMap[d.category_id] || d.category_id}</td>
                      <td className="p-3">{lineDiscountMap[d.line_discount_id] || d.line_discount_id}</td>
                      <td className="p-3">{new Date(d.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-4">
            <StatItem label="Total Categories" value={discounts.length} />
          </div>
        </>
      )}
      <SupplierDiscountCategoryFormDialog
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleAddDiscount}
        supplier={supplier}
        provider={provider}
      />
    </div>
  );
}

