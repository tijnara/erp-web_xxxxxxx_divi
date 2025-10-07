// src/modules/product-management/components/ProductsView.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import type { DataProvider } from "../providers/DataProvider";
import type { Product } from "../types";
import { StatBar } from "./StatBar";
import { ProductModal } from "./ProductModal";
import { ProductView } from "./ProductView";

const PAGE_SIZE = 20;

export function ProductsView({ provider }: { provider: DataProvider }) {
    const [q, setQ] = useState("");
    const [rows, setRows] = useState<Product[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);

    // modal state
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<Product | null>(null);
    const [viewingId, setViewingId] = useState<number | null>(null);

    useEffect(() => {
        let alive = true;
        const offset = (page - 1) * PAGE_SIZE;
        provider.listProducts({ q, limit: PAGE_SIZE, offset }).then(({ items, total }) => {
            if (!alive) return;
            setRows(items);
            setTotal(total);
        });
        return () => {
            alive = false;
        };
    }, [q, page, provider]);

    const stats = useMemo(() => {
        const active = rows.filter((r) => r.isActive !== false).length;
        const low = rows.filter((r) => (r.stock_qty ?? 0) > 0 && (r.stock_qty ?? 0) < 10).length;
        const oos = rows.filter((r) => (r.stock_qty ?? 0) <= 0).length;
        return { total, active, low, oos };
    }, [rows, total]);

    async function refresh() {
        const offset = (page - 1) * PAGE_SIZE;
        const { items, total } = await provider.listProducts({ q, limit: PAGE_SIZE, offset });
        setRows(items);
        setTotal(total);
    }

    const pageCount = useMemo(() => {
        return Math.ceil(total / PAGE_SIZE);
    }, [total]);

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Products</h2>
                <button
                    className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold"
                    onClick={() => {
                        setEditing(null); // add mode
                        setOpen(true);
                    }}
                >
                    + Add Product
                </button>
            </div>

            <input
                placeholder="Search by product, code, barcode, brand, category, segment, or section…"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                value={q}
                onChange={(e) => setQ(e.target.value)}
            />

            <div className="overflow-hidden border border-gray-200 rounded-xl">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-600">
                        <tr>
                            <th className="text-left p-3 font-medium">Product Name</th>
                            <th className="text-left p-3 font-medium">Product Code</th>
                            <th className="text-left p-3 font-medium">Brand</th>
                            <th className="text-left p-3 font-medium">Product Category</th>
                            <th className="text-left p-3 font-medium">Status</th>
                            <th className="text-left p-3 font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((r) => (
                            <tr
                                key={r.id}
                                className="border-b border-gray-200 hover:bg-gray-50 cursor-pointer"
                                onClick={() => setViewingId(r.id)}
                            >
                                <td className="p-3">
                                    <span className="text-blue-600 hover:underline">{r.name}</span>
                                </td>
                                <td className="p-3">{r.code}</td>
                                <td className="p-3">
                                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                        {r.brand?.name}
                                    </span>
                                </td>
                                <td className="p-3">{r.category?.name}</td>
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
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setEditing(r);
                                                setOpen(true);
                                            }}
                                        >
                                            Edit
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="flex justify-between items-center mt-4">
                <div>
                    <p className="text-sm text-muted-foreground">
                        Showing {rows.length} of {total} items
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-3 py-1 rounded-lg border text-sm font-semibold disabled:opacity-50"
                    >
                        Previous
                    </button>
                    <div className="flex items-center gap-2">
                        <span className="text-sm">
                            Page {page} of {pageCount}
                        </span>
                    </div>
                    <button
                        onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                        disabled={page === pageCount}
                        className="px-3 py-1 rounded-lg border text-sm font-semibold disabled:opacity-50"
                    >
                        Next
                    </button>
                </div>
            </div>

            <StatBar stats={stats} />

            <ProductModal
                open={open}
                onClose={() => setOpen(false)}
                provider={provider}
                product={editing}
                onSaved={async () => {
                    await refresh();
                }}
            />
            <ProductView
                provider={provider}
                productId={viewingId}
                open={viewingId !== null}
                onClose={() => setViewingId(null)}
            />
        </div>
    );
}
