"use client";

import { useEffect, useState } from "react";
import { Dialog } from "@/components/ui/dialog";

interface PurchaseOrderFormDialogProps {
  mode: "create" | "edit";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  current: any | null;
  suppliers: any[];
  paymentMethods: any[];
  receivingTypes: any[];
  onSubmit: (data: any) => Promise<void>;
}

export function PurchaseOrderFormDialog({
  mode,
  open,
  onOpenChange,
  current,
  suppliers,
  paymentMethods,
  receivingTypes,
  onSubmit,
}: PurchaseOrderFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  const [formError, setFormError] = useState<string>("");
  const [priceTypes, setPriceTypes] = useState<any[]>([]);
  const [priceTypeLoading, setPriceTypeLoading] = useState(false);

  useEffect(() => {
    if (current?.supplier_id) {
      const supplier = suppliers.find(s => s.id === current.supplier_id);
      setSelectedSupplier(supplier || null);
    }
  }, [current, suppliers]);

  useEffect(() => {
    async function fetchPriceTypes() {
      setPriceTypeLoading(true);
      try {
        const res = await fetch("http://100.119.3.44:8090/items/price_types");
        const json = await res.json();
        setPriceTypes(json.data || []);
      } catch (err) {
        setPriceTypes([]);
      } finally {
        setPriceTypeLoading(false);
      }
    }
    if (open) fetchPriceTypes();
  }, [open]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError("");

    const formData = new FormData(e.currentTarget);
    const supplierId = formData.get("supplier_id");
    if (!supplierId) {
      setFormError("Please select a supplier.");
      setIsSubmitting(false);
      return;
    }
    const data = {
      supplier_id: Number(supplierId),
      reference: formData.get("reference"),
      remark: formData.get("remark"),
      barcode: formData.get("barcode"),
      receiving_type: Number(formData.get("receiving_type")),
      payment_type: Number(formData.get("payment_type")),
      price_type: Number(formData.get("price_type")),
      receipt_required: formData.get("receipt_required") === "on",
      date: formData.get("date"),
      total_amount: Number(formData.get("total_amount")),
      inventory_status: 0,
      payment_status: 1,
    };
    try {
      await onSubmit(data);
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <div className="fixed inset-0 z-50 flex items-start justify-center sm:items-center">
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" />
        <div className="z-50 grid w-full max-w-3xl gap-4 p-6 bg-background shadow-lg rounded-lg sm:rounded-xl border">
          <div className="flex flex-col space-y-1.5 text-center sm:text-left">
            <h2 className="text-lg font-semibold leading-none tracking-tight">
              {mode === "create" ? "Create Purchase Order" : "Edit Purchase Order"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {mode === "create"
                ? "Create a new purchase order"
                : "Edit existing purchase order details"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <div className="text-red-500 text-sm mb-2">{formError}</div>
            )}
            <div className="grid gap-4 md:grid-cols-2">
              {/* Supplier Field */}
              <div className="space-y-2">
                <label htmlFor="supplier_id" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Supplier
                </label>
                <select
                  id="supplier_id"
                  name="supplier_id"
                  required
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  defaultValue={current?.supplier_id}
                  onChange={(e) => {
                    const supplier = suppliers.find(s => s.id === Number(e.target.value));
                    setSelectedSupplier(supplier || null);
                  }}
                >
                  <option value="">Select a supplier</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.supplier_name}
                    </option>
                  ))}
                </select>
              </div>
              {/* Date Field */}
              <div className="space-y-2">
                <label htmlFor="date" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Date
                </label>
                <input
                  id="date"
                  type="date"
                  name="date"
                  required
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  defaultValue={current?.date || new Date().toISOString().split('T')[0]}
                />
              </div>
              {/* Reference Field */}
              <div className="space-y-2">
                <label htmlFor="reference" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Reference
                </label>
                <input
                  id="reference"
                  type="text"
                  name="reference"
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="e.g., Quote #123"
                  defaultValue={current?.reference}
                />
              </div>
              {/* Barcode Field */}
              <div className="space-y-2">
                <label htmlFor="barcode" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Barcode
                </label>
                <input
                  id="barcode"
                  type="text"
                  name="barcode"
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Optional barcode"
                  defaultValue={current?.barcode}
                />
              </div>
              {/* Price Type Field */}
              <div className="space-y-2">
                <label htmlFor="price_type" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Price Type
                </label>
                <select
                  id="price_type"
                  name="price_type"
                  required
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  defaultValue={current?.price_type || ""}
                  disabled={priceTypeLoading}
                >
                  <option value="">Select a price type</option>
                  {priceTypes.map((pt: any) => (
                    <option key={pt.price_type_id} value={pt.price_type_id}>
                      {pt.price_type_name}
                    </option>
                  ))}
                </select>
              </div>
              {/* Total Amount Field */}
              <div className="space-y-2">
                <label htmlFor="total_amount" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Total Amount
                </label>
                <input
                  id="total_amount"
                  type="number"
                  name="total_amount"
                  required
                  step="0.01"
                  min="0"
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="e.g., 1500.50"
                  defaultValue={current?.total_amount}
                />
              </div>
              {/* Payment Type Field */}
              <div className="space-y-2">
                <label htmlFor="payment_type" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Payment Type
                </label>
                <select
                  id="payment_type"
                  name="payment_type"
                  required
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  defaultValue={selectedSupplier?.payment_terms === "Cash On Delivery" ? 1 : current?.payment_type}
                >
                  <option value="">Select a payment type</option>
                  {paymentMethods.map((method) => (
                    <option key={method.method_id} value={method.method_id}>
                      {method.method_name}
                    </option>
                  ))}
                </select>
              </div>
              {/* Receiving Type Field */}
              <div className="space-y-2">
                <label htmlFor="receiving_type" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Receiving Type
                </label>
                <select
                  id="receiving_type"
                  name="receiving_type"
                  required
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  defaultValue={current?.receiving_type}
                >
                  <option value="">Select a receiving type</option>
                  {receivingTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.description}
                    </option>
                  ))}
                </select>
              </div>
              {/* Receipt Required Field */}
              <div className="space-y-2">
                <label htmlFor="receipt_required" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Receipt Required
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    id="receipt_required"
                    type="checkbox"
                    name="receipt_required"
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    defaultChecked={current?.receipt_required}
                  />
                  <span className="text-sm text-muted-foreground">
                    Require official receipt
                  </span>
                </div>
              </div>
            </div>
            {/* Remarks Field */}
            <div className="space-y-2">
              <label htmlFor="remark" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Remarks
              </label>
              <textarea
                id="remark"
                name="remark"
                rows={3}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Add any notes or special instructions..."
                defaultValue={current?.remark}
              />
            </div>
            {/* Buttons */}
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring h-9 px-4 py-2 bg-muted text-muted-foreground shadow-sm hover:bg-muted/80"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring h-9 px-4 py-2 bg-primary text-primary-foreground shadow hover:bg-primary/90"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : mode === "create" ? "Create" : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Dialog>
  );
}
