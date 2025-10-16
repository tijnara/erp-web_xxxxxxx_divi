"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

// --- Type Definitions ---
interface DropdownOption {
    id: number | string;
    name: string;
}

interface PaymentTerm {
    id: number;
    payment_name: string;
    payment_days: number | null;
}

// --- highlight-start ---
// Create a Supplier interface for better type safety.
interface Supplier {
    id: number;
    supplier_name: string;
    supplier_type: string;
    payment_terms: string;
}
// --- highlight-end ---


interface CreatePOModalProps {
    open: boolean;
    onClose: () => void;
    onPoCreated?: (newPO: any) => void; // Callback to update parent state, optional
}

// --- Main Modal Component ---
export function CreatePOModal({ open, onClose, onPoCreated = () => {} }: CreatePOModalProps) {
    const today = new Date().toISOString().slice(0, 10);

    // --- Internal State for the Modal ---
    const [formData, setFormData] = useState({
        date: today,
        reference: "",
        remark: "",
        payment_term: "",
        price_type: "",
        payment_type: "",
        receiving_type: "",
        transaction_type: "",
    });

    // State for the auto-populated PO Number
    const [poNumber, setPoNumber] = useState<string>("");

    // --- highlight-start ---
    // State to track the currently selected supplier object
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
    // --- highlight-end ---


    // State for data fetched within the modal
    const [paymentTerms, setPaymentTerms] = useState<PaymentTerm[]>([]);
    const [priceTypes, setPriceTypes] = useState<DropdownOption[]>([]);
    const [receivingTypes, setReceivingTypes] = useState<{id: number, description: string}[]>([]);
    // --- highlight-start ---
    // Holds full supplier objects
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    // --- highlight-end ---
    const [transactionTypes, setTransactionTypes] = useState<DropdownOption[]>([]);

    // Loading and error state
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // --- Data Fetching Effect ---
    useEffect(() => {
        if (open) {
            const fetchModalData = async () => {
                setLoading(true);
                setPoNumber("Loading..."); // Show loading state for PO number
                try {
                    // Fetch all dropdown data and the latest PO number concurrently
                    const [
                        termsRes,
                        typesRes,
                        receivingRes,
                        suppliersRes,
                        transactionRes,
                        latestPORes
                    ] = await Promise.all([
                        axios.get("http://100.119.3.44:8090/items/payment_terms"),
                        axios.get("http://100.119.3.44:8090/items/price_types"),
                        axios.get("http://100.119.3.44:8090/items/receiving_type"),
                        axios.get("http://100.119.3.44:8090/items/suppliers"),
                        axios.get("http://100.119.3.44:8090/items/transaction_type"),
                        axios.get("http://100.119.3.44:8090/items/purchase_order?limit=1&sort=-purchase_order_no"),
                    ]);

                    // Set dropdown data
                    setPaymentTerms(termsRes.data.data || []);
                    setPriceTypes(typesRes.data.data.map((pt: any) => ({ id: pt.price_type_id, name: pt.price_type_name })) || []);
                    setReceivingTypes(receivingRes.data.data || []);
                    // --- highlight-start ---
                    // Store the full supplier data when you fetch it, not just the name and ID.
                    setSuppliers(suppliersRes.data.data || []);
                    // --- highlight-end ---
                    setTransactionTypes(transactionRes.data.data.map((tt: any) => ({ id: tt.id, name: tt.transaction_type })) || []);

                    // Calculate and set the next PO number from the fetched data
                    let newPONumber;
                    const lastPO = latestPORes.data.data?.[0];
                    if (lastPO) {
                        const match = lastPO.purchase_order_no.match(/PO-(\d{4})-(\d+)/);
                        const currentYear = new Date().getFullYear();
                        if (match) {
                            const year = parseInt(match[1], 10);
                            const num = parseInt(match[2], 10);
                            // If the year is the same, increment; otherwise, reset for the new year
                            const nextNum = year === currentYear ? num + 1 : 1;
                            newPONumber = `PO-${currentYear}-${nextNum.toString().padStart(4, "0")}`;
                        } else {
                            // Fallback for unexpected format
                            newPONumber = `PO-${currentYear}-0001`;
                        }
                    } else {
                        // If no purchase orders exist yet
                        newPONumber = `PO-${new Date().getFullYear()}-0001`;
                    }
                    setPoNumber(newPONumber);

                } catch (err) {
                    console.error("Error fetching modal data:", err);
                    setError("Failed to load required data.");
                    setPoNumber("Error");
                } finally {
                    setLoading(false);
                }
            };
            fetchModalData();
        }
    }, [open]);


    // Reset form fields when the modal is closed
    useEffect(() => {
        if (!open) {
            setFormData({
                date: today,
                reference: "",
                remark: "",
                payment_term: "",
                price_type: "",
                payment_type: "",
                receiving_type: "",
                transaction_type: "",
            });
            setSelectedSupplier(null);
        }
    }, [open]);


    // --- Handlers ---
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    // --- highlight-start ---
    // Update the handleSupplierChange function to find the selected supplier's details and update the form.
    const handleSupplierChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedId = e.target.value;
        const supplier = suppliers.find(s => String(s.id) === selectedId);

        if (supplier) {
            setSelectedSupplier(supplier);

            // Find matching transaction type by comparing names (case-insensitive)
            const transactionType = transactionTypes.find(
                tt => tt.name.toLowerCase() === supplier.supplier_type.toLowerCase()
            );
            // Find matching payment term by comparing names (case-insensitive)
            const paymentTerm = paymentTerms.find(
                pt => pt.payment_name.toLowerCase() === (supplier.payment_terms?.toLowerCase() || "")
            );

            // Update the form data with the IDs of the found items
            setFormData(prev => ({
                ...prev,
                transaction_type: transactionType ? String(transactionType.id) : "",
                payment_term: paymentTerm ? String(paymentTerm.id) : "",
            }));
        } else {
            // Reset if no supplier is selected
            setSelectedSupplier(null);
            setFormData(prev => ({
                ...prev,
                transaction_type: "",
                payment_term: "",
            }));
        }
    };
    // --- highlight-end ---


    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!selectedSupplier) {
            setError("A supplier must be selected.");
            return;
        }
        setLoading(true);
        setError("");

        try {
            const now = new Date();
            const timeNow = now.toTimeString().slice(0, 8);
            const datetimeLocal = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${timeNow}`;

            const payload = {
                ...formData,
                purchase_order_no: poNumber, // Use the PO number from state
                supplier_id: selectedSupplier.id,
                date_encoded: today,
                datetime: datetimeLocal,
                time: timeNow,
                inventory_status: 0,
                payment_status: 1,
            };

            const response = await axios.post("http://100.119.3.44:8090/items/purchase_order", payload);

            onPoCreated(response.data.data);
            onClose();

            // Optional: Reload the page to see the new PO in the list
            // window.location.reload();

        } catch (err: any) {
            console.error("Failed to create purchase order:", err.response?.data || err.message || err);
            setError(err.response?.data?.errors?.[0]?.message || err.message || "An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl w-full">
                <DialogTitle className="text-2xl font-bold text-gray-800">Create Purchase Order</DialogTitle>
                <form className="p-6 space-y-6 text-xl" onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="po_no" className="block text-xl font-medium text-gray-700">PO Number</label>
                            <input
                                type="text"
                                id="po_no"
                                value={poNumber} // Bind to the new poNumber state
                                readOnly
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-xl"
                            />
                        </div>
                        <div>
                            <label htmlFor="supplier" className="block text-xl font-medium text-gray-700">Supplier</label>
                            <select
                                id="supplier"
                                value={selectedSupplier?.id || ""}
                                onChange={handleSupplierChange}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-xl"
                                required
                            >
                                <option value="" disabled>Select a supplier</option>
                                {/* --- highlight-start --- */}
                                {suppliers.map(supplier => (
                                    <option key={supplier.id} value={String(supplier.id)}>{supplier.supplier_name}</option>
                                ))}
                                {/* --- highlight-end --- */}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="date" className="block text-xl font-medium text-gray-700">PO Date</label>
                            <input
                                type="date"
                                name="date"
                                id="date"
                                value={formData.date}
                                onChange={handleChange}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-xl"
                            />
                        </div>
                        <div>
                            <label htmlFor="receiving_type" className="block text-xl font-medium text-gray-700">Receiving Type</label>
                            <select
                                name="receiving_type"
                                id="receiving_type"
                                value={formData.receiving_type}
                                onChange={handleChange}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-xl"
                                required
                            >
                                <option value="" disabled>Select a receiving type</option>
                                {receivingTypes.map(type => (
                                    <option key={type.id} value={String(type.id)}>{type.description}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="payment_term" className="block text-xl font-medium text-gray-700">Payment Term</label>
                            <select
                                name="payment_term"
                                id="payment_term"
                                value={formData.payment_term}
                                onChange={handleChange}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-xl"
                                disabled={loading}
                            >
                                <option value="" disabled>{loading ? "Loading..." : "Select payment term"}</option>
                                {paymentTerms.map(term => (
                                    <option key={term.id} value={String(term.id)}>
                                        {term.payment_name}{term.payment_days !== null ? ` (${term.payment_days} days)` : ""}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="price_type" className="block text-xl font-medium text-gray-700">Price Type</label>
                            <select
                                name="price_type"
                                id="price_type"
                                value={formData.price_type}
                                onChange={(e) => {
                                    handleChange(e);
                                }}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-xl"
                                disabled={loading}
                            >
                                <option value="" disabled>{loading ? "Loading..." : "Select price type"}</option>
                                {priceTypes.map((type) => (
                                    <option key={type.id} value={String(type.id)}>{type.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="transaction_type" className="block text-xl font-medium text-gray-700">Transaction Type</label>
                            <select
                                name="transaction_type"
                                id="transaction_type"
                                value={formData.transaction_type}
                                onChange={(e) => {
                                    handleChange(e);
                                }}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-xl"
                                disabled={loading}
                            >
                                <option value="" disabled>{loading ? "Loading..." : "Select transaction type"}</option>
                                {transactionTypes.map((type) => (
                                    <option key={type.id} value={String(type.id)}>{type.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="reference" className="block text-xl font-medium text-gray-700">Reference</label>
                            <input
                                type="text"
                                name="reference"
                                id="reference"
                                value={formData.reference}
                                onChange={handleChange}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-xl"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="remark" className="block text-xl font-medium text-gray-700">Remarks</label>
                        <textarea
                            name="remark"
                            id="remark"
                            value={formData.remark}
                            onChange={handleChange}
                            rows={3}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-xl"
                        ></textarea>
                    </div>

                    {error && (
                        <div className="text-xl text-red-600">
                            <i className="fas fa-exclamation-circle mr-2"></i>{error}
                        </div>
                    )}

                    <div className="flex justify-end gap-4">
                        <Button type="button" variant="secondary" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-xl">Cancel</Button>
                        <Button type="submit" disabled={loading || poNumber === "Loading..."} className="px-4 py-2 bg-blue-500 text-white rounded-md shadow-sm text-xl">
                            {loading && <i className="fas fa-spinner fa-spin mr-2"></i>}
                            {loading ? "Creating..." : "Create Purchase Order"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}