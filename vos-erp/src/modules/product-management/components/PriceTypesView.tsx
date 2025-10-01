// src/modules/product-management/components/PriceTypesView.tsx
"use client";

import { useEffect, useState } from "react";
import type { DataProvider } from "../providers/DataProvider";
import type { PriceType } from "../types";

export function PriceTypesView({ provider }: { provider: DataProvider }) {
    const [items, setItems] = useState<PriceType[]>([]);

    useEffect(() => {
        provider.listPriceTypes().then(setItems);
    }, [provider]);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Price Types Management</h2>
                <button
                    className="px-3 py-2 rounded-lg bg-black text-white text-sm"
                    onClick={async () => {
                        const name = prompt("New price type name");
                        if (!name) return;
                        await provider.createPriceType(name);
                        setItems(await provider.listPriceTypes());
                    }}
                >
                    + Add Price Type
                </button>
            </div>
            <div className="space-y-2">
                {items.map((pt) => (
                    <div
                        key={pt.id}
                        className="flex items-center justify-between border rounded-lg p-3"
                    >
                        <div className="flex items-center gap-3">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-900 text-white text-xs">
                {pt.sort ?? "•"}
              </span>
                            <div className="font-medium">{pt.name}</div>
                            <div className="text-xs text-gray-400">ID: {String(pt.id)}</div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                className="text-xs px-2 py-1 rounded border"
                                onClick={async () => {
                                    const name = prompt("Rename price type", pt.name);
                                    if (!name) return;
                                    await provider.updatePriceType(pt.id, name);
                                    setItems(await provider.listPriceTypes());
                                }}
                            >
                                Edit
                            </button>
                            <button
                                className="text-xs px-2 py-1 rounded border border-red-300 text-red-600"
                                onClick={async () => {
                                    if (!confirm("Delete price type?")) return;
                                    await provider.deletePriceType(pt.id);
                                    setItems(await provider.listPriceTypes());
                                }}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                ))}
                {items.length === 0 && (
                    <div className="p-6 text-center text-gray-500 border rounded-xl">
                        No price types yet.
                    </div>
                )}
            </div>
        </div>
    );
}
