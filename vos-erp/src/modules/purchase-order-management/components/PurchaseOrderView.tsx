"use client";

import React, { useEffect, useState } from "react";
import { AsyncSelect } from "@/components/ui/AsyncSelect";
import { useSession } from "@/hooks/use-session";

const API_BASE = "http://100.119.3.44:8090/items";

const INVENTORY_STATUS: { [key: number]: string } = { 0: "Pending", 1: "Partial", 2: "Received" };
const INVENTORY_STATUS_COLOR: { [key: number]: string } = { 0: "status-pending", 1: "status-partial", 2: "status-received" };
const PAYMENT_STATUS: { [key: number]: string } = { 1: "Unpaid", 2: "Paid" };
const PAYMENT_STATUS_COLOR: { [key: number]: string } = { 1: "status-unpaid", 2: "status-paid" };

// Type definitions
interface Supplier {
  supplier_id: number;
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
  branch_id: number;
  ordered_quantity: number;
  unit_price: string;
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

export function PurchaseOrderView() {
  // default date for date inputs (YYYY-MM-DD)
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
  // store supplier selected from AsyncSelect (AsyncSelect is not a native <select> so it won't be in form.elements)
  const [selectedSupplier, setSelectedSupplier] = useState<{ id: number | string; name: string } | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<{ id: number | string; name: string; meta?: { price?: number } } | null>(null);
  const [productError, setProductError] = useState<string>("");
  const [productLoading, setProductLoading] = useState<boolean>(false);
  const [unitPrice, setUnitPrice] = useState<string>("");
  const [visiblePOCount, setVisiblePOCount] = useState(10);
  // call useSession to trigger session fetch; we don't need the value here yet
  useSession();

  // Fetch data
  useEffect(() => {
    fetch(`${API_BASE}/purchase_order`).then(res => res.json()).then(data => {
      setPurchaseOrders(data.data || []);
    });
    fetch(`${API_BASE}/purchase_order_products`).then(res => res.json()).then(data => {
      setProducts(data.data || []);
    });
    fetch(`${API_BASE}/purchase_order_receiving`).then(res => res.json()).then(data => {
      setReceiving(data.data || []);
    });
    fetch(`${API_BASE}/suppliers`).then(res => res.json()).then(data => {
      setSuppliers(data.data || []);
    });
    fetch(`${API_BASE}/receiving_type`).then(res => res.json()).then(data => {
      setReceivingTypes(data.data || []);
    });
    // fetch price types for the Price Type dropdown (use async/await and robust mapping)
    // price types will be fetched when the Create PO modal opens to ensure latest full list
  }, []);

  // Fetch price types when Create PO modal opens (so select displays all entries)
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

  useEffect(() => {
    if (showPOModal) {
      // Find the highest PO number and increment
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
    // clear supplier selection when modal is closed
    if (!showPOModal) setSelectedSupplier(null);
    // also clear product selection/unit price when Create PO modal closes
    if (!showPOModal) {
      setSelectedProduct(null);
      setUnitPrice("");
    }
  }, [showPOModal, purchaseOrders]);
  // sync unitPrice when selectedProduct changes
  useEffect(() => {
    if (selectedProduct && selectedProduct.meta?.price != null) {
      setUnitPrice(String(selectedProduct.meta.price));
    }
  }, [selectedProduct]);

  // Filtered PO list
  const filteredPOs = purchaseOrders.filter(po => {
    return po.purchase_order_no.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // PO details
  const activePO = purchaseOrders.find(po => po.purchase_order_id === activePOId);
  const productsForPO = products.filter(p => p.purchase_order_id === activePOId);
  const receivingForPO = receiving.filter(r => r.purchase_order_id === activePOId);

  // Helper to get supplier name
  const getSupplierName = (id: number) => {
    const s = suppliers.find(s => s.supplier_id === id);
    return s ? s.supplier_name : id;
  };

  // Handlers
  const handlePOClick = (poId: number) => {
    setActivePOId(poId);
    setTab("products");
    setShowPOModal(false);
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
                          <th className="px-6 py-3 text-right">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {productsForPO.length > 0 ? productsForPO.map(p => (
                          <tr key={p.purchase_order_product_id} className="bg-white border-b hover:bg-gray-50">
                            <td className="px-6 py-4 font-mono text-xs">{p.product_id}</td>
                            <td className="px-6 py-4 font-medium text-gray-900">Product {p.product_id}</td>
                            <td className="px-6 py-4">Branch {p.branch_id}</td>
                            <td className="px-6 py-4 text-right">{p.ordered_quantity}</td>
                            <td className="px-6 py-4 text-right">₱{parseFloat(p.unit_price).toFixed(2)}</td>
                            <td className="px-6 py-4 text-right font-semibold">₱{(p.ordered_quantity * parseFloat(p.unit_price)).toFixed(2)}</td>
                          </tr>
                        )) : (
                          <tr><td colSpan={6} className="text-center py-8 text-gray-500">No products have been added to this order.</td></tr>
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
                            <td className="px-6 py-4">Product {r.product_id}</td>
                            <td className="px-6 py-4">Branch {r.branch_id}</td>
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
      {showPOModal && (
        <div className="modal-backdrop" style={{ display: "flex" }}>
          <div className="modal bg-white w-11/12 md:max-w-2xl mx-auto rounded-lg shadow-xl">
            <form
               className="p-6"
               onSubmit={async e => {
                 e.preventDefault();
                 setPoError("");
                 setPoLoading(true);
                 const form = e.target as HTMLFormElement;
                 const po_no = nextPONumber;
                 // supplier is selected via AsyncSelect (not a native select in the form), use stored selection
                 const supplier_id_val = selectedSupplier ? String(selectedSupplier.id) : "";
                 if (!supplier_id_val || isNaN(Number(supplier_id_val))) {
                   setPoError("Please select a valid supplier.");
                   setPoLoading(false);
                   return;
                 }
                 const receiving_type = (form.receiving_type as HTMLSelectElement).value;
                 const payment_type = (form.payment_type as HTMLSelectElement).value;
                 const price_type = (form.price_type as HTMLSelectElement).value;
                 const date_encoded = (form.date_encoded as HTMLInputElement).value;
                 const date = (form.date as HTMLInputElement).value;
                 const reference = (form.reference as HTMLInputElement).value;
                 const remark = (form.remark as HTMLTextAreaElement).value;
                // compute current time and datetime at the moment of submit (local time)
                const now = new Date();
                const pad = (n: number) => String(n).padStart(2, "0");
                const timeNow = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`; // HH:MM:SS
                const datetimeLocal = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
                 try {
                  const payload = {
                    purchase_order_no: po_no,
                    supplier_id: Number(supplier_id_val),
                    receiving_type,
                    payment_type,
                    price_type,
                    date_encoded,
                    // include time and datetime required by API
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
                    setPoError(errorText || `HTTP ${res.status}`);
                    setPoLoading(false);
                    return;
                  }
                  // Refresh PO list
                  try {
                    const listRes = await fetch(`${API_BASE}/purchase_order`);
                    const listJson = await listRes.json();
                    setPurchaseOrders(listJson.data || []);
                  } catch {
                    // ignore refresh errors
                  }
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
                  <label htmlFor="supplier_id" className="block text-sm font-medium text-gray-700">Supplier</label>
                  <AsyncSelect
                    label="Supplier"
                    placeholder="Enter Supplier..."
                    fetchUrl="http://100.119.3.44:8090/items/suppliers"
                    initial={selectedSupplier ? { id: selectedSupplier.id, name: selectedSupplier.name } : null}
                    onChange={(opt) => setSelectedSupplier(opt as { id: number | string; name: string } | null)}
                    disabled={false}
                    mapOption={(item: unknown) => {
                      const it = item as Record<string, unknown>;
                      return { id: (it.supplier_id as number) ?? Number(it.id ?? 0), name: String(it.supplier_name ?? it.name ?? it.supplier_name) };
                    }}
                  />
                  {/* hidden field so libraries expecting form fields can access supplier_id */}
                  <input type="hidden" name="supplier_id" value={selectedSupplier ? String(selectedSupplier.id) : ""} />
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
                      defaultValue=""
                      className="block w-full p-2 border rounded-md bg-gray-50 text-gray-900"
                    >
                      <option value="" disabled>Select receiving type</option>
                      {receivingTypes.map(type => (
                        <option key={type.id} value={type.id}>{type.description}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label htmlFor="payment_type" className="block text-sm font-medium text-gray-700">Payment Type</label>
                  <div className="mt-1">
                    <select
                      name="payment_type"
                      id="payment_type"
                      defaultValue=""
                      className="block w-full p-2 border rounded-md bg-gray-50 text-gray-900"
                    >
                      <option value="" disabled>Select payment type</option>
                      <option value="1">Cash</option>
                      <option value="2">Credit</option>
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
                            <option key={type.id} value={type.id}>{type.name}</option>
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

              <div className="grid grid-cols-1 gap-4">
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

              {/* Error message */}
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
          </div>
        </div>
      )}
      {/* Add Product Modal */}
      {showProductModal && (
        <div className="modal-backdrop" style={{ display: "flex" }}>
          <div className="modal bg-white w-11/12 md:max-w-lg mx-auto rounded-lg shadow-xl p-6">
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
                const form = e.target as HTMLFormElement;
                const branch_id = (form.branch_id as HTMLInputElement).value;
                const ordered_quantity = (form.ordered_quantity as HTMLInputElement).value;
                const unit_price_input = (form.unit_price as HTMLInputElement).value;
                const product_id_val = selectedProduct ? String(selectedProduct.id) : "";
                if (!product_id_val) {
                  setProductError("Please select a product.");
                  setProductLoading(false);
                  return;
                }
                try {
                  const res = await fetch(`${API_BASE}/purchase_order_products`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      purchase_order_id: activePOId,
                      product_id: parseInt(product_id_val),
                      branch_id: branch_id ? parseInt(branch_id) : null,
                      ordered_quantity: ordered_quantity ? parseInt(ordered_quantity) : 0,
                      unit_price: unit_price_input || (selectedProduct?.meta?.price ?? null)
                    })
                  });
                  if (!res.ok) {
                    const text = await res.text();
                    setProductError(text || `HTTP ${res.status}`);
                    setProductLoading(false);
                    return;
                  }
                  // Refresh products list for the PO
                  try {
                    const listRes = await fetch(`${API_BASE}/purchase_order_products`);
                    const listJson = await listRes.json();
                    setProducts(listJson.data || []);
                  } catch {
                    // ignore
                  }
                  setShowProductModal(false);
                } catch (err: any) {
                  setProductError(err?.message || "Failed to add product.");
                } finally {
                  setProductLoading(false);
                }
              }}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">Add Product to PO</h2>
                <button type="button" className="modal-close-btn text-gray-500 hover:text-gray-800 text-3xl" onClick={() => setShowProductModal(false)}>&times;</button>
              </div>

              <div className="space-y-4">
                <AsyncSelect
                  label="Product"
                  placeholder="Search products..."
                  fetchUrl="http://100.119.3.44:8090/items/products"
                  initial={selectedProduct ? { id: selectedProduct.id, name: selectedProduct.name, meta: selectedProduct.meta } : null}
                  onChange={(opt) => {
                    // map in price to meta for easier access
                    if (opt) {
                      const it = opt as any;
                      setSelectedProduct({ id: it.id, name: it.name, meta: { price: (it.meta && it.meta.price) ?? undefined } });
                      // unitPrice will be synced by effect
                    } else setSelectedProduct(null);
                  }}
                  disabled={false}
                  mapOption={(item: any) => ({ id: item.product_id ?? item.id, name: String(item.product_name ?? item.short_description ?? item.product_code ?? item.name), meta: { price: item.price_per_unit ?? item.cost_per_unit ?? null } })}
                />

                <input type="number" name="branch_id" placeholder="Branch ID" className="p-2 border rounded w-full" />
                <input type="number" name="ordered_quantity" placeholder="Quantity" defaultValue={1} className="p-2 border rounded w-full" />
                <input type="number" step="0.01" name="unit_price" placeholder="Unit Price" value={unitPrice} onChange={e => setUnitPrice(e.target.value)} className="p-2 border rounded w-full" />

                {productError && <div className="text-red-600">{productError}</div>}
                <div className="flex justify-end gap-2">
                  <button type="button" className="bg-gray-200 text-gray-800 py-2 px-4 rounded" onClick={() => { setShowProductModal(false); setSelectedProduct(null); setUnitPrice(""); }}>Cancel</button>
                  <button type="submit" disabled={productLoading} className={`bg-indigo-600 text-white py-2 px-4 rounded ${productLoading ? "opacity-75" : "hover:bg-indigo-700"}`}>
                    {productLoading ? "Adding..." : "Add Product"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Receive Stock Modal */}
      {showReceivingModal && (
        <div className="modal-backdrop" style={{ display: "flex" }}>
          <div className="modal bg-white w-11/12 md:max-w-lg mx-auto rounded-lg shadow-xl p-6">
            <form
              onSubmit={async e => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const product_id = (form.product_id as HTMLInputElement).value;
                const branch_id = (form.branch_id as HTMLInputElement).value;
                const received_quantity = (form.received_quantity as HTMLInputElement).value;
                const receipt_no = (form.receipt_no as HTMLInputElement).value;
                const receipt_date = (form.receipt_date as HTMLInputElement).value;
                const serial_no = (form.serial_no as HTMLTextAreaElement).value;
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
                  // Refresh receiving data
                  try {
                    const res = await fetch(`${API_BASE}/purchase_order_receiving`);
                    const json = await res.json();
                    setReceiving(json.data || []);
                  } catch {}
                  setShowReceivingModal(false);
                } catch (err) {
                  // ignore for now or show error UI if desired
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
      )}
    </div>
  );
}

