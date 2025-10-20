"use client";

import React, { useEffect, useState, useMemo } from "react";
import { AsyncSelect } from "@/components/ui/AsyncSelect";
import { useSession } from "@/hooks/use-session";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { API_BASE, INVENTORY_STATUS, INVENTORY_STATUS_COLOR, PAYMENT_STATUS, PAYMENT_STATUS_COLOR } from "@/constants";
import { getSupplierName, getBranchName, calculateValues } from "@/utils";
import { usePurchaseOrderStore } from "@/store/usePurchaseOrderStore";
import { useFetchInitialData } from "@/hooks/useFetchInitialData";
import { CreatePOModal } from "./CreatePOModal";
import { AddProductModal } from "./AddProductModal";
import { ReceiveStockModal } from "./ReceiveStockModal";
import axios from "axios"; // Ensure axios is imported

// Updated type definition for PurchaseOrderProduct to include 'purchase_order_id'
interface PurchaseOrderProduct {
  purchase_order_product_id: number;
  purchase_order_id: number; // Added this property
  product_id: number;
  branch_id: number;
  ordered_quantity: number;
  unit_price: string;
  discounted_price?: string;
  vat_amount?: string;
  withholding_amount?: string;
  total_amount?: string;
  received?: boolean;
}

// Added missing type definition for branches
const branches: { id: number; branch_name: string }[] = [];

export function PurchaseOrderView() {
    const todayDate = new Date().toISOString().slice(0, 10);
    const {
        purchaseOrders,
        products,
        receiving,
        suppliers,
        branches,
        lineDiscounts,
        taxRates,
        setPurchaseOrders,
        setProducts,
    } = usePurchaseOrderStore();
    const { fetchInitialData } = useFetchInitialData();

    // Local UI state only
    const [activePOId, setActivePOId] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [showPOModal, setShowPOModal] = useState(false);
    const [showSerialsModal, setShowSerialsModal] = useState(false);
    const [serialsToShow, setSerialsToShow] = useState("");
    const [tab, setTab] = useState("products");
    const [showProductModal, setShowProductModal] = useState(false);
    const [showReceivingModal, setShowReceivingModal] = useState(false);
    const [poError, setPoError] = useState<string>("");
    const [poLoading, setPoLoading] = useState<boolean>(false);
    const [nextPONumber, setNextPONumber] = useState("");
    const [receivingTypes, setReceivingTypes] = useState<{id: number, description: string}[]>([]);
    const [priceTypes, setPriceTypes] = useState<{id: number, name: string}[]>([]);
    const [selectedSupplier, setSelectedSupplier] = useState<{ id: number | string; name: string } | null>(null);
    const [selectedProduct, setSelectedProduct] = useState<{ id: number | string; name: string; meta?: { price?: number, line_discount_id?: number | null } } | null>(null);
    const [orderedQuantity] = useState<number>(1);
    const [unitPrice, setUnitPrice] = useState<string>("");
    const [discountedPrice, setDiscountedPrice] = useState<string>("");
    const [vatAmount, setVatAmount] = useState<string>("");
    const [withholdingAmount, setWithholdingAmount] = useState<string>("");
    const [totalAmount, setTotalAmount] = useState<string>("");

    // Added missing state setters
    const [priceTypesLoading] = useState<boolean>(false); // Retained only the necessary part
    const [paymentTerms] = useState([]); // Retained only the necessary part
    const [paymentTermsLoading] = useState<boolean>(false); // Retained only the necessary part

    // Removed unused constants
    const [productUrlLoading, setProductUrlLoading] = useState<boolean>(false);
    const [productFetchUrl, setProductFetchUrl] = useState<string | null>(null);
    const [supplierProductsMap, setSupplierProductsMap] = useState<Map<number, any>>(new Map());

    // Added missing state variables
    const [visiblePOCount, setVisiblePOCount] = useState<number>(10);
    const [selectedPaymentTermId, setSelectedPaymentTermId] = useState<string>("");
    const [showProductDetailsModal, setShowProductDetailsModal] = useState<boolean>(false);
    const [selectedPOProduct, setSelectedPOProduct] = useState<any>(null);
    const [productNameMap, setProductNameMap] = useState<Map<number, string>>(new Map()); // --- MODIFICATION: Replaced useMemo with useState for productNameMap

    // Fixed type mismatch for setSelectedPaymentTermId
    const handleSetSelectedPaymentTermId = (id: string | number) => {
        setSelectedPaymentTermId(String(id));
    };

    useSession();

    // Fetch initial data using custom hook
    useEffect(() => {
        fetchInitialData();
        fetch(`${API_BASE}/receiving_type`).then(res => res.json()).then(data => setReceivingTypes(data.data || []));
        fetch(`${API_BASE}/price_types?limit=-1&fields=*`).then(res => res.json()).then(json => {
            const raw = Array.isArray(json) ? json : (json?.data ?? []);
            type PriceRaw = Record<string, unknown>;
            const items = (raw || []).map((p: unknown) => {
                const pr = p as PriceRaw;
                const id = pr.id ?? pr.price_type_id ?? pr.price_type ?? pr.price_type_uid ?? pr.uid ?? pr.name ?? String(pr);
                const name = pr.name ?? pr.price_type_name ?? pr.description ?? pr.price_type ?? String(pr.id ?? id);
                return { id, name };
            });
            setPriceTypes(items);
        });
    }, []);

    // PO details derived from state
    const activePO = purchaseOrders.find(po => po.purchase_order_id === activePOId);

    // Memoized derived data
    const filteredPOs = useMemo(() => purchaseOrders.filter(po => po.purchase_order_no.toLowerCase().includes(searchTerm.toLowerCase())), [purchaseOrders, searchTerm]);
    const productsForPO = useMemo(() => {
        if (!Array.isArray(products)) {
            console.error("Expected 'products' to be an array, but got:", products);
            return [];
        }
        return products.filter((p) => p.purchase_order_id === activePOId);
    }, [products, activePOId]);
    const [receivingForPO, setReceivingForPO] = useState<any[]>([]);

    // Corrected usage of state setters
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
    useEffect(() => {
        calculateValues({
            unitPrice,
            selectedProduct,
            lineDiscounts,
            taxRates,
            setDiscountedPrice,
            setVatAmount,
            setWithholdingAmount,
        });
    }, [unitPrice, selectedProduct, lineDiscounts, taxRates]);

    // Updated calculation effect
    useEffect(() => {
        const qty = Number(orderedQuantity);
        const price = Number(discountedPrice) > 0 ? Number(discountedPrice) : Number(unitPrice);
        if (!isNaN(qty) && !isNaN(price)) {
            setTotalAmount((qty * price).toFixed(2));
        } else {
            setTotalAmount("");
        }
    }, [orderedQuantity, unitPrice, discountedPrice]);


    const handlePOClick = async (poId: number) => {
        setActivePOId(poId);
        setTab("products");
        setShowPOModal(false);

        try {
            // Fetch products
            const res = await fetch(`${API_BASE}/purchase_order_products?filter[purchase_order_id]=${poId}`);
            const json = await res.json();
            const otherPOProducts = Array.isArray(products) ? products.filter((p) => p.purchase_order_id !== poId) : [];
            setProducts([...otherPOProducts, ...(json.data || [])]);
        } catch (error) {
            console.error("Failed to fetch purchase order products:", error);
        }

        // Fetch receiving
        fetchReceivingForPO(poId);
    };


    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    const handleShowSerials = (serials: string) => {
        setSerialsToShow(serials);
        setShowSerialsModal(true);
    };
    const fetchReceivingForPO = async (poId: number) => {
        try {
            const res = await fetch(`${API_BASE}/purchase_order_receiving?purchase_order_id=${poId}`);
            const json = await res.json();
            setReceivingForPO(json.data || []);
        } catch (error) {
            console.error("Failed to fetch receiving history:", error);
            setReceivingForPO([]);
        }
    };


    // --- MODIFICATION: Added useEffect to fetch all products and populate the map ---
    useEffect(() => {
        const fetchAllProducts = async () => {
            try {
                const response = await axios.get("http://100.119.3.44:8090/items/products?limit=-1");
                const productsData = response.data?.data;
                if (productsData && Array.isArray(productsData)) {
                    const newMap = new Map<number, string>();
                    productsData.forEach((product: { product_id: number, product_name: string }) => {
                        newMap.set(product.product_id, product.product_name);
                    });
                    setProductNameMap(newMap);
                }
            } catch (error) {
                console.error("Failed to fetch product names:", error);
            }
        };
        fetchAllProducts();
    }, []);


    // UI
    // @ts-ignore
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
                                        <p>{getSupplierName(po.supplier_id, suppliers)}</p>
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
                                        <p className="text-gray-500">Supplier: <span className="font-medium text-gray-700">{getSupplierName(activePO.supplier_id, suppliers)}</span></p>
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
                                                    <td className="px-6 py-4">{getBranchName(p.branch_id, branches)}</td>
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
                                            {receivingForPO
                                                .filter(r => r.purchase_order_id === activePO.purchase_order_id)
                                                .length > 0 ? (
                                                receivingForPO
                                                    .filter(r => r.purchase_order_id === activePO.purchase_order_id)
                                                    .map(r => (
                                                        <tr key={r.purchase_order_receive_id} className="bg-white border-b hover:bg-gray-50">
                                                            <td className="px-6 py-4">{r.receipt_date}</td>
                                                            <td className="px-6 py-4 font-medium text-gray-800">{r.receipt_no}</td>
                                                            <td className="px-6 py-4">{productNameMap.get(r.product_id) || `Product ${r.product_id}`}</td>
                                                            <td className="px-6 py-4">{getBranchName(r.branch_id, branches)}</td>
                                                            <td className="px-6 py-4 text-right font-semibold">{r.received_quantity}</td>
                                                            <td className="px-6 py-4 text-center">
                                                                <button onClick={() => handleShowSerials(r.serial_no)} className="text-indigo-600 hover:underline text-xs">View Serials</button>
                                                            </td>
                                                        </tr>
                                                    ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={6} className="text-center py-8 text-gray-500">
                                                        No receiving records for this purchase order.
                                                    </td>
                                                </tr>
                                            )
                                            }

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
            <CreatePOModal
  open={showPOModal}
  onClose={() => setShowPOModal(false)}
// @ts-expect-error: suppliers prop missing in CreatePOModalProps type
suppliers={suppliers}
  receivingTypes={receivingTypes}
  paymentTerms={paymentTerms}
  priceTypes={priceTypes}
  paymentTermsLoading={paymentTermsLoading}
  priceTypesLoading={priceTypesLoading}
  selectedSupplier={selectedSupplier}
  setSelectedSupplier={setSelectedSupplier}
  selectedPaymentTermId={selectedPaymentTermId}
  setSelectedPaymentTermId={handleSetSelectedPaymentTermId}
  nextPONumber={nextPONumber}
  todayDate={todayDate}
  poError={poError}
  poLoading={poLoading}
  handleSubmit={async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setPoError("");
      setPoLoading(true);
      const form = e.currentTarget; // Use e.currentTarget for type safety
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
      const datetimeLocal = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${timeNow}`;

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
              console.error("Error creating purchase order:", errorText);
              // You should probably set an error state here for the user
              setPoError(`Failed to create PO: ${errorText}`);
              return;
          }

          const listRes = await fetch(`${API_BASE}/purchase_order`);
          const listJson = await listRes.json();
          setPurchaseOrders(listJson.data || []);
          setShowPOModal(false);
          setSelectedSupplier(null);

      } catch (err: any) {
          console.error("Failed to create purchase order:", err);
          setPoError("An unexpected error occurred.");
      } finally {
          setPoLoading(false);
      }
  }}
/>

            {/* Add Product Modal */}
            <AddProductModal
    open={showProductModal}
    onClose={() => setShowProductModal(false)}
    activePO={activePO}
    onProductAdded={() => {
        // Refresh the product list or perform any necessary actions after a product is added
        const fetchProducts = async () => {
            try {
                const res = await fetch(`${API_BASE}/purchase_order_products?filter[purchase_order_id]=${activePO?.purchase_order_id}`);
                const json = await res.json();
                const otherPOProducts = Array.isArray(products) ? products.filter((p) => p.purchase_order_id !== activePO?.purchase_order_id) : [];
                setProducts([...otherPOProducts, ...(json.data || [])]);
            } catch (error) {
                console.error("Failed to refresh products:", error);
            }
        };
        fetchProducts();
    }}
            />

            {/* Receive Stock Modal */}
            {/* Receive Stock Modal — render only when an active PO is selected */}
            {activePO && (
                <ReceiveStockModal
                    open={showReceivingModal}
                    onClose={() => setShowReceivingModal(false)}
                    purchaseOrderId={activePO.purchase_order_id}
                />
            )}

            <Dialog open={showProductDetailsModal} onOpenChange={setShowProductDetailsModal}>
                <DialogContent className="max-w-lg w-full">
                    <DialogTitle>Product Details</DialogTitle>
                    {selectedPOProduct && (
                        <ProductDetailsModalContent
                            key={selectedPOProduct.purchase_order_product_id}
                            product={selectedPOProduct}
                            getBranchName={(id: number, branches: any[]): string => {
    const branch = branches.find((b) => b.id === id);
    return branch ? branch.branch_name : "Unknown Branch";
}}
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
        </div>
    );
}

// Product Details Modal Content Component
function ProductDetailsModalContent({ product, getBranchName, productNameMap, onUpdate, onClose }: {
    product: PurchaseOrderProduct;
    getBranchName: (id: number, branches: any[]) => string;
    productNameMap: Map<number, string>;
    onUpdate: (updatedData: { branch_id: number, ordered_quantity: number }) => void;
    onClose: () => void;
}) {
    const [localBranch, setLocalBranch] = useState<{ id: number | string; name: string } | null>(null);
    const [localQuantity, setLocalQuantity] = useState(product.ordered_quantity);
    const [isDirty, setIsDirty] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [branches, setBranches] = useState<{ id: number; branch_name: string }[]>([]);
    const [productDetails, setProductDetails] = useState<any>(null);

    useEffect(() => {
        // Fetch branch data once when the modal loads
        const fetchBranches = async () => {
            try {
                const response = await fetch("http://100.119.3.44:8090/items/branches");
                if (response.ok) {
                    const data = await response.json();
                    setBranches(data.data || []);
                } else {
                    console.error("Failed to fetch branches.");
                }
            } catch (error) {
                console.error("Error fetching branches:", error);
            }
        };

        fetchBranches();
    }, []);

    useEffect(() => {
        setLocalBranch({ id: product.branch_id, name: getBranchName(product.branch_id, branches) });
        setLocalQuantity(product.ordered_quantity);
        setIsDirty(false);
    }, [product, getBranchName, branches]);

    useEffect(() => {
        const fetchProductDetails = async () => {
            try {
                const response = await axios.get(`http://100.119.3.44:8090/items/products/${product.product_id}`);
                const fetchedProduct = response.data?.data;

                if (fetchedProduct?.product_brand) {
                    const brandResponse = await axios.get(`http://100.119.3.44:8090/items/brand`);
                    const brands = brandResponse.data?.data || [];
                    const brand = brands.find((b: { brand_id: number }) => b.brand_id === fetchedProduct.product_brand);
                    fetchedProduct.product_brand = brand ? brand.brand_name : "Unknown Brand";
                }

                if (fetchedProduct?.product_category) {
                    const categoryResponse = await axios.get(`http://100.119.3.44:8090/items/categories`);
                    const categories = categoryResponse.data?.data || [];
                    const category = categories.find((c: { category_id: number }) => c.category_id === fetchedProduct.product_category);
                    fetchedProduct.product_category = category ? category.category_name : "Unknown Category";
                }

                setProductDetails(fetchedProduct);
            } catch (error) {
                console.error("Error fetching product details, brand, or category details:", error);
            }
        };

        if (product?.product_id) {
            fetchProductDetails();
        }
    }, [product?.product_id]);

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
                {/* --- MODIFICATION START --- */}
                <span className="font-medium text-gray-900 col-span-2 mb-2">
                    {productDetails ? productDetails.product_name : `Loading product...`}
                </span>
                {/* --- MODIFICATION END --- */}

                <strong className="text-gray-500 col-span-2">Branch / Warehouse</strong>
                <div className="col-span-2">
                    <select
                        value={localBranch?.id || ""}
                        onChange={(e) => {
                            const selectedBranch = branches.find(branch => branch.id === Number(e.target.value));
                            if (selectedBranch) {
                                setLocalBranch({ id: selectedBranch.id, name: selectedBranch.branch_name });
                                setIsDirty(true);
                            }
                        }}
                        className="block w-full p-2 border rounded-md bg-gray-50 text-gray-900"
                    >
                        <option value="" disabled>Select a branch</option>
                        {branches.map(branch => (
                            <option key={branch.id} value={branch.id}>{branch.branch_name}</option>
                        ))}
                    </select>
                </div>

                <strong className="text-gray-500 col-span-2">Ordered Quantity</strong>
                <div className="col-span-2">
                    <input
                        type="number"
                        value={localQuantity}
                        onChange={(e) => {
                            setLocalQuantity(Number(e.target.value));
                            setIsDirty(true);
                        }}
                        className="block w-full p-2 border rounded-md bg-gray-50 text-gray-900"
                    />
                </div>
            </div>

            <div className="flex justify-end gap-4">
                <button
                    type="button"
                    className="bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition duration-300"
                    onClick={onClose}
                >
                    Cancel
                </button>
                <button
                    type="button"
                    className={`bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition duration-300 ${isUpdating ? "opacity-75 cursor-not-allowed" : ""}`}
                    onClick={handleUpdate}
                    disabled={!isDirty || isUpdating}
                >
                    {isUpdating ? "Updating..." : "Update"}
                </button>
            </div>

            {productDetails && (
                <div className="mt-4 p-4 border-t">
                    <h4 className="text-lg font-semibold text-gray-800 mb-2">Product Details</h4>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <div><strong>Name:</strong> {productDetails.product_name}</div>
                        <div><strong>Code:</strong> {productDetails.product_code}</div>
                        <div><strong>Barcode:</strong> {productDetails.barcode}</div>
                        <div><strong>Brand:</strong> {productDetails.product_brand}</div>
                        <div><strong>Category:</strong> {productDetails.product_category}</div>
                        <div><strong>Price:</strong> {productDetails.price_per_unit}</div>
                        <div><strong>Maintaining Quantity:</strong> {productDetails.maintaining_quantity}</div>
                        <div><strong>Status:</strong> {productDetails.isActive ? "Active" : "Inactive"}</div>
                        <div><strong>Created At:</strong> {new Date(productDetails.created_at).toLocaleString()}</div>
                    </div>
                </div>
            )}
        </div>
    );
}
