import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import axios from 'axios';

// Note: Using the hardcoded API base URL as requested.
const API_BASE = "http://100.119.3.44:8090/items";

// Define a type for the products in the dropdown
interface ProductOption {
    product_id: number;
    product_name: string;
}

// Props for the component
interface AddProductModalProps {
    open: boolean;
    onClose: () => void;
    activePO: { purchase_order_id: number; supplier_id: number } | null;
    onProductAdded: () => void; // Callback to refresh the product list
}

export function AddProductModal({ open, onClose, activePO, onProductAdded }: AddProductModalProps) {
    // State for the form fields
    const [productFields, setProductFields] = useState({
        product_id: "",
        ordered_quantity: "1",
        unit_price: "",
        approved_price: "",
        discounted_price: "",
        vat_amount: "",
        withholding_amount: "",
        total_amount: "",
        branch_id: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [availableProducts, setAvailableProducts] = useState<ProductOption[]>([]);
    const [branches, setBranches] = useState<{ id: number; branch_name: string }[]>([]);
    const [loading, setLoading] = useState(false);

    const [taxRates, setTaxRates] = useState({ VATRate: 0, WithholdingRate: 0 });

    // Effect to fetch supplier-specific products and branches when the modal opens
    useEffect(() => {
        if (open && activePO?.supplier_id) {
            const fetchModalData = async () => {
                setLoading(true);
                setError("");
                try {
                    const [branchesRes, supplierProductsRes] = await Promise.all([
                        fetch(`${API_BASE}/branches`),
                        fetch(`${API_BASE}/supplier_discount_products?filter[supplier_id][_eq]=${activePO.supplier_id}&fields=product_id.*`)
                    ]);

                    if (!branchesRes.ok) throw new Error("Failed to fetch branches.");
                    if (!supplierProductsRes.ok) throw new Error("Failed to fetch supplier products.");

                    const branchesData = await branchesRes.json();
                    setBranches(branchesData.data || []);

                    const supplierProductsData = await supplierProductsRes.json();
                    const products = (supplierProductsData.data || []).map((item: { product_id: ProductOption }) => item.product_id).filter(Boolean);

                    if (products.length === 0) {
                        setAvailableProducts([]);
                        setError("This supplier has no assigned products.");
                    } else {
                        setAvailableProducts(products);
                    }
                } catch (err: any) {
                    setError(err.message || "Unable to load data. Please try again.");
                    setAvailableProducts([]);
                    setBranches([]);
                } finally {
                    setLoading(false);
                }
            };
            fetchModalData();
        }
    }, [open, activePO]);

    // Effect to reset the form when the modal is closed
    useEffect(() => {
        if (!open) {
            setProductFields({
                product_id: "",
                ordered_quantity: "1",
                unit_price: "",
                approved_price: "",
                discounted_price: "",
                vat_amount: "",
                withholding_amount: "",
                total_amount: "",
                branch_id: "",
            });
            setError("");
        }
    }, [open]);

    // Effect to fetch tax rates
    useEffect(() => {
        axios.get(`${API_BASE}/tax_rates`)
            .then(response => {
                if (response.data?.data?.[0]) {
                    const rates = response.data.data[0];
                    setTaxRates({
                        VATRate: parseFloat(rates.VATRate) || 0,
                        WithholdingRate: parseFloat(rates.WithholdingRate) || 0,
                    });
                }
            })
            .catch(error => {
                console.error('Error fetching tax rates:', error);
                setError("Could not load tax rates. Please check the connection.");
            });
    }, []);

    // Effect to auto-calculate tax and total amounts
    useEffect(() => {
        const quantity = parseInt(productFields.ordered_quantity) || 0;
        const unitPrice = parseFloat(productFields.unit_price) || 0;
        const discountedPrice = parseFloat(productFields.discounted_price) || 0;

        const effectivePrice = discountedPrice > 0 ? discountedPrice : unitPrice;

        const subtotal = quantity * effectivePrice;
        const vatAmount = subtotal * taxRates.VATRate;
        const withholdingAmount = subtotal * taxRates.WithholdingRate;
        const totalAmount = subtotal + vatAmount - withholdingAmount;

        setProductFields(prev => ({
            ...prev,
            vat_amount: vatAmount.toFixed(2),
            withholding_amount: withholdingAmount.toFixed(2),
            total_amount: totalAmount.toFixed(2),
        }));
    }, [productFields.ordered_quantity, productFields.unit_price, productFields.discounted_price, taxRates]);


    const handleFieldChange = async (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setProductFields(prev => ({ ...prev, [name]: value }));

        if (name === 'product_id' && value) {
            setLoading(true);
            setError("");
            try {
                const productResponse = await axios.get(`${API_BASE}/products/${value}`);
                const product = productResponse.data?.data;
                const unitPrice = parseFloat(product?.price_per_unit) || 0;

                const updates: Partial<typeof productFields> = {
                    unit_price: unitPrice.toString(),
                    discounted_price: ""
                };

                const supplierDiscountResponse = await axios.get(
                    `${API_BASE}/supplier_discount_products?filter[product_id][_eq]=${value}&filter[supplier_id][_eq]=${activePO?.supplier_id}`
                );
                const lineDiscountId = supplierDiscountResponse.data?.data?.[0]?.line_discount_id;

                if (lineDiscountId) {
                    const lineDiscountResponse = await axios.get(`${API_BASE}/line_discount/${lineDiscountId}`);
                    // FIX: Changed 'discount_percentage' to 'percentage' to match the API response
                    const discountPercentage = parseFloat(lineDiscountResponse.data?.data?.percentage) || 0;

                    if (discountPercentage > 0) {
                        const discountedAmount = unitPrice * (discountPercentage / 100);
                        updates.discounted_price = (unitPrice - discountedAmount).toFixed(2);
                    }
                }

                setProductFields(prev => ({ ...prev, ...updates }));

            } catch (error) {
                console.error('Error fetching product or discount details:', error);
                setError("Failed to fetch product price or discount.");
                setProductFields(prev => ({ ...prev, unit_price: "", discounted_price: "" }));
            } finally {
                setLoading(false);
            }
        }
    };

    // Handler for form submission
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");
        if (!activePO) {
            setError("No active Purchase Order selected.");
            return;
        }
        if (!productFields.product_id || !productFields.ordered_quantity || !productFields.branch_id || !productFields.unit_price) {
            setError("Please fill in all required fields marked with *.");
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                purchase_order_id: activePO.purchase_order_id,
                product_id: Number(productFields.product_id),
                ordered_quantity: Number(productFields.ordered_quantity),
                unit_price: parseFloat(productFields.unit_price),
                approved_price: productFields.approved_price ? parseFloat(productFields.approved_price) : null,
                discounted_price: productFields.discounted_price ? parseFloat(productFields.discounted_price) : null,
                vat_amount: productFields.vat_amount ? parseFloat(productFields.vat_amount) : null,
                withholding_amount: productFields.withholding_amount ? parseFloat(productFields.withholding_amount) : null,
                total_amount: productFields.total_amount ? parseFloat(productFields.total_amount) : null,
                branch_id: Number(productFields.branch_id),
            };

            const response = await fetch(`${API_BASE}/purchase_order_products`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData?.errors?.[0]?.message || "Failed to add product.");
            }

            onProductAdded();
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl w-full">
                <DialogTitle className="text-2xl font-bold text-gray-800">Add Product to Purchase Order</DialogTitle>
                {error && <div className="text-red-500 p-3 bg-red-50 rounded-md text-sm my-2">{error}</div>}
                <form onSubmit={handleSubmit} className="p-6 space-y-6 text-xl">
                    {/* Product and Branch selection... */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xl font-medium text-gray-700">Product *</label>
                            <select
                                name="product_id"
                                value={productFields.product_id}
                                onChange={handleFieldChange}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-xl"
                                required
                                disabled={availableProducts.length === 0 || loading}
                            >
                                <option value="">
                                    {loading ? "Loading..." : availableProducts.length > 0 ? "Select a product" : "No products for this supplier"}
                                </option>
                                {availableProducts.map(product => (
                                    <option key={product.product_id} value={product.product_id}>{product.product_name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xl font-medium text-gray-700">Branch / Warehouse *</label>
                            <select
                                name="branch_id"
                                value={productFields.branch_id}
                                onChange={handleFieldChange}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-xl"
                                required
                                disabled={branches.length === 0 || loading}
                            >
                                <option value="">Select a branch</option>
                                {branches.map(branch => (
                                    <option key={branch.id} value={branch.id}>{branch.branch_name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    {/* Quantity and Unit Price... */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xl font-medium text-gray-700">Ordered Quantity *</label>
                            <input
                                type="number"
                                name="ordered_quantity"
                                value={productFields.ordered_quantity}
                                onChange={handleFieldChange}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-xl"
                                required
                                min="1"
                                disabled={loading}
                            />
                        </div>
                        <div>
                            <label className="block text-xl font-medium text-gray-700">Unit Price *</label>
                            <input
                                type="number"
                                name="unit_price"
                                step="0.01"
                                value={productFields.unit_price}
                                onChange={handleFieldChange}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-xl"
                                required
                                disabled={loading}
                            />
                        </div>
                    </div>
                    {/* Other price fields... */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xl font-medium text-gray-700">Approved Price</label>
                            <input
                                type="number"
                                name="approved_price"
                                step="0.01"
                                value={productFields.approved_price}
                                onChange={handleFieldChange}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-xl"
                                disabled={loading}
                            />
                        </div>
                        <div>
                            <label className="block text-xl font-medium text-gray-700">Discounted Price</label>
                            <input
                                type="number"
                                name="discounted_price"
                                step="0.01"
                                value={productFields.discounted_price}
                                readOnly
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-gray-100 focus:ring-blue-500 focus:border-blue-500 sm:text-xl"
                            />
                        </div>
                    </div>
                    {/* TAX FIELDS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xl font-medium text-gray-700">VAT Amount</label>
                            <input
                                type="number"
                                name="vat_amount"
                                step="0.01"
                                value={productFields.vat_amount}
                                readOnly
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-gray-100 focus:ring-blue-500 focus:border-blue-500 sm:text-xl"
                            />
                        </div>
                        <div>
                            <label className="block text-xl font-medium text-gray-700">Withholding Amount</label>
                            <input
                                type="number"
                                name="withholding_amount"
                                step="0.01"
                                value={productFields.withholding_amount}
                                readOnly
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-gray-100 focus:ring-blue-500 focus:border-blue-500 sm:text-xl"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xl font-medium text-gray-700">Total Amount</label>
                        <input
                            type="number"
                            name="total_amount"
                            step="0.01"
                            value={productFields.total_amount}
                            readOnly
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-gray-100 focus:ring-blue-500 focus:border-blue-500 sm:text-xl"
                        />
                    </div>
                    <div className="flex justify-end space-x-4 pt-4">
                        <Button type="button" variant="secondary" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-xl">
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting || loading} className="px-4 py-2 bg-blue-500 text-white rounded-md shadow-sm text-xl">
                            {isSubmitting ? "Adding..." : "Add Product"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}