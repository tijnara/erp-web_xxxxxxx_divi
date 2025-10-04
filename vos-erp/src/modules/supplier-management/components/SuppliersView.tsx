"use client";

import { useEffect, useMemo, useState } from "react";
import type { DataProvider } from "../providers/DataProvider";
import type { Supplier } from "../types";
import { SupplierFormDialog } from "./SupplierFormDialog";

type DeliveryTerm = { id: number; delivery_name: string };

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

    const totalPages = useMemo(() => Math.ceil(total / limit), [total, limit]);

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
    }, [q, page, provider]);

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Suppliers</h2>
                <button
                    className="px-3 py-2 rounded-lg bg-black text-white text-sm"
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
                    placeholder="Search by name or shortcut..."
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
                                <th className="text-left p-3">Name</th>
                                <th className="text-left p-3">Shortcut</th>
                                <th className="text-left p-3">Contact Person</th>
                                <th className="text-left p-3">Type</th>
                                <th className="text-left p-3">Active</th>
                                <th className="text-left p-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((r) => (
                                <tr
                                    key={r.id}
                                    className="border-t hover:bg-gray-50 cursor-pointer"
                                    onClick={() => setSelected(r)}
                                >
                                    <td className="p-3">{r.supplier_name}</td>
                                    <td className="p-3">{r.supplier_shortcut}</td>
                                    <td className="p-3">{r.contact_person ?? "-"}</td>
                                    <td className="p-3">{r.supplier_type}</td>
                                    <td className="p-3">
                                        <span
                                            className={`text-xs px-2 py-1 rounded-full ${
                                                r.isActive
                                                    ? "bg-blue-600 text-white"
                                                    : "bg-gray-200 text-gray-700"
                                            }`}
                                        >
                                            {r.isActive ? "Yes" : "No"}
                                        </span>
                                    </td>
                                    <td className="p-3">
                                        <div className="flex gap-2">
                                            <button
                                                className="text-xs px-2 py-1 rounded border"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setMode("edit");
                                                    setCurrent(r);
                                                    setOpen(true);
                                                }}
                                            >
                                                Edit
                                            </button>
                                        </div>
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
                            Page {page} of {totalPages} ({total} items)
                        </div>
                        <div className="flex gap-2">
                            <button
                                className="text-sm px-3 py-1 rounded border disabled:opacity-50"
                                disabled={page <= 1}
                                onClick={() => setPage(p => p - 1)}
                            >
                                Previous
                            </button>
                            <button
                                className="text-sm px-3 py-1 rounded border disabled:opacity-50"
                                disabled={page >= totalPages}
                                onClick={() => setPage(p => p + 1)}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="overflow-hidden border border-gray-200 rounded-xl">
                    <div className="flex items-center justify-between p-3 bg-gray-50 border-b">
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
                    <table className="w-full text-sm">
                        <tbody>
                            <tr className="border-t"><td className="p-3 font-medium text-gray-600">Supplier Name</td><td className="p-3">{selected.supplier_name}</td></tr>
                            <tr className="border-t"><td className="p-3 font-medium text-gray-600">Supplier Shortcut</td><td className="p-3">{selected.supplier_shortcut}</td></tr>
                            <tr className="border-t"><td className="p-3 font-medium text-gray-600">Contact Person</td><td className="p-3">{selected.contact_person ?? "-"}</td></tr>
                            <tr className="border-t"><td className="p-3 font-medium text-gray-600">Email</td><td className="p-3">{selected.email_address ?? "-"}</td></tr>
                            <tr className="border-t"><td className="p-3 font-medium text-gray-600">Phone</td><td className="p-3">{selected.phone_number ?? "-"}</td></tr>
                            <tr className="border-t"><td className="p-3 font-medium text-gray-600">Address</td><td className="p-3">{selected.address}</td></tr>
                            <tr className="border-t"><td className="p-3 font-medium text-gray-600">TIN</td><td className="p-3">{selected.tin_number ?? "-"}</td></tr>
                            <tr className="border-t"><td className="p-3 font-medium text-gray-600">Payment Terms</td><td className="p-3">{selected.payment_terms ?? "-"}</td></tr>
                            <tr className="border-t"><td className="p-3 font-medium text-gray-600">Delivery Terms</td><td className="p-3">{deliveryTerms.find(d => d.id === selected.delivery_terms)?.delivery_name ?? selected.delivery_terms ?? "-"}</td></tr>
                            <tr className="border-t"><td className="p-3 font-medium text-gray-600">Date Added</td><td className="p-3">{selected.date_added}</td></tr>
                            <tr className="border-t"><td className="p-3 font-medium text-gray-600">Is Active</td><td className="p-3">{selected.isActive ? "Yes" : "No"}</td></tr>
                        </tbody>
                    </table>
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
