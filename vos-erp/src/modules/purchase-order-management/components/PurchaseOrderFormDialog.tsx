"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Dialog } from "@/components/ui/dialog";
import axios from 'axios';

interface PurchaseOrderFormDialogProps {
    mode: "create" | "edit";
    open: boolean;
    onOpenChange: (open: boolean) => void;
    current: any | null;
    suppliers: any[];
    paymentTerms: any[];
    receivingTypes: any[];
    onSubmit: (data: any) => Promise<void>;
}

// Ensure taxRates includes VATRate and WithholdingRate
interface TaxRates {
  VATRate: number;
  WithholdingRate: number;
  [key: string]: number; // Allow additional dynamic properties
}

// Example usage of taxRates
const taxRates: TaxRates = {
  VATRate: 0.12, // Default VAT rate
  WithholdingRate: 0.05, // Default withholding rate
};

export function PurchaseOrderFormDialog({
                                            mode,
                                            open,
                                            onOpenChange,
                                            current,
                                            suppliers,
                                            paymentTerms,
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
        unit_price: 0,
        approved_price: 0,
        discounted_price: 0,
        vat_amount: 0,
        withholding_amount: 0,
        total_amount: 0,
        branch_id: "",
        received: false,
    });
    const [productError, setProductError] = useState("");
    const [isProductSubmitting, setIsProductSubmitting] = useState(false);

    // This state now drives the product filtering
    const [supplierId, setSupplierId] = useState("");

    const [products, setProducts] = useState<any[]>([]);
    const modalRef = useRef<HTMLDivElement>(null);

    // Effect to initialize and reset state based on modal visibility and mode
    useEffect(() => {
        if (open) {
            // If in "edit" mode and a current PO exists, set the supplier
            if (mode === 'edit' && current?.supplier_id) {
                const supplier = suppliers.find(s => s.id === current.supplier_id);
                setSelectedSupplier(supplier || null);
                setSupplierId(String(current.supplier_id)); // Set supplier ID for the product form
            }
        } else {
            // Reset states when the dialog closes
            setSelectedSupplier(null);
            setSupplierId("");
            setProducts([]);
            setFormError("");
            setProductError("");
            setProductFields({
                product_id: "",
                ordered_quantity: "",
                unit_price: 0,
                approved_price: 0,
                discounted_price: 0,
                vat_amount: 0,
                withholding_amount: 0,
                total_amount: 0,
                branch_id: "",
                received: false,
            });
        }
    }, [open, current, mode, suppliers]);
    useEffect(() => {
        if (products.length > 0 && mode === "create") {
            products.forEach(item => {
                setProductFields({
                    product_id: item.product_id,
                    ordered_quantity: item.ordered_quantity,
                    unit_price: item.unit_price,
                    branch_id: item.branch_id,
                    approved_price: 0,
                    discounted_price: 0,
                    vat_amount: 0,
                    withholding_amount: 0,
                    total_amount: item.unit_price * item.ordered_quantity,
                    received: false,
                });
                // Optionally auto-add to the PO products table
                // handleAddProductToPO(...);
            });
        }
    }, [products, mode]);

    useEffect(() => {
        if (open && mode === "create") {
            const storedItems = sessionStorage.getItem("preselectedPOItems");
            if (storedItems) {
                const parsedItems = JSON.parse(storedItems);
                // Map them to the PO product state
                const initialProducts = parsedItems.map((item: any) => ({
                    product_id: item.product_id,
                    ordered_quantity: item.quantity,
                    unit_price: item.unit_price,
                    branch_id: item.branch_id,
                }));
                setProducts(initialProducts);

                // Clear after loading
                sessionStorage.removeItem("preselectedPOItems");
            }
        }
    }, [open, mode]);


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

    // Effect to handle modal closing via Escape key or backdrop click
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
        const supplierIdValue = formData.get("supplier_id");
        if (!supplierIdValue) {
            setFormError("Please select a supplier.");
            setIsSubmitting(false);
            return;
        }
        const receivingTypeValue = formData.get("receiving_type");
        console.log('Submitted receiving_type:', receivingTypeValue);
        const data = {
            supplier_id: Number(supplierIdValue),
            reference: formData.get("reference"),
            remark: formData.get("remark"),
            barcode: formData.get("barcode"),
            receiving_type: Number(receivingTypeValue),
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

    const handleProductFieldChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target as HTMLInputElement;
        const checked = type === "checkbox" ? (e.target as HTMLInputElement).checked : undefined;
        setProductFields((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    }, []);

    const handleAddProductToPO = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setProductError("");
        setIsProductSubmitting(true);
        if (!productFields.product_id || !productFields.ordered_quantity || !productFields.unit_price || !productFields.branch_id) {
            setProductError("Please fill in all required product fields.");
            setIsProductSubmitting(false);
            return;
        }
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
            setProductFields({
                product_id: "",
                ordered_quantity: "",
                unit_price: 0,
                approved_price: 0,
                discounted_price: 0,
                vat_amount: 0,
                withholding_amount: 0,
                total_amount: 0,
                branch_id: "",
                received: false,
            });
        } catch (err) {
            setProductError("Error adding product to PO.");
        } finally {
            setIsProductSubmitting(false);
        }
    };

    // This effect now correctly fetches and filters products when `supplierId` changes
    useEffect(() => {
        async function fetchProducts() {
            // Clear previous products and reset product selection
            setProducts([]);
            setProductFields(prev => ({ ...prev, product_id: '' }));

            if (!supplierId) return;

            try {
                const response = await fetch(`http://100.119.3.44:8090/items/supplier_discount_products`);
                const result = await response.json();
                if (result.data) {
                    const filteredProducts = result.data
                        .filter((product: { supplier_id: number }) => product.supplier_id === Number(supplierId))
                        .map((product: { product_id: number }) => ({
                            id: product.product_id,
                            // You might want to fetch actual product names in a real app
                            name: `Product ${product.product_id}`
                        }));
                    setProducts(filteredProducts);
                }
            } catch (error) {
                console.error("Error fetching products:", error);
                setProducts([]); // Ensure products are cleared on error
            }
        }

        fetchProducts();
    }, [supplierId]);

    useEffect(() => {
        console.log('Receiving Types:', receivingTypes);
    }, [receivingTypes]);

    // Fetch tax rates on component mount
    useEffect(() => {
        axios.get('http://100.119.3.44:8090/items/tax_rates')
            .then(response => {
              const [taxRates, setTaxRates] = useState<TaxRates>({
                VATRate: 0.12,
                WithholdingRate: 0.05,
              });
            })
            .catch(error => {
                console.error('Error fetching tax rates:', error);
            });
    }, []);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <div
                ref={modalRef}
                className="fixed inset-0 z-50 flex items-start justify-center sm:items-center"
                style={{ transition: 'background 0.3s' }}
            >
                <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm transition-opacity duration-300 animate-fadeIn" />
                <div className="z-50 grid w-full max-w-3xl gap-4 p-6 bg-background shadow-lg rounded-lg sm:rounded-xl border animate-popOut">
                    <div className="flex flex-col space-y-1.5 text-center sm:text-left">
                        <h2 className="text-lg font-semibold leading-none tracking-tight">
                            {mode === "create" ? "Create Purchase Order" : "Edit Purchase Order"}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            {mode === "create" ? "Create a new purchase order" : "Edit existing purchase order details"}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {formError && (
                            <div className="text-red-500 text-sm mb-2">{formError}</div>
                        )}
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                {/* Removed Supplier label */}
                                <select
                                    id="supplier_id"
                                    name="supplier_id"
                                    required
                                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                    value={selectedSupplier?.id || ""}
                                    onChange={(e) => {
                                        const newSupplierId = e.target.value;
                                        const supplier = suppliers.find(s => s.id === Number(newSupplierId));
                                        setSelectedSupplier(supplier || null);
                                        setSupplierId(newSupplierId);
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
                            <div className="space-y-2">
                                <label htmlFor="date" className="text-sm font-medium">Date</label>
                                <input
                                    id="date" type="date" name="date" required
                                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors"
                                    defaultValue={current?.date || new Date().toISOString().split('T')[0]}
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="reference" className="text-sm font-medium">Reference</label>
                                <input
                                    id="reference" type="text" name="reference"
                                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                                    placeholder="e.g., Quote #123"
                                    defaultValue={current?.reference}
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="barcode" className="text-sm font-medium">Barcode</label>
                                <input
                                    id="barcode" type="text" name="barcode"
                                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                                    placeholder="Optional barcode"
                                    defaultValue={current?.barcode}
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="price_type" className="text-sm font-medium">Price Type</label>
                                <select
                                    id="price_type" name="price_type" required
                                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                                    defaultValue={current?.price_type || ""}
                                    disabled={priceTypeLoading}
                                >
                                    <option value="">{priceTypeLoading ? "Loading..." : "Select a price type"}</option>
                                    {priceTypes.map((pt: any) => (
                                        <option key={pt.price_type_id} value={pt.price_type_id}>
                                            {pt.price_type_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="total_amount" className="text-sm font-medium">Total Amount</label>
                                <input
                                    id="total_amount" type="number" name="total_amount" required
                                    step="0.01" min="0"
                                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                                    placeholder="e.g., 1500.50"
                                    defaultValue={current?.total_amount}
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="receiving_type" className="text-sm font-medium">Receiving Type</label>
                                <select
                                    id="receiving_type" name="receiving_type" required
                                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
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
                            <div className="space-y-2">
                                <label htmlFor="receipt_required" className="text-sm font-medium">Receipt Required</label>
                                <div className="flex items-center space-x-2 pt-2">
                                    <input
                                        id="receipt_required" type="checkbox" name="receipt_required"
                                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                        defaultChecked={current?.receipt_required}
                                    />
                                    <span className="text-sm text-muted-foreground">Require official receipt</span>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="remark" className="text-sm font-medium">Remarks</label>
                            <textarea
                                id="remark" name="remark" rows={3}
                                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
                                placeholder="Add any notes or special instructions..."
                                defaultValue={current?.remark}
                            />
                        </div>
                        <div className="flex justify-end space-x-2">
                            <button
                                type="button" onClick={() => onOpenChange(false)}
                                className="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-4 py-2 bg-muted text-muted-foreground shadow-sm hover:bg-muted/80"
                                disabled={isSubmitting}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-4 py-2 bg-primary text-primary-foreground shadow hover:bg-primary/90"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? "Saving..." : mode === "create" ? "Create" : "Save Changes"}
                            </button>
                        </div>
                    </form>

                    {/* Add Product to PO Section */}
                    <div className="mt-6 p-4 border rounded-lg bg-muted">
                        {productError && <div className="text-red-500 text-sm mb-2">{productError}</div>}
                        <form onSubmit={handleAddProductToPO} className="grid gap-4 md:grid-cols-2">
                            <div>
                                <label>Supplier ID *</label>
                                <input
                                    type="text"
                                    value={supplierId}
                                    readOnly // Made read-only to prevent manual edits
                                    className="input bg-gray-100" // Style to indicate it's not editable
                                />
                            </div>
                            <div>
                                <label>Product *</label>
                                <select
                                    name="product_id"
                                    value={productFields.product_id}
                                    onChange={handleProductFieldChange}
                                    required
                                    disabled={!supplierId || products.length === 0} // Disable if no supplier or products
                                    className="input"
                                >
                                    <option value="">{supplierId ? "Select a product" : "Select a supplier first"}</option>
                                    {products.map((product) => (
                                        <option key={product.id} value={product.id}>{product.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label>Ordered Quantity *</label>
                                <input
                                    name="ordered_quantity" type="number"
                                    value={productFields.ordered_quantity} onChange={handleProductFieldChange} required
                                    className="input"
                                />
                            </div>
                            <div>
                                <label>Unit Price *</label>
                                <input
                                    name="unit_price" type="number" step="0.01"
                                    value={productFields.unit_price} onChange={handleProductFieldChange} required
                                    className="input"
                                />
                            </div>
                            <div>
                                <label>Approved Price</label>
                                <input
                                    name="approved_price" type="number" step="0.01"
                                    value={productFields.approved_price} onChange={handleProductFieldChange}
                                    className="input"
                                />
                            </div>
                            <div>
                                <label>Discounted Price</label>
                                <input
                                    type="number"
                                    value={productFields.discounted_price}
                                    readOnly
                                    className="input bg-gray-100" // Styled to indicate read-only
                                />
                            </div>
                            <div>
                                <label>VAT Amount</label>
                                <input
                                    type="number"
                                    value={(productFields.unit_price * (taxRates.VATRate || 0)).toFixed(2)}
                                    readOnly
                                    className="input bg-gray-100" // Styled to indicate read-only
                                />
                            </div>
                            <div>
                                <label>Withholding Amount</label>
                                <input
                                    type="number"
                                    value={(productFields.unit_price * (taxRates.WithholdingRate || 0)).toFixed(2)}
                                    readOnly
                                    className="input bg-gray-100" // Styled to indicate read-only
                                />
                            </div>
                            <div>
                                <label>Total Amount</label>
                                <input
                                    name="total_amount" type="number" step="0.01"
                                    value={productFields.total_amount} onChange={handleProductFieldChange}
                                    className="input"
                                />
                            </div>
                            <div>
                                <label>Branch ID *</label>
                                <input
                                    name="branch_id" type="number"
                                    value={productFields.branch_id} onChange={handleProductFieldChange} required
                                    className="input"
                                />
                            </div>
                            <div className="flex items-center mt-2">
                                <label className="mr-2">Received</label>
                                <input
                                    name="received" type="checkbox"
                                    checked={productFields.received} onChange={handleProductFieldChange}
                                />
                            </div>
                            <div className="col-span-2 mt-4">
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={isProductSubmitting || !supplierId}
                                >
                                    {isProductSubmitting ? "Adding..." : "Add Product"}
                                </button>
                            </div>
                        </form>

                        {/* New Ordered Quantity Field */}
                        {products.length > 0 && (
                            <div className="space-y-2">
                                <label htmlFor="ordered_quantity" className="block text-sm font-medium text-gray-700">
                                    Order Quantity
                                </label>
                                <input
                                    type="number"
                                    id="ordered_quantity"
                                    name="ordered_quantity"
                                    value={productFields.ordered_quantity}
                                    onChange={handleProductFieldChange}
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    placeholder="Enter order quantity"
                                    required
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Dialog>
    );
}

// Add animation styles and input class to your global CSS
/*
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes popOut { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
.animate-fadeIn { animation: fadeIn 0.3s ease; }
.animate-popOut { animation: popOut 0.3s cubic-bezier(0.4,0,0.2,1); }

.input {
  display: flex;
  height: 2.25rem;
  width: 100%;
  border-radius: 0.375rem;
  border: 1px solid hsl(var(--input));
  background-color: hsl(var(--background));
  padding: 0.25rem 0.75rem;
  font-size: 0.875rem;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}
*/