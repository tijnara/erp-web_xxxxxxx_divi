// src/modules/product-management/components/ProductsView.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import type { DataProvider } from "../providers/DataProvider";
import type { Product } from "../types";
import { StatBar } from "./StatBar";
import { ProductModal } from "./ProductModal";

function fmtDate(iso?: string | null) {
    if (!iso) return null;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleString();
}

export function ProductsView({ provider }: { provider: DataProvider }) {
    const [q, setQ] = useState("");
    const [rows, setRows] = useState<Product[]>([]);
    const [total, setTotal] = useState(0);

    // modal state
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<Product | null>(null);

    useEffect(() => {
        let alive = true;
        provider.listProducts({ q, limit: 100 }).then(({ items, total }) => {
            if (!alive) return;
            setRows(items);
            setTotal(total);
        });
        return () => {
            alive = false;
        };
    }, [q, provider]);

    const stats = useMemo(() => {
        const active = rows.filter((r) => r.isActive !== false).length;
        const low = rows.filter((r) => (r.stock_qty ?? 0) > 0 && (r.stock_qty ?? 0) < 10).length;
        const oos = rows.filter((r) => (r.stock_qty ?? 0) <= 0).length;
        return { total, active, low, oos };
    }, [rows, total]);

    async function refresh() {
        const { items, total } = await provider.listProducts({ q, limit: 100 });
        setRows(items);
        setTotal(total);
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Products</h2>
                <button
                    className="px-3 py-2 rounded-lg bg-black text-white text-sm"
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
                        <th className="text-left p-3">Product</th>
                        <th className="text-left p-3">Code/Barcode</th>
                        <th className="text-left p-3">Unit</th>
                        <th className="text-left p-3">Brand / Category</th>
                        <th className="text-left p-3">Segment / Section</th>
                        <th className="text-left p-3">Status</th>
                        <th className="text-left p-3">Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {rows.map((r) => (
                        <tr key={r.id} className="border-t">
                            <td className="p-3 align-top">
                                <div className="font-medium">{r.name}</div>
                                {r.description && <div className="text-gray-500">{r.description}</div>}
                                {"last_updated" in (r as any) && (r as any).last_updated && (
                                    <div className="text-xs text-gray-400">
                                        Updated: {fmtDate((r as any).last_updated)}
                                    </div>
                                )}
                                {r.weight_kg != null && (
                                    <div className="text-xs text-gray-400">Weight: {r.weight_kg}kg</div>
                                )}
                            </td>

                            <td className="p-3 align-top">
                                <div className="text-gray-800">{r.code ?? "-"}</div>
                                <div className="text-gray-400 text-xs">{r.barcode ?? ""}</div>
                            </td>

                            <td className="p-3 align-top">
                                {r.unit ? (
                                    <>
                                        <div>{r.unit.name}</div>
                                        {r.unit.shortcut && (
                                            <div className="text-xs text-gray-500">{r.unit.shortcut}</div>
                                        )}
                                    </>
                                ) : (
                                    <span className="text-gray-400">—</span>
                                )}
                            </td>

                            <td className="p-3 align-top">
                                <div>{r.brand?.name ?? <span className="text-gray-400">—</span>}</div>
                                <div className="text-xs text-gray-500">{r.category?.name ?? ""}</div>
                            </td>

                            <td className="p-3 align-top">
                                <div>{r.segment?.name ?? <span className="text-gray-400">—</span>}</div>
                                <div className="text-xs text-gray-500">{r.section?.name ?? ""}</div>
                            </td>

                            {/* Stock column removed */}

                            <td className="p-3 align-top">
                  <span
                      className={`text-xs px-2 py-1 rounded-full ${
                          r.isActive !== false
                              ? "bg-blue-600 text-white"
                              : "bg-gray-200 text-gray-700"
                      }`}
                  >
                    {r.isActive !== false ? "Active" : "Inactive"}
                  </span>
                            </td>

                            <td className="p-3 align-top">
                                <div className="flex gap-2">
                                    <button
                                        className="text-xs px-2 py-1 rounded border"
                                        onClick={() => {
                                            setEditing(r); // edit mode
                                            setOpen(true);
                                        }}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        className="text-xs px-2 py-1 rounded border border-red-300 text-red-600"
                                        onClick={async () => {
                                            if (!confirm("Delete product?")) return;
                                            await provider.deleteProduct(r.id);
                                            await refresh();
                                        }}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}

                    {rows.length === 0 && (
                        <tr>
                            <td colSpan={7} className="p-6 text-center text-gray-500">
                                No products found.
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>

            <StatBar stats={stats} />

            {/* Add/Edit Modal */}
            <ProductModal
                open={open}
                onClose={() => setOpen(false)}
                provider={provider}
                product={editing}
                onSaved={async () => {
                    await refresh();
                }}
            />
        </div>
    );
}
