"use client";

import { useEffect, useState, useRef, useCallback } from "react";
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
  const [productFields, setProductFields] = useState({
    product_id: "",
    ordered_quantity: "",
    unit_price: "",
    approved_price: "",
    discounted_price: "",
    vat_amount: "",
    withholding_amount: "",
    total_amount: "",
    branch_id: "",
    received: false,
  });
  const [productError, setProductError] = useState("");
  const [isProductSubmitting, setIsProductSubmitting] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

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

  // Close modal on backdrop click or Escape key
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onOpenChange(false);
    }
    function handleClick(e: MouseEvent) {
      if (modalRef.current && e.target === modalRef.current) {
        onOpenChange(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    if (modalRef.current) {
      modalRef.current.addEventListener("mousedown", handleClick);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (modalRef.current) {
        modalRef.current.removeEventListener("mousedown", handleClick);
      }
    };
  }, [open, onOpenChange]);

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

  // Handle product field changes
  const handleProductFieldChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setProductFields((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }, []);

  // Submit product to PO API
  const handleAddProductToPO = async (e) => {
    e.preventDefault();
    setProductError("");
    setIsProductSubmitting(true);
    // Validate required fields
    if (!productFields.product_id || !productFields.ordered_quantity || !productFields.unit_price || !productFields.branch_id) {
      setProductError("Please fill in all required product fields.");
      setIsProductSubmitting(false);
      return;
    }
    // Prepare payload
    const payload = {
      purchase_order_id: current?.id || null,
      product_id: Number(productFields.product_id),
      ordered_quantity: Number(productFields.ordered_quantity),
      unit_price: productFields.unit_price,
      approved_price: productFields.approved_price || null,
      discounted_price: productFields.discounted_price || null,
      vat_amount: productFields.vat_amount || null,
      withholding_amount: productFields.withholding_amount || null,
      total_amount: productFields.total_amount || null,
      branch_id: Number(productFields.branch_id),
      received: productFields.received ? true : null,
    };
    try {
      const res = await fetch("http://100.119.3.44:8090/items/purchase_order_products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to add product to PO");
      // Optionally clear fields or show success
      setProductFields({
        product_id: "",
        ordered_quantity: "",
        unit_price: "",
        approved_price: "",
        discounted_price: "",
        vat_amount: "",
        withholding_amount: "",
        total_amount: "",
        branch_id: "",
        received: false,
      });
    } catch (err) {
      setProductError("Error adding product to PO.");
    } finally {
      setIsProductSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <div
        ref={modalRef}
        className="fixed inset-0 z-50 flex items-start justify-center sm:items-center"
        style={{ transition: 'background 0.3s' }}
      >
        {/* Enhanced darker backdrop with fade-in animation */}
        <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm transition-opacity duration-300 animate-fadeIn" />
        {/* Modal with pop-out animation */}
        <div className="z-50 grid w-full max-w-3xl gap-4 p-6 bg-background shadow-lg rounded-lg sm:rounded-xl border animate-popOut">
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

          {/* Add Product to PO Section */}
          <div className="mt-6 p-4 border rounded-lg bg-muted">
            <h3 className="text-md font-semibold mb-2">Add Product to PO</h3>
            {productError && <div className="text-red-500 text-sm mb-2">{productError}</div>}
            <form onSubmit={handleAddProductToPO} className="grid gap-4 md:grid-cols-2">
              <div>
                <label>Product ID *</label>
                <input name="product_id" type="number" value={productFields.product_id} onChange={handleProductFieldChange} required className="input" />
              </div>
              <div>
                <label>Ordered Quantity *</label>
                <input name="ordered_quantity" type="number" value={productFields.ordered_quantity} onChange={handleProductFieldChange} required className="input" />
              </div>
              <div>
                <label>Unit Price *</label>
                <input name="unit_price" type="number" value={productFields.unit_price} onChange={handleProductFieldChange} required className="input" />
              </div>
              <div>
                <label>Approved Price</label>
                <input name="approved_price" type="number" value={productFields.approved_price} onChange={handleProductFieldChange} className="input" />
              </div>
              <div>
                <label>Discounted Price</label>
                <input name="discounted_price" type="number" value={productFields.discounted_price} onChange={handleProductFieldChange} className="input" />
              </div>
              <div>
                <label>VAT Amount</label>
                <input name="vat_amount" type="number" value={productFields.vat_amount} onChange={handleProductFieldChange} className="input" />
              </div>
              <div>
                <label>Withholding Amount</label>
                <input name="withholding_amount" type="number" value={productFields.withholding_amount} onChange={handleProductFieldChange} className="input" />
              </div>
              <div>
                <label>Total Amount</label>
                <input name="total_amount" type="number" value={productFields.total_amount} onChange={handleProductFieldChange} className="input" />
              </div>
              <div>
                <label>Branch ID *</label>
                <input name="branch_id" type="number" value={productFields.branch_id} onChange={handleProductFieldChange} required className="input" />
              </div>
              <div className="flex items-center mt-2">
                <label className="mr-2">Received</label>
                <input name="received" type="checkbox" checked={productFields.received} onChange={handleProductFieldChange} />
              </div>
              <div className="col-span-2 mt-4">
                <button type="submit" className="btn btn-primary" disabled={isProductSubmitting}>
                  {isProductSubmitting ? "Adding..." : "Add Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Dialog>
  );
}

// Add animation styles
// Add these to your global CSS if not present:
/*
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes popOut {
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
.animate-fadeIn {
  animation: fadeIn 0.3s ease;
}
.animate-popOut {
  animation: popOut 0.3s cubic-bezier(0.4,0,0.2,1);
}
*/
