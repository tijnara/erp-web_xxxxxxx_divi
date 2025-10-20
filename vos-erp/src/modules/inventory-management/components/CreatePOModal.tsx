"use client";
import React, { useEffect, useState } from "react";

interface AddSupplierModalProps {
    suppliers: Supplier[];
    items: InventoryItem[];
    onClose: () => void;
    onAdded: () => void;
}
interface Supplier {
    id: number;
    supplier_name: string;
}

interface PaymentTerm {
    id: number;
    name?: string;
}

interface PriceType {
    id: number;
    price_type_name?: string;
}

interface InventoryItem {
    product_id: number;
    product_name: string;
    branch_id: number;
    branch_name: string;
    // depending on your shared types this might exist or not; we'll fetch price_per_unit separately
    unit_price?: number;
}

interface LineDiscount {
    id: number;
    line_discount?: string;
    percentage?: string; // string like "1.0000000000"
}

interface ProductDetail {
    product_id: number;
    price_per_unit?: number;
    // other fields if needed
}

interface CreatePOModalProps {
    items: InventoryItem[];
    onClose: () => void;
    onSubmit?: (payload: any) => void;
    initialQuantities?: { [productId: number]: number }; // ✅ add this
}



const API_BASE = "http://100.119.3.44:8090/items";
const DEFAULT_CREATED_BY = 5; // <-- default created_by as requested
const DEFAULT_VAT_RATE = 0.12; // 12%
const DEFAULT_WITHHOLDING_RATE = 0.01; // 1%
function AddSupplierModal({ suppliers, items, onClose, onAdded }: AddSupplierModalProps) {
    const [selectedSupplier, setSelectedSupplier] = useState<number | null>(null);
    const [discountName, setDiscountName] = useState("");
    const [discountPercentage, setDiscountPercentage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const API_BASE = "http://100.119.3.44:8090/items";

    const handleSave = async () => {
        if (!selectedSupplier) {
            alert("Please select a supplier.");
            return;
        }
        if (!discountName.trim()) {
            alert("Please enter a discount name.");
            return;
        }
        if (!discountPercentage.trim()) {
            alert("Please enter a discount percentage.");
            return;
        }

        setIsSubmitting(true);
        try {
            // 1️⃣ Create the line discount
            const lineRes = await fetch(`${API_BASE}/line_discount`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    line_discount: discountName,
                    percentage: discountPercentage,
                }),
            });
            if (!lineRes.ok) throw new Error("Failed to create line discount");
            const lineJson = await lineRes.json();
            const lineDiscountId = lineJson?.data?.id || lineJson?.id;
            if (!lineDiscountId) throw new Error("No line discount ID returned");

            // 2️⃣ Link supplier + discount to all selected products
            for (const it of items) {
                await fetch(`${API_BASE}/supplier_discount_products`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        supplier_id: selectedSupplier,
                        product_id: it.product_id,
                        line_discount_id: lineDiscountId,
                        created_by: 5,
                    }),
                });
            }

            alert("✅ Supplier and discount successfully linked to selected products!");
            onAdded(); // refresh parent state
            onClose();
        } catch (err) {
            console.error(err);
            alert("Failed to add supplier and discount. Check console for details.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-[400px]">
                <h3 className="text-lg font-semibold mb-4">Add Supplier & Discount</h3>

                <label className="block text-sm mb-1">Supplier *</label>
                <select
                    className="w-full border rounded p-2 mb-3"
                    value={selectedSupplier ?? ""}
                    onChange={(e) => setSelectedSupplier(e.target.value ? Number(e.target.value) : null)}
                >
                    <option value="">Select Supplier</option>
                    {suppliers.map((s) => (
                        <option key={s.id} value={s.id}>
                            {s.supplier_name}
                        </option>
                    ))}
                </select>

                <label className="block text-sm mb-1">Discount Name *</label>
                <input
                    className="w-full border rounded p-2 mb-3"
                    value={discountName}
                    onChange={(e) => setDiscountName(e.target.value)}
                    placeholder="e.g. L1"
                />

                <label className="block text-sm mb-1">Discount Percentage (%) *</label>
                <input
                    type="number"
                    step="0.01"
                    className="w-full border rounded p-2 mb-4"
                    value={discountPercentage}
                    onChange={(e) => setDiscountPercentage(e.target.value)}
                    placeholder="e.g. 1.00"
                />

                <div className="flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 border rounded">
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSubmitting}
                        className="px-4 py-2 bg-blue-600 text-white rounded"
                    >
                        {isSubmitting ? "Saving..." : "Save"}
                    </button>
                </div>
            </div>
        </div>
    );
}
export default function CreatePOModal({ items, onClose, onSubmit ,initialQuantities}: CreatePOModalProps) {
    const [supplierId, setSupplierId] = useState<number | null>(null);
    const [poDate, setPODate] = useState<string>(new Date().toISOString().split("T")[0]);
    const [receivingType, setReceivingType] = useState<number>(1);
    const [priceTypeId, setPriceTypeId] = useState<number | null>(null);
    const [paymentTermId, setPaymentTermId] = useState<number | null>(null);
    const [reference, setReference] = useState<string>("");
    const [remarks, setRemarks] = useState<string>("Created from Inventory");
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [priceTypes, setPriceTypes] = useState<PriceType[]>([]);
    const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
    const [paymentTerms, setPaymentTerms] = useState<PaymentTerm[]>([]);
    const [quantities, setQuantities] = useState<{ [productId: number]: number }>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    useEffect(() => {
        if (initialQuantities) {
            setQuantities(initialQuantities);
        }
    }, [initialQuantities]);

    // fetched mappings and data caches
    const [productSupplierMap, setProductSupplierMap] = useState<Record<number, { supplier_id: number; line_discount_id?: number }>>({});
    const [productDetailsMap, setProductDetailsMap] = useState<Record<number, ProductDetail>>({});
    const [lineDiscountMap, setLineDiscountMap] = useState<Record<number, LineDiscount>>({});
    const [detectedSuppliers, setDetectedSuppliers] = useState<number[]>([]);

    // Helper: normalize various API list shapes
    const normalizeList = (raw: any, preferData = true) => {
        if (!raw) return [];
        if (Array.isArray(raw)) return raw;
        if (preferData && Array.isArray(raw.data)) return raw.data;
        if (Array.isArray(raw.results)) return raw.results;
        return [];
    };


    // initial dropdown fetching (suppliers, price types, payment terms)
    useEffect(() => {
        async function fetchDropdowns() {
            try {
                const [supRes, priceRes, payRes] = await Promise.all([
                    fetch(`${API_BASE}/suppliers`),
                    fetch(`${API_BASE}/price_types`),
                    fetch(`${API_BASE}/payment_terms`),
                ]);

                const [supJson, priceJson, payJson] = await Promise.all([
                    supRes.json().catch(() => null),
                    priceRes.json().catch(() => null),
                    payRes.json().catch(() => null),
                ]);

                let sList = normalizeList(supJson);
                sList = sList.map((s: any, idx: number) => ({
                    id: Number(s.id) || idx + 1,
                    supplier_name: s.supplier_name || s.name || s.vendor_name || `Supplier ${idx + 1}`,
                }));
                setSuppliers(sList);

                let pList = normalizeList(priceJson);
                pList = pList
                    .map((p: any, idx: number) => ({
                        id: Number(p.id) || idx + 1,
                        price_type_name: p.price_type_name || p.name || p.type_name || `PriceType ${idx + 1}`,
                    }))
                    .filter((pp: any) => !!pp.price_type_name);
                setPriceTypes(pList);

                let payList = normalizeList(payJson);
                payList = payList.map((p: any, idx: number) => ({
                    id: Number(p.id) || idx + 1,
                    name: p.term_name || p.payment_name || p.name || `Term ${idx + 1}`,
                }));
                setPaymentTerms(payList);
            } catch (err) {
                console.error("Fetch dropdowns error:", err);
            }
        }

        fetchDropdowns();
    }, []);


    // Fetch supplier_discount_products & product details & line_discount list
    useEffect(() => {
        async function fetchMappingsAndProducts() {
            try {
                // fetch supplier-product mappings
                const [mapRes, prodRes, lineRes] = await Promise.all([
                    fetch(`${API_BASE}/supplier_discount_products`),
                    fetch(`${API_BASE}/products`),
                    fetch(`${API_BASE}/line_discount`),
                ]);

                const [mapJson, prodJson, lineJson] = await Promise.all([
                    mapRes.json().catch(() => null),
                    prodRes.json().catch(() => null),
                    lineRes.json().catch(() => null),
                ]);

                const mapList = normalizeList(mapJson);
                const prodList = normalizeList(prodJson);
                const lineList = normalizeList(lineJson);

                // build product -> { supplier_id, line_discount_id } map
                const pMap: Record<number, { supplier_id: number; line_discount_id?: number }> = {};
                mapList.forEach((r: any) => {
                    const pid = Number(r.product_id);
                    const sid = Number(r.supplier_id);
                    const ld = r.line_discount_id ? Number(r.line_discount_id) : undefined;
                    if (!isNaN(pid) && !isNaN(sid)) pMap[pid] = { supplier_id: sid, line_discount_id: ld };
                });
                setProductSupplierMap(pMap);

                // build product details map (use price_per_unit)
                const pDetails: Record<number, ProductDetail> = {};
                prodList.forEach((p: any) => {
                    const pid = Number(p.product_id ?? p.id);
                    if (!isNaN(pid)) {
                        pDetails[pid] = {
                            product_id: pid,
                            price_per_unit: typeof p.price_per_unit !== "undefined" ? Number(p.price_per_unit) : (typeof p.price_per_unit === "undefined" && typeof p.price_per_unit !== "undefined" ? Number(p.price_per_unit) : Number(p.price_per_unit)),
                        };
                        // fallback options if price_per_unit not present
                        if (!pDetails[pid].price_per_unit && (p.price_per_unit === 0 || p.price_per_unit === "0")) {
                            pDetails[pid].price_per_unit = 0;
                        }
                        // Try also common alternative names: price_per_unit, price, unit_price, cost_per_unit
                        if (!pDetails[pid].price_per_unit) {
                            const alt = Number(p.price_per_unit ?? p.price_per_unit ?? p.unit_price ?? p.price ?? p.cost_per_unit ?? p.estimated_unit_cost);
                            if (!isNaN(alt)) pDetails[pid].price_per_unit = alt;
                        }
                    }
                });
                setProductDetailsMap(pDetails);

                // build line discount map
                const ldMap: Record<number, LineDiscount> = {};
                lineList.forEach((ld: any) => {
                    const id = Number(ld.id);
                    if (!isNaN(id)) ldMap[id] = { id, line_discount: ld.line_discount, percentage: ld.percentage };
                });
                setLineDiscountMap(ldMap);

                // detect suppliers for current items
                const detected = Array.from(new Set(items.map((it) => pMap[it.product_id]?.supplier_id).filter(Boolean))) as number[];
                setDetectedSuppliers(detected);

                // auto-set fallback supplier if all items have same supplier
                const nonNull = detected.filter(Boolean);
                if (nonNull.length > 0) {
                    const unique = Array.from(new Set(nonNull));
                    if (unique.length === 1) setSupplierId(unique[0]);
                }
            } catch (err) {
                console.error("Failed to fetch mappings/products/line discounts:", err);
            }
        }

        fetchMappingsAndProducts();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [items]);

    const handleQuantityChange = (productId: number, value: number) => {
        setQuantities(prev => ({ ...prev, [productId]: value }));
    };

    // compute amounts using provided lineDiscount percentage (string like "1.0000000000")
    const computeLineAmounts = (
        unitPrice: number,
        qty: number,
        lineDiscountPercentage?: string
    ) => {
        const discountRate = lineDiscountPercentage ? parseFloat(lineDiscountPercentage) / 100 : 0;

        const discountPerUnit = +(unitPrice * discountRate).toFixed(2);
        const discountedPrice = +(unitPrice - discountPerUnit).toFixed(2);
        const discountAmount = +(discountPerUnit * qty).toFixed(2);

        const subtotal = +(discountedPrice * qty).toFixed(2);
        const vat_amount = +(subtotal * DEFAULT_VAT_RATE).toFixed(2);
        const withholding_amount = +(subtotal * DEFAULT_WITHHOLDING_RATE).toFixed(2);
        const total_amount = +(subtotal + vat_amount - withholding_amount).toFixed(2);

        return {
            discount_amount: discountAmount,
            discounted_price: discountedPrice,
            vat_amount,
            withholding_amount,
            total_amount,
        };
    };


    const handleSubmit = async () => {
        // validations
        if (!priceTypeId) return alert("Please select a price type.");
        if (!paymentTermId) return alert("Please select a payment term.");

        const validItems = items.filter((it) => (quantities[it.product_id] || 0) > 0);
        if (validItems.length === 0) {
            alert("Please set quantity for at least one item.");
            return;
        }

        // group by supplier (use mapping, fallback to selected supplier)
        const groups: Record<number, InventoryItem[]> = {};
        const missingSupplier: number[] = [];
        validItems.forEach((it) => {
            const mapping = productSupplierMap[it.product_id];
            const sid = mapping?.supplier_id || supplierId || null;
            if (!sid) {
                missingSupplier.push(it.product_id);
                return;
            }
            if (!groups[sid]) groups[sid] = [];
            groups[sid].push(it);
        });

        if (missingSupplier.length > 0) {
            alert(`Some selected items have no supplier mapping and no fallback supplier selected. Product IDs: ${missingSupplier.join(", ")}`);
            return;
        }

        const supplierIds = Object.keys(groups).map((k) => Number(k));
        if (supplierIds.length > 1) {
            const supplierNames = supplierIds.map((sid) => suppliers.find((s) => s.id === sid)?.supplier_name || `Supplier ${sid}`).join(", ");
            if (!confirm(`This will create ${supplierIds.length} purchase orders for suppliers: ${supplierNames}. Continue?`)) return;
        }

        setIsSubmitting(true);

        const createdPOs: any[] = [];
        const errors: any[] = [];

        try {
            // For each supplier, create PO then create its product lines
            for (const sidStr of Object.keys(groups)) {
                const sid = Number(sidStr);
                const groupItems = groups[sid];

                const now = new Date();
                const poPayload = {
                    supplier_id: sid,
                    purchase_order_no: `PO-${now.getFullYear()}-${String(Date.now()).slice(-4)}`,
                    reference: reference || `REQ-${now.getFullYear()}-${String(Date.now()).slice(-4)}`,
                    remark: remarks,
                    receiving_type: receivingType,
                    price_type: priceTypeId,
                    payment_term: paymentTermId,
                    date: poDate,
                    date_encoded: now.toISOString().split("T")[0],
                    datetime: now.toISOString(),
                    time: now.toTimeString().split(" ")[0],
                    total_amount: 0,
                    inventory_status: 0,
                    payment_status: 1,
                    created_by: DEFAULT_CREATED_BY,
                };

                const poRes = await fetch(`${API_BASE}/purchase_order`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(poPayload),
                });

                if (!poRes.ok) {
                    const txt = await poRes.text().catch(() => poRes.statusText);
                    errors.push({ supplier_id: sid, step: "create_po", reason: txt });
                    console.error("Failed to create PO for supplier", sid, txt);
                    continue;
                }

                const poJson = await poRes.json();
                const poId = poJson?.data?.id || poJson?.data?.purchase_order_id || poJson?.purchase_order_id || poJson?.id;
                if (!poId) {
                    errors.push({ supplier_id: sid, step: "create_po", reason: "No PO ID returned" });
                    console.error("No PO ID returned for supplier", sid, poJson);
                    continue;
                }

                // Build product payloads for this PO
                const productPayloads = [];
                for (const it of groupItems) {
                    const qty = quantities[it.product_id] || 0;
                    // get product unit price from productDetailsMap; fallback to item.unit_price if present
                    const pDetail = productDetailsMap[it.product_id];
                    const unit_price = (pDetail && typeof pDetail.price_per_unit !== "undefined") ? Number(pDetail.price_per_unit) : (typeof it.unit_price !== "undefined" ? Number(it.unit_price) : 0);
                    // get line discount id and percentage
                    const mapping = productSupplierMap[it.product_id];
                    const line_discount_id = mapping?.line_discount_id;
                    const lineDiscount = line_discount_id ? lineDiscountMap[line_discount_id] : undefined;
                    const lineDiscountPct = lineDiscount?.percentage; // string

                    const amounts = computeLineAmounts(unit_price, qty, lineDiscountPct);

                    const payload = {
                        purchase_order_id: poId,
                        product_id: it.product_id,
                        branch_id: it.branch_id,
                        ordered_quantity: qty,
                        // some backends expect 'quantity' and others 'ordered_quantity' — keep approved_price/unit_price fields too
                        quantity: qty,
                        unit_price: unit_price,
                        approved_price: unit_price,
                        discounted_price: amounts.discounted_price,
                        vat_amount: amounts.vat_amount,
                        withholding_amount: amounts.withholding_amount,
                        total_amount: amounts.total_amount,
                        line_discount_id: line_discount_id || null,
                        created_by: DEFAULT_CREATED_BY,
                    };

                    productPayloads.push(payload);
                }

                // create products (parallel)
                const productResponses = await Promise.all(
                    productPayloads.map((payload) =>
                        fetch(`${API_BASE}/purchase_order_products`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(payload),
                        }).then(async (r) => ({ ok: r.ok, status: r.status, text: await r.text().catch(() => "") }))
                    )
                );

                const failed = productResponses.filter((r) => !r.ok);
                if (failed.length > 0) {
                    errors.push({ supplier_id: sid, step: "create_products", reason: failed });
                    console.warn("Some PO product creations failed for PO", poId, failed);
                }

                // compute totals for PO and patch
                const totals = productPayloads.reduce(
                    (acc, cur) => {
                        acc.total += Number(cur.total_amount || 0);
                        acc.vat += Number(cur.vat_amount || 0);
                        return acc;
                    },
                    { total: 0, vat: 0 }
                );

                try {
                    const patchRes = await fetch(`${API_BASE}/purchase_order/${poId}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            total_amount: Number(totals.total.toFixed(2)),
                            vat_amount: Number(totals.vat.toFixed(2)),
                        }),
                    });
                    if (!patchRes.ok) {
                        console.warn("Failed to patch PO totals:", await patchRes.text().catch(() => patchRes.statusText));
                    }
                } catch (errPatch) {
                    console.warn("Patch PO totals error:", errPatch);
                }

                createdPOs.push({ supplier_id: sid, po_id: poId, created_products: productPayloads.length });
            } // end supplier loop

            // finish
            if (createdPOs.length > 0) {
                const summaryText = createdPOs.map(c => `Supplier ${c.supplier_id} → PO ${c.po_id} (${c.created_products} lines)`).join("\n");
                alert(`✅ Created ${createdPOs.length} Purchase Order(s).\n\nDetails:\n${summaryText}`);
                onSubmit?.({ success: true, created: createdPOs, errors });
                onClose();
            } else {
                alert("❌ No Purchase Orders created. Check console for errors.");
                onSubmit?.({ success: false, created: [], errors });
            }
        } catch (err: any) {
            console.error("Error creating POs:", err);
            alert(err?.message || "Failed to create PO(s). See console for details.");
            onSubmit?.({ success: false, created: createdPOs, errors: [...errors, err] });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
            <div className="bg-white p-6 rounded-lg w-[700px] shadow-lg max-h-[80vh] overflow-y-auto">
                <h2 className="text-lg font-semibold mb-4">Create Purchase Order</h2>

                <div className="grid grid-cols-2 gap-4 mb-4">
                    {/* PO Date */}
                    <div>
                        <label className="block text-sm mb-1">PO Date</label>
                        <input type="date" className="w-full border rounded p-2" value={poDate} onChange={(e) => setPODate(e.target.value)} />
                    </div>

                    {/* Receiving Type */}
                    <div>
                        <label className="block text-sm mb-1">Receiving Type</label>
                        <select className="w-full border rounded p-2" value={receivingType} onChange={(e) => setReceivingType(Number(e.target.value))}>
                            <option value={1}>Receive PO</option>
                            <option value={2}>General Receive</option>
                        </select>
                    </div>

                    {/* Price Type */}
                    <div>
                        <label className="block text-sm mb-1">Price Type *</label>
                        <select
                            className="border rounded px-3 py-2 w-full"
                            value={priceTypeId ?? ""}
                            onChange={(e) => setPriceTypeId(e.target.value === "" ? null : Number(e.target.value))}
                        >
                            <option value="">Select Price Type</option>
                            {priceTypes.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.price_type_name}
                                </option>
                            ))}
                        </select>
                        {priceTypes.length === 0 && <p className="text-xs text-red-500 mt-1">No price types loaded — check API response.</p>}
                    </div>

                    {/* Payment Term */}
                    <div>
                        <label className="block text-sm mb-1">Payment Term *</label>
                        <select
                            className="w-full border rounded p-2"
                            value={paymentTermId ?? ""}
                            onChange={(e) => setPaymentTermId(e.target.value === "" ? null : Number(e.target.value))}
                        >
                            <option value="">Select Payment Term</option>
                            {paymentTerms.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Reference */}
                    <div>
                        <label className="block text-sm mb-1">Reference</label>
                        <input type="text" className="w-full border rounded p-2" value={reference} onChange={(e) => setReference(e.target.value)} />
                    </div>

                    {/* Remarks */}
                    <div className="col-span-2">
                        <label className="block text-sm mb-1">Remarks</label>
                        <textarea className="w-full border rounded p-2" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
                    </div>
                </div>

                {/* Supplier detection summary */}


                {/* Items grouped by supplier */}
                <h3 className="font-semibold mb-2">Selected Items by Supplier</h3>
                {detectedSuppliers.length > 0 ? (
                    detectedSuppliers.map((sid) => {
                        const supplier = suppliers.find((s) => s.id === sid);
                        // group items for this supplier
                        const supplierItems = items.filter(it => productSupplierMap[it.product_id]?.supplier_id === sid);

                        if (supplierItems.length === 0) return null;

                        return (
                            <div key={sid} className="mb-6">
                                <h4 className="font-medium mb-2">{supplier?.supplier_name || `Supplier ${sid}`}</h4>
                                <table className="w-full border mb-4 text-sm">
                                    <thead>
                                    <tr className="bg-gray-100">
                                        <th className="border p-2 text-left">Product</th>
                                        <th className="border p-2 text-left">Branch</th>
                                        <th className="border p-2 text-center w-24">Qty</th>
                                        <th className="border p-2 text-right w-32">Unit Price</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {supplierItems.map((it) => {
                                        const productPrice = productDetailsMap[it.product_id]?.price_per_unit ?? it.unit_price ?? 0;
                                        return (
                                            <tr key={`${it.branch_id}-${it.product_id}`}>
                                                <td className="border p-2">{it.product_name}</td>
                                                <td className="border p-2">{it.branch_name}</td>
                                                <td className="border p-2 text-center">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={quantities[it.product_id] ?? 0} // shows initial quantity
                                                        onChange={(e) => handleQuantityChange(it.product_id, Number(e.target.value))}
                                                        className="border rounded p-1 w-20 text-center"
                                                    />
                                                </td>


                                                <td className="border p-2 text-right">{productPrice.toFixed(2)}</td>
                                            </tr>
                                        );
                                    })}
                                    </tbody>
                                </table>
                            </div>
                        );
                    })
                ) : (
                    <div className="flex flex-col items-center justify-center text-gray-600 border rounded p-6">
                        <p className="mb-3">No suppliers detected for selected items.</p>
                        <button
                            className="px-4 py-2 bg-green-600 text-white rounded"
                            onClick={() => setShowAddSupplierModal(true)}
                        >
                            + Add Supplier
                        </button>
                    </div>                )}


                <div className="flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 border rounded">
                        Cancel
                    </button>
                    <button onClick={handleSubmit} disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded">
                        {isSubmitting ? "Creating..." : "Create PO"}
                    </button>
                </div>
            </div>
            {showAddSupplierModal && (
                <AddSupplierModal
                    suppliers={suppliers}
                    items={items}
                    onClose={() => setShowAddSupplierModal(false)}
                    onAdded={() => {
                        // Refresh mappings after adding
                        window.location.reload();
                    }}
                />
            )}

        </div>
    );


}
