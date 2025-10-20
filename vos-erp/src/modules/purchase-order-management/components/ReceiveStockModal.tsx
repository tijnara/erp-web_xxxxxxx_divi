import React, { useState, useEffect } from "react";

interface Product {
    product_id: number;
    product_name?: string;
    ordered_quantity: number;
    received_quantity?: number; // already received qty
    branch_id: number;
    unit_price?: number;
    discounted_price?: number;
    vat_amount?: number;
    withholding_amount?: number;
    total_amount?: number;
}

interface ReceiveStockModalProps {
    open: boolean;
    onClose: () => void;
    purchaseOrderId: number;
}

export function ReceiveStockModal({ open, onClose, purchaseOrderId }: ReceiveStockModalProps) {
    const [products, setProducts] = useState<Product[]>([]);
    const [receiptNo, setReceiptNo] = useState<string>("");
    const [receiptDate, setReceiptDate] = useState<string>("");
    const [branch, setBranch] = useState<string>("");
    const [serials, setSerials] = useState<Record<number, string[]>>({});

    // Fetch products for this purchase order
    useEffect(() => {
        if (!purchaseOrderId || !open) return;

        async function fetchData() {
            try {
                // 1️⃣ Fetch products for this purchase order
                const productRes = await fetch(
                    `http://100.119.3.44:8090/items/purchase_order_products?filter[purchase_order_id][_eq]=${purchaseOrderId}`
                );
                const productData = await productRes.json();
                const items = Array.isArray(productData)
                    ? productData
                    : productData?.data || productData?.items || [];

                const formattedItems = items.map((item: any) => ({
                    ...item,
                    received_quantity: item.received_quantity || 0,
                }));
                setProducts(formattedItems);

                if (formattedItems.length === 0) return;

                // 2️⃣ Get the branch ID from the first product
                const branchId = formattedItems[0].branch_id;

                // 3️⃣ Fetch branch list and find matching name
                const branchRes = await fetch("http://100.119.3.44:8090/items/branches");
                const branchData = await branchRes.json();
                console.log("Branch API Response:", branchData); // 👈 Add this

                const branchList = Array.isArray(branchData)
                    ? branchData
                    : branchData?.data || branchData?.items || [];

                const matchedBranch = branchList.find(
                    (b: any) => b.id === branchId || b.branch_id === branchId
                );

                if (matchedBranch) {
                    setBranch(matchedBranch.name || matchedBranch.branch_name);
                } else {
                    setBranch(`Branch ID ${branchId}`);
                }

            } catch (err) {
                console.error("Error fetching PO products or branch info:", err);
            }
        }

        fetchData();
    }, [purchaseOrderId, open]);



    // Update quantity of received items
    const handleQtyChange = (productId: number, qty: number) => {
        const product = products.find(p => p.product_id === productId);
        if (!product) return;

        const remainingQty = product.ordered_quantity - (product.received_quantity || 0);
        const newQty = qty > remainingQty ? remainingQty : qty < 0 ? 0 : qty;

        setSerials(prev => ({
            ...prev,
            [productId]: Array.from({ length: newQty }, (_, i) => prev[productId]?.[i] || "")
        }));
    };



    // Update individual serial number
    const handleSerialChange = (productId: number, index: number, value: string) => {
        setSerials(prev => {
            const updated = [...(prev[productId] || [])];
            updated[index] = value;
            return { ...prev, [productId]: updated };
        });
    };

    // Submit receiving data
    const handleSubmit = async (isPosted: boolean) => {
        if (!receiptNo || !receiptDate || !branch) {
            alert("Please fill in receipt number, date, and select a branch.");
            return;
        }

        // Validate received quantities
        // Validate received quantities
        for (const p of products) {
            const receivedQty = serials[p.product_id]?.length || 0;
            const remainingQty = p.ordered_quantity - (p.received_quantity || 0);
            if (receivedQty > remainingQty) {
                alert(`Received quantity for ${p.product_name || `Product #${p.product_id}`} exceeds remaining quantity (${remainingQty}).`);
                return;
            }
        }


        const payload = products.map(p => ({
            purchase_order_id: purchaseOrderId,
            product_id: p.product_id,
            branch_id: Number(branch) || p.branch_id,
            received_quantity: serials[p.product_id]?.length || 0,
            serial_no: serials[p.product_id]?.join(", ") || null,
            unit_price: Number(p.unit_price) || 0,
            discounted_amount: Number(p.discounted_price) || 0,
            vat_amount: Number(p.vat_amount) || 0,
            withholding_amount: Number(p.withholding_amount) || 0,
            total_amount: Number(p.total_amount) || 0,
            receipt_no: receiptNo,
            receipt_date: receiptDate,
            isPosted: isPosted ? 1 : 0,
        }));

        console.log("Submitting payload:", payload);

        try {
            const response = await fetch("http://100.119.3.44:8090/items/purchase_order_receiving", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload), // send array directly
            });

            if (!response.ok) {
                const errMsg = await response.text();
                console.error("Server response:", errMsg);
                throw new Error("Failed to save receiving data");
            }

            const result = await response.json();
            console.log("Saved successfully:", result);
            alert("Receiving records saved successfully!");
            onClose();
        } catch (error) {
            console.error("Error saving receiving data:", error);
            alert("Error saving receiving data. Check console for details.");
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white w-11/12 md:max-w-4xl rounded-lg shadow-lg p-6 relative">
                <button onClick={onClose} className="absolute top-3 right-3 text-gray-600 text-2xl">&times;</button>

                <h2 className="text-xl font-semibold mb-4">Receive Stocks — PO#{purchaseOrderId}</h2>

                {/* Receipt Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium">Receipt No.</label>
                        <input type="text" value={receiptNo} onChange={e => setReceiptNo(e.target.value)} className="form-input w-full border p-2 rounded" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Receipt Date</label>
                        <input type="date" value={receiptDate} onChange={e => setReceiptDate(e.target.value)} className="form-input w-full border p-2 rounded" />
                    </div>
                    <div>
                        <div>
                            <div>
                                <label className="block text-sm font-medium">Branch</label>
                                <input
                                    type="text"
                                    value={branch}
                                    readOnly
                                    className="form-input w-full border p-2 rounded bg-gray-100 text-gray-700 cursor-not-allowed"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Branch is automatically assigned from the Purchase Order.
                                </p>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Product Table */}
                <div className="overflow-x-auto max-h-[400px]">
                    <table className="min-w-full border text-sm">
                        <thead className="bg-gray-100">
                        <tr>
                            <th className="p-2 border">Product</th>
                            <th className="p-2 border">Ordered Qty</th>
                            <th className="p-2 border">Received Qty</th>
                            <th className="p-2 border">Serial Numbers</th>
                        </tr>
                        </thead>
                        <tbody>
                        {products.map(p => (
                            <tr key={p.product_id}>
                                <td className="border p-2">
                                    <strong>{p.product_name || `Product #${p.product_id}`}</strong>
                                    <div className="text-xs text-gray-500">ID: {p.product_id}</div>
                                </td>
                                <td className="border p-2 text-center">{p.ordered_quantity}</td>
                                <td className="border p-2">
                                    <div className="flex flex-col items-center">
                                        <input
                                            type="number"
                                            className="border p-1 rounded w-20 text-center"
                                            min={0}
                                            max={p.ordered_quantity - (p.received_quantity || 0)}
                                            value={serials[p.product_id]?.length || 0}
                                            onChange={e => handleQtyChange(p.product_id, Number(e.target.value))}
                                        />
                                        <div className="text-xs text-gray-500">
                                            Max: {p.ordered_quantity - (p.received_quantity || 0)}
                                        </div>
                                    </div>
                                </td>

                                <td className="border p-2">
                                    <div className="flex flex-col space-y-1">
                                        {(serials[p.product_id] || []).map((s, idx) => (
                                            <input
                                                key={idx}
                                                type="text"
                                                value={s}
                                                placeholder={`Serial #${idx + 1}`}
                                                className="border p-1 rounded"
                                                onChange={e => handleSerialChange(p.product_id, idx, e.target.value)}
                                            />
                                        ))}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>

                {/* Footer Buttons */}
                <div className="flex justify-end space-x-3 mt-6">
                    <button onClick={onClose} className="bg-gray-300 px-4 py-2 rounded">Cancel</button>
                    <button onClick={() => handleSubmit(false)} className="bg-blue-500 text-white px-4 py-2 rounded">Save as Draft</button>
                    <button onClick={() => handleSubmit(true)} className="bg-green-600 text-white px-4 py-2 rounded">Post Receiving</button>
                </div>
            </div>
        </div>
    );
}
