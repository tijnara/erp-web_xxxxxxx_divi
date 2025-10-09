// src/modules/supplier-management/components/SupplierDiscountPerProduct.tsx
"use client";

import { useEffect, useState } from "react";
import type { Supplier, SupplierDiscountProduct } from "../types";
import { fetchProvider } from "../providers/fetchProvider";
import { Button } from "../../../components/ui/button";
import { SupplierDiscountFormDialog } from "./SupplierDiscountFormDialog";

export function SupplierDiscountPerProduct({
  supplier,
  provider,
}: {
  supplier: Supplier;
  provider: ReturnType<typeof fetchProvider>;
}) {
  const [discounts, setDiscounts] = useState<SupplierDiscountProduct[]>([]);
  const [productMap, setProductMap] = useState<Record<number, string>>({});
  const [lineDiscountMap, setLineDiscountMap] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const fetchDiscounts = () => {
    setLoading(true);
    provider.listSupplierDiscountProducts(supplier.id as number)
      .then(async (discountItems) => {
        setDiscounts(discountItems);
        if (discountItems.length > 0) {
          const productIds = [...new Set(discountItems.map(d => d.product_id))];
          const lineDiscountIds = [...new Set(discountItems.map(d => d.line_discount_id))];

          const [products, lineDiscounts] = await Promise.all([
            provider.listProducts(productIds),
            provider.listLineDiscounts(lineDiscountIds),
          ]);

          const newProductMap = products.reduce((acc: Record<number, string>, product: { product_id: number; product_name: string }) => {
            acc[product.product_id] = product.product_name;
            return acc;
          }, {});
          setProductMap(newProductMap);

          const newLineDiscountMap = lineDiscounts.reduce((acc: Record<number, string>, ld: { id: number; line_discount: string }) => {
            acc[ld.id] = ld.line_discount;
            return acc;
          }, {});
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

  const handleAddDiscount = async (data: { product_id: number; line_discount_id: number; }) => {
    if (!supplier?.id) {
      alert("Supplier ID is missing. Cannot submit discount.");
      return;
    }
    await provider.createSupplierDiscountProduct({
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
          <h3 className="text-lg font-semibold">Supplier Discount per Product</h3>
          <p className="text-sm text-muted-foreground">
            Manage discounts for specific products for {supplier.supplier_name}.
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
                    <th className="text-left p-3 font-medium">Product Name</th>
                    <th className="text-left p-3 font-medium">Discount</th>
                    <th className="text-left p-3 font-medium">Created At</th>
                  </tr>
                </thead>
                <tbody>
                  {discounts.map((d) => (
                    <tr key={d.id} className="border-t hover:bg-gray-50">
                      <td className="p-3">{productMap[d.product_id] || d.product_id}</td>
                      <td className="p-3">{lineDiscountMap[d.line_discount_id] || d.line_discount_id}</td>
                      <td className="p-3">{new Date(d.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-4">
            <StatItem label="Total Products" value={discounts.length} />
          </div>
        </>
      )}
      <SupplierDiscountFormDialog
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleAddDiscount}
        supplier={supplier}
        provider={provider}
      />
    </div>
  );
}
