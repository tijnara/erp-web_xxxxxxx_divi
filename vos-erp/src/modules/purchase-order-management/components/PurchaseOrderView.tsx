"use client";

import React, { useEffect, useState, useCallback } from "react";
import { AsyncSelect } from "@/components/ui/AsyncSelect";
import { useSession } from "@/hooks/use-session";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

const API_BASE = "http://100.119.3.44:8090/items";

const INVENTORY_STATUS: { [key: number]: string } = { 0: "Pending", 1: "Partial", 2: "Received" };
const INVENTORY_STATUS_COLOR: { [key: number]: string } = { 0: "status-pending", 1: "status-partial", 2: "status-received" };
const PAYMENT_STATUS: { [key: number]: string } = { 1: "Unpaid", 2: "Paid" };
const PAYMENT_STATUS_COLOR: { [key: number]: string } = { 1: "status-unpaid", 2: "status-paid" };

// Type definitions
interface Supplier {
    id: number;
    supplier_name: string;
}
interface PurchaseOrder {
    purchase_order_id: number;
    purchase_order_no: string;
    supplier_id: number;
    date: string;
    reference?: string;
    remark?: string;
    inventory_status: number;
    payment_status: number;
}
interface PurchaseOrderProduct {
    purchase_order_product_id: number;
    purchase_order_id: number;
    product_id: number;
    ordered_quantity: number;
    unit_price: string;
    approved_price: string | null;
    discounted_price: string | null;
    line_discount_id: number | null;
    vat_amount: string | null;
    withholding_amount: string | null;
    total_amount: string;
    branch_id: number;
    received: string | null;
}
interface PurchaseOrderReceiving {
    purchase_order_product_id: number;
    purchase_order_id: number;
    product_id: number;
    branch_id: number;
    received_quantity: number;
    receipt_no: string;
    receipt_date: string;
    serial_no: string;
}
interface LineDiscount {
    id: number;
    line_discount: string;
    percentage: string;
}
interface TaxRates {
    VATRate: number;
    WithholdingRate: number;
}


export function PurchaseOrderView() {
    const todayDate = new Date().toISOString().slice(0, 10);

    // State
    const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
    const [products, setProducts] = useState<PurchaseOrderProduct[]>([]);
    const [receiving, setReceiving] = useState<PurchaseOrderReceiving[]>([]);
    const [activePOId, setActivePOId] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [showPOModal, setShowPOModal] = useState(false);
    const [showSerialsModal, setShowSerialsModal] = useState(false);
    const [serialsToShow, setSerialsToShow] = useState("");
    const [tab, setTab] = useState("products");
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [showProductModal, setShowProductModal] = useState(false);
    const [showReceivingModal, setShowReceivingModal] = useState(false);
    const [poError, setPoError] = useState<string>("");
    const [poLoading, setPoLoading] = useState<boolean>(false);
    const [nextPONumber, setNextPONumber] = useState("");
    const [receivingTypes, setReceivingTypes] = useState<{id: number, description: string}[]>([]);
    const [priceTypes, setPriceTypes] = useState<{id: number, name: string}[]>([]);
    const [priceTypesLoading, setPriceTypesLoading] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState<{ id: number | string; name: string } | null>(null);
    const [selectedBranch, setSelectedBranch] = useState<{ id: number | string; name: string } | null>(null);
    const [selectedProduct, setSelectedProduct] = useState<{ id: number | string; name: string; meta?: { price?: number, line_discount_id?: number | null } } | null>(null);
    const [orderedQuantity, setOrderedQuantity] = useState<number>(1);
    const [unitPrice, setUnitPrice] = useState<string>("");
    const [approvedPrice, setApprovedPrice] = useState<string>("");
    const [discountedPrice, setDiscountedPrice] = useState<string>("");
    const [vatAmount, setVatAmount] = useState<string>("");
    const [withholdingAmount, setWithholdingAmount] = useState<string>("");
    const [totalAmount, setTotalAmount] = useState<string>("");
    const [visiblePOCount, setVisiblePOCount] = useState(10);
    const [productError, setProductError] = useState("");
    const [productLoading, setProductLoading] = useState(false);
    const [branches, setBranches] = useState<any[]>([]);
    const [productFetchUrl, setProductFetchUrl] = useState<string | null>(null);
    const [productUrlLoading, setProductUrlLoading] = useState<boolean>(false);
    const [lineDiscounts, setLineDiscounts] = useState<LineDiscount[]>([]);
    const [supplierProductsMap, setSupplierProductsMap] = useState<Map<number, any>>(new Map());
    const [showProductDetailsModal, setShowProductDetailsModal] = useState(false);
    const [selectedPOProduct, setSelectedPOProduct] = useState<PurchaseOrderProduct | null>(null);
    const [productNameMap, setProductNameMap] = useState<Map<number, string>>(new Map());
    const [taxRates, setTaxRates] = useState<TaxRates>({ VATRate: 0, WithholdingRate: 0 });
    const [paymentTerms, setPaymentTerms] = useState<{id: number, payment_name: string, payment_days: number|null}[]>([]);
    const [paymentTermsLoading, setPaymentTermsLoading] = useState(false);
    const [selectedPaymentTermId, setSelectedPaymentTermId] = useState<number | string>("");


    useSession();

    // Fetch initial data
    useEffect(() => {
        fetch(`${API_BASE}/purchase_order`).then(res => res.json()).then(data => setPurchaseOrders(data.data || []));
        fetch(`${API_BASE}/purchase_order_products`).then(res => res.json()).then(data => setProducts(data.data || []));
        fetch(`${API_BASE}/purchase_order_receiving`).then(res => res.json()).then(data => setReceiving(data.data || []));
        fetch(`${API_BASE}/suppliers`).then(res => res.json()).then(data => setSuppliers(data.data || []));
        fetch(`${API_BASE}/receiving_type`).then(res => res.json()).then(data => setReceivingTypes(data.data || []));
        fetch(`${API_BASE}/branches`).then(res => res.json()).then(data => setBranches(data.data || []));
        fetch(`${API_BASE}/line_discount?limit=-1`).then(res => res.json()).then(data => setLineDiscounts(data.data || []));

        // Fetch tax rates
        fetch(`${API_BASE}/tax_rates`).then(res => res.json()).then(data => {
            if (data.data && data.data.length > 0) {
                setTaxRates({
                    VATRate: parseFloat(data.data[0].VATRate) || 0,
                    WithholdingRate: parseFloat(data.data[0].WithholdingRate) || 0,
                });
            }
        });

        // Fetch all products to create a name map
        fetch(`${API_BASE}/products?limit=-1&fields=product_id,product_name`)
            .then(res => res.json())
            .then(data => {
                const newMap = new Map<number, string>();
                (data.data || []).forEach((product: any) => {
                    newMap.set(product.product_id, product.product_name);
                });
                setProductNameMap(newMap);
            });
    }, []);

    // PO details derived from state
    const activePO = purchaseOrders.find(po => po.purchase_order_id === activePOId);
    const productsForPO = products.filter(p => p.purchase_order_id === activePOId);
    const receivingForPO = receiving.filter(r => r.purchase_order_id === activePOId);

    // This effect runs when the "Add Product" modal is opened.
    useEffect(() => {
        if (showProductModal && activePO) {
            const supplierId = activePO.supplier_id;
            if (!supplierId) return;

            setProductUrlLoading(true);
            setProductFetchUrl(null);

            fetch(`${API_BASE}/supplier_discount_products?filter[supplier_id]=${supplierId}&limit=-1`)
                .then(res => res.json())
                .then(discountData => {
                    const productsData = discountData.data || [];
                    const newMap = new Map<number, any>();
                    productsData.forEach((item: any) => newMap.set(item.product_id, item));
                    setSupplierProductsMap(newMap);

                    const productIds = Array.from(newMap.keys());

                    if (productIds.length > 0) {
                        const url = `${API_BASE}/products?filter[product_id][_in]=${productIds.join(",")}`;
                        setProductFetchUrl(url);
                    } else {
                        setProductFetchUrl(`${API_BASE}/products?filter[product_id][_in]=-1`);
                    }
                })
                .catch(err => {
                    console.error("Failed to fetch supplier products:", err);
                    setProductFetchUrl(`${API_BASE}/products?filter[product_id][_in]=-1`);
                })
                .finally(() => {
                    setProductUrlLoading(false);
                });
        } else {
            setProductFetchUrl(null);
            setProductUrlLoading(false);
            setSupplierProductsMap(new Map());
        }
    }, [showProductModal, activePO]);


    // Fetch price types when Create PO modal opens
    useEffect(() => {
        if (!showPOModal) return;
        let alive = true;
        (async () => {
            setPriceTypesLoading(true);
            try {
                const res = await fetch(`${API_BASE}/price_types?limit=-1&fields=*`);
                const json = await res.json();
                const raw = Array.isArray(json) ? json : (json?.data ?? []);
                type PriceRaw = Record<string, unknown>;
                const items = (raw || []).map((p: unknown) => {
                    const pr = p as PriceRaw;
                    const id = pr.id ?? pr.price_type_id ?? pr.price_type ?? pr.price_type_uid ?? pr.uid ?? pr.name ?? String(pr);
                    const name = pr.name ?? pr.price_type_name ?? pr.description ?? pr.price_type ?? String(pr.id ?? id);
                    return { id, name };
                });
                if (alive) setPriceTypes(items);
            } catch (err) {
                if (alive) setPriceTypes([]);
            } finally {
                if (alive) setPriceTypesLoading(false);
            }
        })();
        return () => { alive = false; };
    }, [showPOModal]);

    // Fetch payment terms when Create PO modal opens
    useEffect(() => {
        if (!showPOModal) return;
        let alive = true;
        (async () => {
            setPaymentTermsLoading(true);
            try {
                const res = await fetch("http://100.119.3.44:8090/items/payment_terms");
                const json = await res.json();
                if (alive) setPaymentTerms(json.data || []);
            } catch (err) {
                if (alive) setPaymentTerms([]);
            } finally {
                if (alive) setPaymentTermsLoading(false);
            }
        })();
        return () => { alive = false; };
    }, [showPOModal]);

    // Handle PO number generation
    useEffect(() => {
        if (showPOModal) {
            let maxNum = 0;
            purchaseOrders.forEach(po => {
                const match = po.purchase_order_no.match(/PO-2025-(\d+)/);
                if (match) {
                    const num = parseInt(match[1], 10);
                    if (num > maxNum) maxNum = num;
                }
            });
            const nextNum = (maxNum + 1).toString().padStart(3, "0");
            setNextPONumber(`PO-2025-${nextNum}`);
        }
        if (!showPOModal) {
            setSelectedSupplier(null);
            setSelectedProduct(null);
            setUnitPrice("");
            setSelectedPaymentTermId(""); // Reset payment term on modal close
        }
    }, [showPOModal, purchaseOrders]);

    // Calculations for Add Product Modal
    const calculateValues = useCallback(() => {
        const price = parseFloat(unitPrice);
        if (isNaN(price)) {
            setDiscountedPrice("");
            setVatAmount("");
            setWithholdingAmount("");
            return;
        }

        const discount = lineDiscounts.find(ld => ld.id === selectedProduct?.meta?.line_discount_id);
        const discountPercentage = discount ? parseFloat(discount.percentage) / 100 : 0;
        const finalDiscountedPrice = price * (1 - discountPercentage);
        setDiscountedPrice(finalDiscountedPrice.toFixed(2));

        const calculatedVat = price * taxRates.VATRate;
        setVatAmount(calculatedVat.toFixed(2));

        const calculatedWithholding = price * taxRates.WithholdingRate;
        setWithholdingAmount(calculatedWithholding.toFixed(2));

    }, [unitPrice, selectedProduct, lineDiscounts, taxRates]);

    useEffect(() => {
        calculateValues();
    }, [calculateValues]);

    // Auto-calculate total_amount
    useEffect(() => {
        const qty = Number(orderedQuantity);
        const price = Number(discountedPrice) > 0 ? Number(discountedPrice) : Number(unitPrice);
        if (!isNaN(qty) && !isNaN(price)) {
            setTotalAmount((qty * price).toFixed(2));
        } else {
            setTotalAmount("");
        }
    }, [orderedQuantity, unitPrice, discountedPrice]);


    // Filtered PO list
    const filteredPOs = purchaseOrders.filter(po => {
        return po.purchase_order_no.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const getSupplierName = (id: number) => {
        const supplier = suppliers.find(s => s.id === id);
        return supplier ? supplier.supplier_name : "Unknown Supplier";
    };

    const getBranchName = (id: number) => {
        const branch = branches.find(b => b.id === id);
        return branch ? branch.branch_name : "Unknown Branch";
    };

    const handlePOClick = async (poId: number) => {
        setActivePOId(poId);
        setTab("products");
        setShowPOModal(false);
        try {
            const res = await fetch(`${API_BASE}/purchase_order_products?filter[purchase_order_id]=${poId}`);
            const json = await res.json();
            setProducts(prevProducts => {
                const otherPOProducts = prevProducts.filter(p => p.purchase_order_id !== poId);
                return [...otherPOProducts, ...(json.data || [])];
            });
        } catch {}
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    const handleShowSerials = (serials: string) => {
        setSerialsToShow(serials);
        setShowSerialsModal(true);
    };

    // UI
    return (
        <div className="flex flex-col h-screen font-inter bg-gray-100">
            {/* Header Bar */}
            <header className="bg-white shadow-sm p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 z-10">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl md:text-2xl font-semibold text-gray-700">Purchase Order Management</h2>
                </div>
                <div className="flex flex-col md:flex-row gap-2 md:items-center">
                    <div className="relative w-full md:w-64">
                        <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                        <input type="text" value={searchTerm} onChange={handleSearch} placeholder="Search PO#, supplier..." className="w-full pl-9 p-2 border rounded-md bg-gray-50 focus:ring-2 focus:ring-indigo-300" />
                    </div>
                    <button onClick={() => setShowPOModal(true)} className="bg-indigo-600 text-white py-2.5 px-4 rounded-lg hover:bg-indigo-700 transition duration-300 flex items-center justify-center font-semibold">
                        <i className="fas fa-plus mr-2"></i> Create Purchase Order
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 flex flex-col md:flex-row gap-6 p-4 md:p-6">
                {/* PO List */}
                <nav className="w-full md:w-1/3 lg:w-1/4 bg-white rounded-lg shadow-md p-0 overflow-y-auto">
                    <h3 className="text-lg font-semibold text-gray-700 px-6 pt-6 pb-2">Purchase Orders</h3>
                    {filteredPOs.length === 0 ? (
                        <p className="text-center text-gray-500 p-4">No matching orders found.</p>
                    ) : (
                        <div>
                            {filteredPOs.slice(0, visiblePOCount).sort((a, b) => b.purchase_order_id - a.purchase_order_id).map(po => (
                                <a
                                    href="#"
                                    key={po.purchase_order_id}
                                    className={`block px-6 py-4 border-b hover:bg-gray-50 transition duration-200 ${activePOId === po.purchase_order_id ? "bg-indigo-50 border-l-4 border-indigo-600" : ""}`}
                                    onClick={e => { e.preventDefault(); handlePOClick(po.purchase_order_id); }}
                                >
                                    <div className="flex justify-between items-center">
                                        <p className="font-bold text-gray-800">{po.purchase_order_no}</p>
                                        <span className={`${INVENTORY_STATUS_COLOR[po.inventory_status]} status-badge`}>{INVENTORY_STATUS[po.inventory_status]}</span>
                                    </div>
                                    <div className="text-sm text-gray-500 mt-1">
                                        <p>{getSupplierName(po.supplier_id)}</p>
                                        <p>{po.date}</p>
                                    </div>
                                </a>
                            ))}
                            {visiblePOCount < filteredPOs.length && (
                                <div className="text-center p-4">
                                    <button
                                        onClick={() => setVisiblePOCount(prevCount => prevCount + 10)}
                                        className="text-indigo-600 hover:text-indigo-800 font-semibold"
                                    >
                                        Load More
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </nav>

                {/* PO Details View */}
                <main className="flex-1 bg-white rounded-lg shadow-md p-6 overflow-y-auto" id="po-details-view">
                    {!activePO ? (
                        <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                            <i className="fas fa-file-invoice-dollar text-6xl mb-4 text-gray-300"></i>
                            <h3 className="text-2xl font-semibold">No Purchase Order Selected</h3>
                            <p className="mt-2 max-w-md">Select a PO from the list to view its details, or create a new one to begin the procurement process.</p>
                        </div>
                    ) : (
                        <div id="po-content">
                            {/* PO Header & Status */}
                            <div className="mb-6">
                                <div className="flex flex-wrap justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-3xl font-bold text-gray-800">{activePO.purchase_order_no}</h3>
                                        <p className="text-gray-500">Supplier: <span className="font-medium text-gray-700">{getSupplierName(activePO.supplier_id)}</span></p>
                                    </div>
                                    <div className="text-right mt-4 sm:mt-0">
                                        <p className="text-sm text-gray-500">PO Date: <span className="font-medium text-gray-700">{activePO.date}</span></p>
                                        <div className="flex items-center justify-end space-x-2 mt-2">
                                            <span className={`status-badge ${INVENTORY_STATUS_COLOR[activePO.inventory_status]}`}>{INVENTORY_STATUS[activePO.inventory_status]}</span>
                                            <span className={`status-badge ${PAYMENT_STATUS_COLOR[activePO.payment_status]}`}>{PAYMENT_STATUS[activePO.payment_status]}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="border-t pt-4 text-sm text-gray-600">
                                    <p><span className="font-semibold">Reference:</span> <span>{activePO.reference || "N/A"}</span></p>
                                    <p><span className="font-semibold">Remarks:</span> <span>{activePO.remark || "N/A"}</span></p>
                                </div>
                            </div>

                            {/* Actions & Tabs */}
                            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                                <div id="po-actions" className="flex flex-wrap gap-2">
                                    <button className="bg-indigo-500 text-white py-2 px-4 rounded-lg hover:bg-indigo-600 text-sm font-semibold flex items-center" onClick={() => setShowProductModal(true)}><i className="fas fa-plus mr-2"></i>Add Product</button>
                                    <button className="bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 text-sm font-semibold flex items-center" onClick={() => setShowReceivingModal(true)}><i className="fas fa-truck-loading mr-2"></i>Receive Stock</button>
                                    <button className="bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 text-sm font-semibold flex items-center"><i className="fas fa-print mr-2"></i>Print PO</button>
                                </div>
                                <div className="border-b border-gray-200">
                                    <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                                        <a href="#" className={`tab-link ${tab === "products" ? "border-indigo-500 text-indigo-600" : "border-transparent text-gray-500"} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`} onClick={e => { e.preventDefault(); setTab("products"); }}>Products Ordered</a>
                                        <a href="#" className={`tab-link ${tab === "receiving" ? "border-indigo-500 text-indigo-600" : "border-transparent text-gray-500"} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`} onClick={e => { e.preventDefault(); setTab("receiving"); }}>Receiving History</a>
                                    </nav>
                                </div>
                            </div>

                            {/* Tab Content */}
                            <div className={tab === "products" ? "" : "hidden"}>
                                {/* Products Tab */}
                                <div className="rounded-lg shadow-md overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left text-gray-500">
                                            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3">SKU</th>
                                                <th className="px-6 py-3">Product</th>
                                                <th className="px-6 py-3">Branch/Warehouse</th>
                                                <th className="px-6 py-3 text-right">Qty</th>
                                                <th className="px-6 py-3 text-right">Unit Price</th>
                                                <th className="px-6 py-3 text-right">Discounted Price</th>
                                                <th className="px-6 py-3 text-right">VAT Amount</th>
                                                <th className="px-6 py-3 text-right">Withholding Amount</th>
                                                <th className="px-6 py-3 text-right">Total Amount</th>
                                                <th className="px-6 py-3">Received</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {productsForPO.length > 0 ? productsForPO.map(p => (
                                                <tr
                                                    key={p.purchase_order_product_id}
                                                    className="bg-white border-b hover:bg-gray-50 cursor-pointer"
                                                    onClick={() => {
                                                        setSelectedPOProduct(p);
                                                        setShowProductDetailsModal(true);
                                                    }}
                                                >
                                                    <td className="px-6 py-4 font-mono text-xs">{p.product_id}</td>
                                                    <td className="px-6 py-4 font-medium text-gray-900">{productNameMap.get(p.product_id) || `Product ${p.product_id}`}</td>
                                                    <td className="px-6 py-4">{getBranchName(p.branch_id)}</td>
                                                    <td className="px-6 py-4 text-right">{p.ordered_quantity}</td>
                                                    <td className="px-6 py-4 text-right">₱{parseFloat(p.unit_price).toFixed(2)}</td>
                                                    <td className="px-6 py-4 text-right">{p.discounted_price !== null ? `₱${parseFloat(p.discounted_price).toFixed(2)}` : '-'}</td>
                                                    <td className="px-6 py-4 text-right">{p.vat_amount !== null ? `₱${parseFloat(p.vat_amount).toFixed(2)}` : '-'}</td>
                                                    <td className="px-6 py-4 text-right">{p.withholding_amount !== null ? `₱${parseFloat(p.withholding_amount).toFixed(2)}` : '-'}</td>
                                                    <td className="px-6 py-4 text-right">₱{p.total_amount ? parseFloat(p.total_amount).toFixed(2) : '0.00'}</td>
                                                    <td className="px-6 py-4">{p.received !== null ? String(p.received) : '-'}</td>
                                                </tr>
                                            )) : (
                                                <tr><td colSpan={11} className="text-center py-8 text-gray-500">No products have been added to this order.</td></tr>
                                            )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                            <div className={tab === "receiving" ? "" : "hidden"}>
                                {/* Receiving Tab */}
                                <div className="rounded-lg shadow-md overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left text-gray-500">
                                            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3">Receipt Date</th>
                                                <th className="px-6 py-3">Receipt No.</th>
                                                <th className="px-6 py-3">Product</th>
                                                <th className="px-6 py-3">Branch</th>
                                                <th className="px-6 py-3 text-right">Received Qty</th>
                                                <th className="px-6 py-3 text-center">Serial Numbers</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {receivingForPO.length > 0 ? receivingForPO.map(r => (
                                                <tr key={r.purchase_order_product_id} className="bg-white border-b hover:bg-gray-50">
                                                    <td className="px-6 py-4">{r.receipt_date}</td>
                                                    <td className="px-6 py-4 font-medium text-gray-800">{r.receipt_no}</td>
                                                    <td className="px-6 py-4">{productNameMap.get(r.product_id) || `Product ${r.product_id}`}</td>
                                                    <td className="px-6 py-4">{getBranchName(r.branch_id)}</td>
                                                    <td className="px-6 py-4 text-right font-semibold">{r.received_quantity}</td>
                                                    <td className="px-6 py-4 text-center">
                                                        <button onClick={() => handleShowSerials(r.serial_no)} className="text-indigo-600 hover:underline text-xs">View Serials</button>
                                                    </td>
                                                </tr>
                                            )) : (
                                                <tr><td colSpan={6} className="text-center py-8 text-gray-500">No receiving records for this purchase order.</td></tr>
                                            )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {/* Serial Numbers Modal */}
            {showSerialsModal && (
                <div className="modal-backdrop" style={{ display: "flex" }}>
                    <div className="modal bg-white w-11/12 md:max-w-lg mx-auto rounded-lg shadow-xl p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-800">Recorded Serial Numbers</h2>
                            <button type="button" className="modal-close-btn text-gray-500 hover:text-gray-800 text-3xl" onClick={() => setShowSerialsModal(false)}>&times;</button>
                        </div>
                        <ul className="space-y-2 max-h-80 overflow-y-auto">
                            {serialsToShow.split(",").map((s, i) => (
                                <li key={i} className="font-mono text-sm bg-gray-100 p-2 rounded">{s.trim()}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            {/* Create PO Modal */}
            <Dialog open={showPOModal} onOpenChange={setShowPOModal}>
                <DialogContent className="max-w-2xl w-full">
                    <DialogTitle>Create Purchase Order</DialogTitle>
                    <form
                        className="p-6"
                        onSubmit={async e => {
                            e.preventDefault();
                            setPoError("");
                            setPoLoading(true);
                            const form = e.target as HTMLFormElement;
                            const po_no = nextPONumber;
                            const supplier_id_val = selectedSupplier ? String(selectedSupplier.id) : "";
                            if (!supplier_id_val || isNaN(Number(supplier_id_val))) {
                                setPoError("Please select a valid supplier.");
                                setPoLoading(false);
                                return;
                            }
                            const receiving_type = (form.elements.namedItem("receiving_type") as HTMLSelectElement).value;
                            const payment_term = (form.elements.namedItem("payment_term") as HTMLSelectElement).value;
                            const price_type = (form.elements.namedItem("price_type") as HTMLSelectElement).value;
                            const date_encoded = todayDate;
                            const date = (form.elements.namedItem("date") as HTMLInputElement).value;
                            const reference = (form.elements.namedItem("reference") as HTMLInputElement).value;
                            const remark = (form.elements.namedItem("remark") as HTMLTextAreaElement).value;
                            const now = new Date();
                            const pad = (n: number) => String(n).padStart(2, "0");
                            const timeNow = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
                            const datetimeLocal = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
                            try {
                                const payload = {
                                    purchase_order_no: po_no,
                                    supplier_id: Number(supplier_id_val),
                                    receiving_type,
                                    payment_term,
                                    price_type,
                                    date_encoded,
                                    time: timeNow,
                                    datetime: datetimeLocal,
                                    date,
                                    reference,
                                    remark,
                                    inventory_status: 0,
                                    payment_status: 1
                                };
                                const res = await fetch(`${API_BASE}/purchase_order`, {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify(payload)
                                });
                                if (!res.ok) {
                                    const errorText = await res.text();
                                    throw new Error(errorText || `HTTP ${res.status}`);
                                }
                                const listRes = await fetch(`${API_BASE}/purchase_order`);
                                const listJson = await listRes.json();
                                setPurchaseOrders(listJson.data || []);
                                setShowPOModal(false);
                                setSelectedSupplier(null);
                            } catch (err: any) {
                                setPoError(err?.message || "Failed to create purchase order.");
                            } finally {
                                setPoLoading(false);
                            }
                        }}
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="po_no" className="block text-sm font-medium text-gray-700">PO Number</label>
                                <input
                                    type="text"
                                    name="po_no"
                                    id="po_no"
                                    value={nextPONumber}
                                    readOnly
                                    className="mt-1 block w-full p-2 border rounded-md bg-gray-50 text-gray-900 font-mono text-lg"
                                />
                            </div>
                            <div>
                                {/* This is the corrected searchable dropdown implementation */}
                                <AsyncSelect
                                    label="Supplier"
                                    placeholder="Search for a supplier..."
                                    fetchUrl="http://100.119.3.44:8090/items/suppliers"
                                    initial={selectedSupplier ? { id: selectedSupplier.id, name: selectedSupplier.name } : null}
                                    onChange={(opt) => {
                                        const selectedOpt = opt as { id: number | string; name: string; meta?: { payment_terms?: string } } | null;
                                        setSelectedSupplier(selectedOpt);

                                        if (selectedOpt && selectedOpt.meta?.payment_terms && paymentTerms.length > 0) {
                                            const termNameFromSupplier = selectedOpt.meta.payment_terms;
                                            const matchingTerm = paymentTerms.find(
                                                (term) => term.payment_name.toLowerCase() === termNameFromSupplier.toLowerCase()
                                            );
                                            setSelectedPaymentTermId(matchingTerm ? matchingTerm.id : "");
                                        } else {
                                            setSelectedPaymentTermId("");
                                        }
                                    }}
                                    disabled={false}
                                    mapOption={(item: unknown) => {
                                        const it = item as Record<string, unknown>;
                                        return {
                                            id: (it.id as number) ?? Number(it.supplier_id ?? 0),
                                            name: String(it.supplier_name ?? it.name ?? ""),
                                            meta: {
                                                payment_terms: it.payment_terms as string | undefined,
                                            },
                                        };
                                    }}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="date_encoded" className="block text-sm font-medium text-gray-700">Encoded Date</label>
                                <input
                                    type="date"
                                    name="date_encoded"
                                    id="date_encoded"
                                    defaultValue={todayDate}
                                    readOnly
                                    className="mt-1 block w-full p-2 border rounded-md bg-gray-50 text-gray-900"
                                />
                            </div>
                            <div>
                                <label htmlFor="date" className="block text-sm font-medium text-gray-700">PO Date</label>
                                <input
                                    type="date"
                                    name="date"
                                    id="date"
                                    defaultValue={todayDate}
                                    className="mt-1 block w-full p-2 border rounded-md bg-gray-50 text-gray-900"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="receiving_type" className="block text-sm font-medium text-gray-700">Receiving Type</label>
                                <div className="mt-1">
                                    <select
                                        name="receiving_type"
                                        id="receiving_type"
                                        value="RECEIVE FROM PO"
// readOnly
                                        disabled
                                        className="block w-full p-2 border rounded-md bg-gray-50 text-gray-900 cursor-not-allowed"
                                    >
                                        <option value="RECEIVE FROM PO">RECEIVE FROM PO</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label htmlFor="payment_term" className="block text-sm font-medium text-gray-700">Payment Term</label>
                                <div className="mt-1">
                                    <select
                                        name="payment_term"
                                        id="payment_term"
                                        value={selectedPaymentTermId}
                                        onChange={(e) => setSelectedPaymentTermId(e.target.value)}
                                        className="block w-full p-2 border rounded-md bg-gray-50 text-gray-900"
                                        disabled={paymentTermsLoading}
                                    >
                                        <option value="" disabled>{paymentTermsLoading ? "Loading payment terms..." : "Select payment term"}</option>
                                        {paymentTerms.map(term => (
                                            <option key={term.id} value={term.id}>
                                                {term.payment_name}{term.payment_days !== null ? ` (${term.payment_days} days)` : ""}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="price_type" className="block text-sm font-medium text-gray-700">Price Type</label>
                                <div className="mt-1">
                                    <select
                                        name="price_type"
                                        id="price_type"
                                        defaultValue=""
                                        className="block w-full p-2 border rounded-md bg-gray-50 text-gray-900"
                                    >
                                        {priceTypesLoading ? (
                                            <option value="" disabled>Loading price types...</option>
                                        ) : (
                                            <>
                                                <option value="" disabled>Select price type</option>
                                                {priceTypes.map(type => (
                                                    <option key={String(type.id)} value={String(type.id)}>{String(type.name)}</option>
                                                ))}
                                            </>
                                        )}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label htmlFor="reference" className="block text-sm font-medium text-gray-700">Reference</label>
                                <input
                                    type="text"
                                    name="reference"
                                    id="reference"
                                    className="mt-1 block w-full p-2 border rounded-md bg-gray-50 text-gray-900"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="remark" className="block text-sm font-medium text-gray-700">Remarks</label>
                                <textarea
                                    name="remark"
                                    id="remark"
                                    rows={3}
                                    className="mt-1 block w-full p-2 border rounded-md bg-gray-50 text-gray-900"
                                ></textarea>
                            </div>
                        </div>
                        {poError && (
                            <div className="mt-4 text-red-600 text-sm">
                                <i className="fas fa-exclamation-circle mr-2"></i>
                                {poError}
                            </div>
                        )}
                        <div className="mt-6 flex justify-end gap-4">
                            <button
                                type="button"
                                className="bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition duration-300"
                                onClick={() => setShowPOModal(false)}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className={`bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition duration-300 flex items-center justify-center font-semibold ${poLoading ? "opacity-75 cursor-not-allowed" : ""}`}
                                disabled={poLoading}
                            >
                                {poLoading && <i className="fas fa-spinner fa-spin mr-2"></i>}
                                Create Purchase Order
                            </button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Add Product Modal */}
            <Dialog open={showProductModal} onOpenChange={setShowProductModal}>
                <DialogContent className="max-w-lg w-full">
                    <DialogTitle>Add Product to PO</DialogTitle>
                    <form
                        onSubmit={async e => {
                            e.preventDefault();
                            setProductError("");
                            setProductLoading(true);
                            if (!activePOId) {
                                setProductError("No active purchase order selected.");
                                setProductLoading(false);
                                return;
                            }
                            const product_id_val = selectedProduct ? String(selectedProduct.id) : "";
                            const branch_id = selectedBranch ? selectedBranch.id : "";
                            if (!product_id_val) {
                                setProductError("Please select a product.");
                                setProductLoading(false);
                                return;
                            }
                            if (!branch_id) {
                                setProductError("Please select a branch.");
                                setProductLoading(false);
                                return;
                            }

                            const duplicateProduct = products.some(
                                (p) => p.purchase_order_id === activePOId && p.product_id === parseInt(product_id_val)
                            );
                            if (duplicateProduct) {
                                setProductError("This product is already added to the purchase order.");
                                setProductLoading(false);
                                return;
                            }

                            try {
                                const payload = {
                                    purchase_order_id: activePOId,
                                    product_id: parseInt(product_id_val),
                                    ordered_quantity: orderedQuantity,
                                    unit_price: unitPrice,
                                    approved_price: approvedPrice || null,
                                    discounted_price: discountedPrice || null,
                                    vat_amount: vatAmount || null,
                                    withholding_amount: withholdingAmount || null,
                                    total_amount: totalAmount,
                                    branch_id: branch_id ? parseInt(String(branch_id)) : null,
                                };
                                const res = await fetch(`${API_BASE}/purchase_order_products`, {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify(payload)
                                });
                                if (!res.ok) {
                                    const text = await res.text();
                                    setProductError(text || `HTTP ${res.status}`);
                                    setProductLoading(false);
                                    return;
                                }
                                const listRes = await fetch(`${API_BASE}/purchase_order_products`);
                                const listJson = await listRes.json();
                                setProducts(listJson.data || []);
                                setShowProductModal(false);
                                setSelectedBranch(null);
                                setSelectedProduct(null);
                                setOrderedQuantity(1);
                                setUnitPrice("");
                                setApprovedPrice("");
                                setDiscountedPrice("");
                                setVatAmount("");
                                setWithholdingAmount("");
                                setTotalAmount("");
                            } catch (err: any) {
                                setProductError(err?.message || "Failed to add product.");
                            } finally {
                                setProductLoading(false);
                            }
                        }}
                    >
                        <div className="space-y-4">
                            <AsyncSelect
                                label="Product"
                                placeholder={productUrlLoading ? "Loading products for supplier..." : "Search products..."}
                                fetchUrl={productFetchUrl ?? ''}
                                initial={selectedProduct ? { id: selectedProduct.id, name: selectedProduct.name, meta: selectedProduct.meta } : null}
                                onChange={(opt) => {
                                    if (opt) {
                                        const it = opt as any;
                                        setSelectedProduct({ id: it.id, name: it.name, meta: it.meta });
                                        setUnitPrice(it.meta?.price ? String(it.meta.price) : "");
                                    } else {
                                        setSelectedProduct(null);
                                        setUnitPrice("");
                                    }
                                }}
                                disabled={productUrlLoading || !productFetchUrl}
                                mapOption={(item: any) => {
                                    const supplierProductInfo = supplierProductsMap.get(item.product_id ?? item.id);
                                    return {
                                        id: item.product_id ?? item.id,
                                        name: String(item.product_name ?? item.short_description ?? item.product_code ?? item.name),
                                        meta: {
                                            price: item.price_per_unit ?? item.cost_per_unit ?? null,
                                            line_discount_id: supplierProductInfo?.line_discount_id ?? null,
                                        }
                                    };
                                }}
                            />
                            <AsyncSelect
                                label="Branch"
                                placeholder="Search Branch..."
                                fetchUrl="http://100.119.3.44:8090/items/branches"
                                mapOption={(branch: any) => ({ id: branch.id, name: branch.branch_name })}
                                onChange={(opt) => setSelectedBranch(opt as { id: number | string; name: string } | null)}
                                disabled={false}
                            />
                            <div>
                                <label htmlFor="ordered_quantity" className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                                <input id="ordered_quantity" type="number" name="ordered_quantity" value={orderedQuantity} min={1} onChange={e => setOrderedQuantity(Number(e.target.value))} className="p-2 border rounded w-full" required />
                            </div>
                            <div>
                                <label htmlFor="unit_price" className="block text-sm font-medium text-gray-700 mb-1">Unit Price</label>
                                <input id="unit_price" type="number" step="0.01" name="unit_price" value={unitPrice} onChange={e => setUnitPrice(e.target.value)} className="p-2 border rounded w-full" required />
                            </div>
                            <div>
                                <label htmlFor="approved_price" className="block text-sm font-medium text-gray-700 mb-1">Approved Price (optional)</label>
                                <input id="approved_price" type="number" step="0.01" name="approved_price" value={approvedPrice} onChange={e => setApprovedPrice(e.target.value)} className="p-2 border rounded w-full" />
                            </div>
                            <div>
                                <label htmlFor="discounted_price" className="block text-sm font-medium text-gray-700 mb-1">Discounted Price</label>
                                <input id="discounted_price" type="number" step="0.01" name="discounted_price" value={discountedPrice} className="p-2 border rounded w-full bg-gray-100" readOnly />
                            </div>
                            <div>
                                <label htmlFor="vat_amount" className="block text-sm font-medium text-gray-700 mb-1">VAT Amount</label>
                                <input id="vat_amount" type="number" step="0.01" name="vat_amount" value={vatAmount} className="p-2 border rounded w-full bg-gray-100" readOnly />
                            </div>
                            <div>
                                <label htmlFor="withholding_amount" className="block text-sm font-medium text-gray-700 mb-1">Withholding Amount</label>
                                <input id="withholding_amount" type="number" step="0.01" name="withholding_amount" value={withholdingAmount} className="p-2 border rounded w-full bg-gray-100" readOnly />
                            </div>
                            <div>
                                <label htmlFor="total_amount" className="block text-sm font-medium text-gray-700 mb-1">Total Amount</label>
                                <input id="total_amount" type="number" step="0.01" name="total_amount" value={totalAmount} className="p-2 border rounded w-full bg-gray-100" readOnly />
                            </div>
                            {productError && <div className="text-red-600">{productError}</div>}
                            <div className="flex justify-end gap-2">
                                <button type="button" className="bg-gray-200 text-gray-800 py-2 px-4 rounded" onClick={() => { setShowProductModal(false); setSelectedProduct(null); setUnitPrice(""); }}>Cancel</button>
                                <button type="submit" disabled={productLoading} className={`bg-indigo-600 text-white py-2 px-4 rounded ${productLoading ? "opacity-75" : "hover:bg-indigo-700"}`}>
                                    {productLoading ? "Adding..." : "Add Product"}
                                </button>
                            </div>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={showProductDetailsModal} onOpenChange={setShowProductDetailsModal}>
                <DialogContent className="max-w-lg w-full">
                    <DialogTitle>Product Details</DialogTitle>
                    {selectedPOProduct && (
                        <ProductDetailsModalContent
                            key={selectedPOProduct.purchase_order_product_id}
                            product={selectedPOProduct}
                            getBranchName={getBranchName}
                            productNameMap={productNameMap}
                            onUpdate={(updatedData) => {
                                const updatedProducts = products.map(p =>
                                    p.purchase_order_product_id === selectedPOProduct.purchase_order_product_id
                                        ? { ...p, ...updatedData }
                                        : p
                                );
                                setProducts(updatedProducts);
                                setShowProductDetailsModal(false);
                            }}
                            onClose={() => setShowProductDetailsModal(false)}
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* Receive Stock Modal */}
            <div style={{display: showReceivingModal ? 'flex': 'none'}} className="modal-backdrop">
                <div className="modal bg-white w-11/12 md:max-w-lg mx-auto rounded-lg shadow-xl p-6">
                    <form
                        onSubmit={async e => {
                            e.preventDefault();
                            const form = e.target as HTMLFormElement;
                            const product_id = (form.elements.namedItem('product_id') as HTMLInputElement).value;
                            const branch_id = (form.elements.namedItem('branch_id') as HTMLInputElement).value;
                            const received_quantity = (form.elements.namedItem('received_quantity') as HTMLInputElement).value;
                            const receipt_no = (form.elements.namedItem('receipt_no') as HTMLInputElement).value;
                            const receipt_date = (form.elements.namedItem('receipt_date') as HTMLInputElement).value;
                            const serial_no = (form.elements.namedItem('serial_no') as HTMLTextAreaElement).value;
                            try {
                                await fetch(`${API_BASE}/purchase_order_receiving`, {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({
                                        purchase_order_id: activePOId,
                                        product_id: parseInt(product_id),
                                        branch_id: parseInt(branch_id),
                                        received_quantity: parseInt(received_quantity),
                                        receipt_no,
                                        receipt_date,
                                        serial_no
                                    })
                                });
                                const res = await fetch(`${API_BASE}/purchase_order_receiving`);
                                const json = await res.json();
                                setReceiving(json.data || []);
                                setShowReceivingModal(false);
                            } catch (err) {
                                setShowReceivingModal(false);
                            }
                        }}
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-800">Receive Stock for PO</h2>
                            <button type="button" className="modal-close-btn text-gray-500 hover:text-gray-800 text-3xl" onClick={() => setShowReceivingModal(false)}>&times;</button>
                        </div>
                        <div className="space-y-4">
                            <input type="number" name="product_id" placeholder="Product ID" className="p-2 border rounded w-full" required />
                            <input type="number" name="branch_id" placeholder="Branch ID" className="p-2 border rounded w-full" required />
                            <input type="number" name="received_quantity" placeholder="Received Quantity" className="p-2 border rounded w-full" required />
                            <input type="text" name="receipt_no" placeholder="Receipt No." className="p-2 border rounded w-full" required />
                            <input type="date" name="receipt_date" className="p-2 border rounded w-full" defaultValue={new Date().toISOString().slice(0,10)} required />
                            <textarea name="serial_no" placeholder="Serial Numbers (comma separated)" className="p-2 border rounded w-full"></textarea>
                            <div className="flex justify-end gap-2">
                                <button type="button" className="bg-gray-200 text-gray-800 py-2 px-4 rounded" onClick={() => setShowReceivingModal(false)}>Cancel</button>
                                <button type="submit" className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700">Receive Stock</button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

// Product Details Modal Content Component
function ProductDetailsModalContent({ product, getBranchName, productNameMap, onUpdate, onClose }: {
    product: PurchaseOrderProduct;
    getBranchName: (id: number) => string;
    productNameMap: Map<number, string>;
    onUpdate: (updatedData: { branch_id: number, ordered_quantity: number }) => void;
    onClose: () => void;
}) {
    const [localBranch, setLocalBranch] = useState<{ id: number | string; name: string } | null>(null);
    const [localQuantity, setLocalQuantity] = useState(product.ordered_quantity);
    const [isDirty, setIsDirty] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        setLocalBranch({ id: product.branch_id, name: getBranchName(product.branch_id) });
        setLocalQuantity(product.ordered_quantity);
        setIsDirty(false);
    }, [product, getBranchName]);

    const handleUpdate = async () => {
        if (!localBranch || !localBranch.id) return;
        setIsUpdating(true);

        const payload: any = {};
        if (localBranch.id !== product.branch_id) {
            payload.branch_id = localBranch.id;
        }
        if (localQuantity !== product.ordered_quantity) {
            payload.ordered_quantity = localQuantity;
        }

        try {
            const res = await fetch(`${API_BASE}/purchase_order_products/${product.purchase_order_product_id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                onUpdate({
                    branch_id: localBranch.id as number,
                    ordered_quantity: localQuantity
                });
            } else {
                console.error("Failed to update the product details.");
            }
        } catch (error) {
            console.error("An error occurred during update:", error);
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm items-center">
                <strong className="text-gray-500 col-span-2">Product:</strong>
                <span className="font-medium text-gray-900 col-span-2 mb-2">{productNameMap.get(product.product_id) || `Product ${product.product_id}`}</span>

                <strong className="text-gray-500 col-span-2">Branch / Warehouse</strong>
                <div className="col-span-2">
                    <AsyncSelect
                        label=""
                        placeholder="Search Branch..."
                        fetchUrl={`${API_BASE}/branches`}
                        initial={localBranch}
                        mapOption={(branch: any) => ({ id: branch.id, name: branch.branch_name })}
                        onChange={(opt: any) => {
                            setLocalBranch(opt);
                            setIsDirty(true);
                        }}
                        disabled={false}
                    />
                </div>

                <strong className="text-gray-500 pt-4">Ordered Quantity:</strong>
                <input
                    type="number"
                    className="p-2 border rounded w-full mt-4"
                    value={localQuantity}
                    onChange={(e) => {
                        setLocalQuantity(Number(e.target.value));
                        setIsDirty(true);
                    }}
                    min={1}
                />

                <strong className="text-gray-500">Unit Price:</strong>
                <span>₱{parseFloat(product.unit_price).toFixed(2)}</span>

                <strong className="text-gray-500">Discounted Price:</strong>
                <span>{product.discounted_price ? `₱${parseFloat(product.discounted_price).toFixed(2)}` : 'N/A'}</span>

                <strong className="text-gray-500">Total Amount:</strong>
                <span>{product.total_amount ? `₱${parseFloat(product.total_amount).toFixed(2)}` : 'N/A'}</span>
            </div>
            <div className="flex justify-end pt-4 gap-2">
                {isDirty && (
                    <button
                        type="button"
                        className="bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                        onClick={handleUpdate}
                        disabled={isUpdating}
                    >
                        {isUpdating ? 'Updating...' : 'Update'}
                    </button>
                )}
                <button
                    type="button"
                    className="bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
                    onClick={onClose}
                >
                    Close
                </button>
            </div>
        </div>
    );
}