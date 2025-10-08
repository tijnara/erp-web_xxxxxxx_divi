"use client";

import { useEffect, useState } from "react";
import type { DataProvider } from "../providers/DataProvider";
import type { Supplier } from "../types";
import { SupplierFormDialog } from "./SupplierFormDialog";
import { SupplierDiscountPerProduct } from "./SupplierDiscountPerProduct";
import { SupplierDiscountPerBrand } from "./SupplierDiscountPerBrand";
import { SupplierDiscountPerCategory } from "./SupplierDiscountPerCategory";

type DeliveryTerm = { id: number; delivery_name: string };
type SupplierType = { id: number; transaction_type: string };

export function SuppliersView({ provider }: { provider: DataProvider }) {
    const [q, setQ] = useState("");
    const [rows, setRows] = useState<Supplier[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const limit = 20;

    const [open, setOpen] = useState(false);
    const [mode, setMode] = useState<"create" | "edit">("create");
    const [current, setCurrent] = useState<Supplier | null>(null);
    const [selected, setSelected] = useState<Supplier | null>(null);
    const [deliveryTerms, setDeliveryTerms] = useState<DeliveryTerm[]>([]);
    const [detailsTab, setDetailsTab] = useState<"details" | "discounts" | "brand-discounts" | "category-discounts">("details");

    async function refresh() {
        const offset = (page - 1) * limit;
        const { items, total } = await provider.listSuppliers({ q, limit, offset });
        setRows(items);
        setTotal(total);
    }

    useEffect(() => {
        let alive = true;
        const offset = (page - 1) * limit;
        provider.listSuppliers({ q, limit, offset }).then(({ items, total }) => {
            if (!alive) return;
            setRows(items);
            setTotal(total);
        });
        fetch("http://100.119.3.44:8090/items/delivery_terms")
            .then((res) => res.json())
            .then((data) => {
                if (alive && data.data) {
                    setDeliveryTerms(data.data);
                }
            });
        return () => {
            alive = false;
        };
    }, [q, page, provider, limit]);

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Suppliers</h2>
                <button
                    className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold"
                    onClick={() => {
                        setMode("create");
                        setCurrent(null);
                        setOpen(true);
                    }}
                >
                    + Add Supplier
                </button>
            </div>

            {!selected && (
                <input
                    placeholder="Search by name, shortcut, or contact person..."
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                />
            )}

            {!selected ? (
                <div className="overflow-hidden border border-gray-200 rounded-xl">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-gray-600">
                            <tr>
                                <th className="text-left p-3 font-medium">Supplier Name</th>
                                <th className="text-left p-3 font-medium">Shortcut</th>
                                <th className="text-left p-3 font-medium">Contact Person</th>
                                <th className="text-left p-3 font-medium">Contact Info</th>
                                <th className="text-left p-3 font-medium">Type</th>
                                <th className="text-left p-3 font-medium">Status</th>
                                <th className="text-left p-3 font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((r) => (
                                <tr
                                    key={r.id}
                                    className="border-b border-gray-200 hover:bg-gray-50 cursor-pointer"
                                    onClick={() => setSelected(r)}
                                >
                                    <td className="p-3">{r.supplier_name}</td>
                                    <td className="p-3">{r.supplier_shortcut}</td>
                                    <td className="p-3">{r.contact_person}</td>
                                    <td className="p-3">
                                        <div>{r.phone_number}</div>
                                        <div>{r.email_address}</div>
                                    </td>
                                    <td className="p-3">
                                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                            {r.supplier_type}
                                        </span>
                                    </td>
                                    <td className="p-3">
                                        <span
                                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                                                r.isActive
                                                    ? "bg-green-100 text-green-800"
                                                    : "bg-red-100 text-red-800"
                                            }`}
                                        >
                                            {r.isActive ? "Active" : "Inactive"}
                                        </span>
                                    </td>
                                    <td className="p-3">
                                        <button
                                            className="px-2 py-1 rounded-lg border text-xs"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setMode("edit");
                                                setCurrent(r);
                                                setOpen(true);
                                            }}
                                        >
                                            Edit
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {rows.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-6 text-center text-gray-500">
                                        No suppliers found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                    <div className="flex justify-between items-center p-3 border-t">
                        <div className="text-sm text-gray-500">
                            Page {page} of {Math.ceil(total / limit)} ({total} items)
                        </div>
                        <div className="flex gap-2">
                            <button
                                className="text-sm px-3 py-1 rounded border disabled:opacity-50"
                                disabled={page <= 1}
                                onClick={() => setPage((p) => p - 1)}
                            >
                                Previous
                            </button>
                            <button
                                className="text-sm px-3 py-1 rounded border disabled:opacity-50"
                                disabled={page >= Math.ceil(total / limit)}
                                onClick={() => setPage((p) => p + 1)}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 border-b border-gray-200 rounded-t-xl">
                        <div className="font-medium">Supplier Details</div>
                        <div className="flex gap-2">
                            <button
                                className="text-xs px-2 py-1 rounded border"
                                onClick={() => setSelected(null)}
                            >
                                Back to list
                            </button>
                            <button
                                className="text-xs px-2 py-1 rounded border"
                                onClick={() => {
                                    setMode("edit");
                                    setCurrent(selected);
                                    setOpen(true);
                                }}
                            >
                                Edit
                            </button>
                        </div>
                    </div>
                    <div className="border-b border-gray-200">
                        <div className="flex border-b">
                        <button
                            className={`px-4 py-2 text-sm font-medium ${detailsTab === "details" ? "border-b-2 border-primary text-primary" : "text-gray-500"}`}
                            onClick={() => setDetailsTab("details")}
                        >
                            Supplier Details
                        </button>
                        <button
                            className={`px-4 py-2 text-sm font-medium ${detailsTab === "discounts" ? "border-b-2 border-primary text-primary" : "text-gray-500"}`}
                            onClick={() => setDetailsTab("discounts")}
                        >
                            Supplier Discount per Product
                        </button>
                        <button
                            className={`px-4 py-2 text-sm font-medium ${detailsTab === "brand-discounts" ? "border-b-2 border-primary text-primary" : "text-gray-500"}`}
                            onClick={() => setDetailsTab("brand-discounts")}
                        >
                            Supplier Discount per Brand
                        </button>
                        <button
                            className={`px-4 py-2 text-sm font-medium ${detailsTab === "category-discounts" ? "border-b-2 border-primary text-primary" : "text-gray-500"}`}
                            onClick={() => setDetailsTab("category-discounts")}
                        >
                            Supplier Discount per Category
                        </button>
                        </div>
                    </div>

                    {detailsTab === "details" && (
                        <div className="overflow-hidden border border-t-0 border-gray-200 rounded-b-xl">
                            <table className="w-full text-sm">
                                <tbody>
                                    <tr className="border-t">
                                        <td className="p-3 font-medium text-gray-600">Supplier Name</td>
                                        <td className="p-3">{selected.supplier_name}</td>
                                    </tr>
                                    <tr className="border-t">
                                        <td className="p-3 font-medium text-gray-600">Supplier Shortcut</td>
                                        <td className="p-3">{selected.supplier_shortcut}</td>
                                    </tr>
                                    <tr className="border-t">
                                        <td className="p-3 font-medium text-gray-600">Contact Person</td>
                                        <td className="p-3">{selected.contact_person ?? "-"}</td>
                                    </tr>
                                    <tr className="border-t">
                                        <td className="p-3 font-medium text-gray-600">Email</td>
                                        <td className="p-3">{selected.email_address ?? "-"}</td>
                                    </tr>
                                    <tr className="border-t">
                                        <td className="p-3 font-medium text-gray-600">Phone</td>
                                        <td className="p-3">{selected.phone_number ?? "-"}</td>
                                    </tr>
                                    <tr className="border-t">
                                        <td className="p-3 font-medium text-gray-600">Address</td>
                                        <td className="p-3">{selected.address}</td>
                                    </tr>
                                    <tr className="border-t">
                                        <td className="p-3 font-medium text-gray-600">Supplier Type</td>
                                        <td className="p-3">{selected.supplier_type ?? "-"}</td>
                                    </tr>
                                    <tr className="border-t">
                                        <td className="p-3 font-medium text-gray-600">TIN</td>
                                        <td className="p-3">{selected.tin_number ?? "-"}</td>
                                    </tr>
                                    <tr className="border-t">
                                        <td className="p-3 font-medium text-gray-600">Payment Terms</td>
                                        <td className="p-3">{selected.payment_terms ?? "-"}</td>
                                    </tr>
                                    <tr className="border-t">
                                        <td className="p-3 font-medium text-gray-600">Delivery Terms</td>
                                        <td className="p-3">
                                            {deliveryTerms.find((d) => d.id === selected.delivery_terms)?.delivery_name ??
                                                selected.delivery_terms ?? "-"}
                                        </td>
                                    </tr>
                                    <tr className="border-t">
                                        <td className="p-3 font-medium text-gray-600">Date Added</td>
                                        <td className="p-3">{selected.date_added}</td>
                                    </tr>
                                    <tr className="border-t">
                                        <td className="p-3 font-medium text-gray-600">Is Active</td>
                                        <td className="p-3">{selected.isActive ? "Yes" : "No"}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    )}
                    {detailsTab === "discounts" && (
                        <div className="p-4 border border-t-0 border-gray-200 rounded-b-xl">
                            <SupplierDiscountPerProduct supplier={selected} provider={provider as any} />
                        </div>
                    )}
                    {detailsTab === "brand-discounts" && (
                        <div className="p-4 border border-t-0 border-gray-200 rounded-b-xl">
                            <SupplierDiscountPerBrand supplier={selected} provider={provider as any} />
                        </div>
                    )}
                    {detailsTab === "category-discounts" && (
                        <div className="p-4 border border-t-0 border-gray-200 rounded-b-xl">
                            <SupplierDiscountPerCategory supplier={selected} provider={provider as any} />
                        </div>
                    )}
                </div>
            )}

            <SupplierFormDialog
                open={open}
                mode={mode}
                initial={current ?? undefined}
                onClose={() => setOpen(false)}
                onSubmit={async (dto) => {
                    if (mode === "create") {
                        await provider.createSupplier(dto);
                    } else if (current) {
                        await provider.updateSupplier(current.id, dto);
                    }
                    await refresh();
                    if (selected) {
                        try {
                            const latest = await provider.getSupplier(selected.id);
                            setSelected(latest);
                        } catch (e) {
                            // ignore if fetch fails
                        }
                    }
                }}
            />
        </div>
    );
}
