// src/modules/customer-management/components/CustomerDiscountPerCategory.tsx
"use client";

import { useEffect, useState } from "react";
import type { Customer, CustomerDiscountCategory as CustomerDiscountCategoryType } from "../types";
import { fetchProvider } from "../providers/fetchProvider";
import { Button } from "../../../components/ui/button";
import { CustomerDiscountCategoryFormDialog } from "./CustomerDiscountCategoryFormDialog";

export function CustomerDiscountPerCategory({
  customer,
  provider,
}: {
  customer: Customer;
  provider: ReturnType<typeof fetchProvider>;
}) {
  const [discounts, setDiscounts] = useState<CustomerDiscountCategoryType[]>([]);
  const [categoryMap, setCategoryMap] = useState<Record<number, string>>({});
  const [lineDiscountMap, setLineDiscountMap] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const fetchDiscounts = () => {
    if (customer) {
      setLoading(true);
      provider.listCustomerDiscountCategories(customer.id as number)
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
    }
  };

  useEffect(() => {
    fetchDiscounts();
  }, [customer, provider]);

  const handleAddDiscount = async (data: { category_id: number; line_discount_id: number }) => {
    await provider.createCustomerDiscountCategory({
      ...data,
      customer_id: customer.id as number,
    });
    fetchDiscounts(); // Refetch to show the new discount
  };

  return (
    <div>
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Customer Discount per Category</h3>
          <p className="text-sm text-muted-foreground">
            Manage discounts for specific categories for {customer.customer_name}.
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>Add Discount</Button>
      </div>

      {loading ? (
        <div className="p-4 border border-dashed border-gray-300 rounded-lg mt-4">
          <p className="text-center text-gray-500">Loading discounts...</p>
        </div>
      ) : discounts.length === 0 ? (
        <div className="p-4 border border-dashed border-gray-300 rounded-lg mt-4">
          <p className="text-center text-gray-500">No category discounts found for this customer.</p>
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
      <CustomerDiscountCategoryFormDialog
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleAddDiscount}
        customer={customer}
        provider={provider}
      />
    </div>
  );
}
