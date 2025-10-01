// src/modules/product-management/components/ProductsView.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import type { DataProvider } from "../providers/DataProvider";
import type { Product } from "../types";
import { StatBar } from "./StatBar";

export function ProductsView({ provider }: { provider: DataProvider }) {
    const [q, setQ] = useState("");
    const [rows, setRows] = useState<Product[]>([]);
    const [total, setTotal] = useState(0);

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

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Products</h2>
                <button
                    className="px-3 py-2 rounded-lg bg-black text-white text-sm"
                    onClick={async () => {
                        const name = prompt("Product name");
                        if (!name) return;
                        await provider.createProduct({ name });
                        const { items, total } = await provider.listProducts({ q, limit: 100 });
                        setRows(items);
                        setTotal(total);
                    }}
                >
                    + Add Product
                </button>
            </div>

            <input
                placeholder="Search products by name, code, barcode, or description…"
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
                        <th className="text-left p-3">Stock</th>
                        <th className="text-left p-3">Base Price</th>
                        <th className="text-left p-3">Cost</th>
                        <th className="text-left p-3">Status</th>
                        <th className="text-left p-3">Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {rows.map((r) => (
                        <tr key={r.id} className="border-t">
                            <td className="p-3">
                                <div className="font-medium">{r.name}</div>
                                <div className="text-gray-500">{r.description}</div>
                                {r.weight_kg != null && (
                                    <div className="text-xs text-gray-400">Weight: {r.weight_kg}kg</div>
                                )}
                            </td>
                            <td className="p-3">
                                <div className="text-gray-800">{r.code ?? "-"}</div>
                                <div className="text-gray-400 text-xs">{r.barcode ?? ""}</div>
                            </td>
                            <td className="p-3">
                  <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs ${
                          (r.stock_qty ?? 0) > 0
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-600"
                      }`}
                  >
                    {(r.stock_qty ?? 0) > 0 ? "In Stock" : "Out"}
                  </span>
                                {r.stock_qty != null && (
                                    <div className="text-xs text-gray-500">{r.stock_qty}</div>
                                )}
                            </td>
                            <td className="p-3">${r.base_price?.toFixed(2) ?? "-"}</td>
                            <td className="p-3">${r.cost?.toFixed(2) ?? "-"}</td>
                            <td className="p-3">
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
                            <td className="p-3">
                                <div className="flex gap-2">
                                    <button
                                        className="text-xs px-2 py-1 rounded border"
                                        onClick={async () => {
                                            const name = prompt("New name", r.name);
                                            if (!name) return;
                                            await provider.updateProduct(r.id, { name });
                                            const { items } = await provider.listProducts({ q, limit: 100 });
                                            setRows(items);
                                        }}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        className="text-xs px-2 py-1 rounded border border-red-300 text-red-600"
                                        onClick={async () => {
                                            if (!confirm("Delete product?")) return;
                                            await provider.deleteProduct(r.id);
                                            const { items, total } = await provider.listProducts({ q, limit: 100 });
                                            setRows(items);
                                            setTotal(total);
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
        </div>
    );
}
