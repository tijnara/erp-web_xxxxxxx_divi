// src/modules/product-management/components/PriceTypesView.tsx
"use client";

import { useEffect, useState } from "react";
import type { DataProvider } from "../providers/DataProvider";
import type { PriceType } from "../types";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/button";

export function PriceTypesView({ provider }: { provider: DataProvider }) {
    const [items, setItems] = useState<PriceType[]>([]);
    const [editingItem, setEditingItem] = useState<PriceType | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        provider.listPriceTypes().then(setItems);
    }, [provider]);

    const handleCreate = async (name: string) => {
        if (!name) return;
        await provider.createPriceType(name);
        setItems(await provider.listPriceTypes());
        setIsCreating(false);
    };

    const handleUpdate = async (id: number | string, name: string) => {
        if (!name) return;
        await provider.updatePriceType(id, name);
        setItems(await provider.listPriceTypes());
        setEditingItem(null);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Price Types Management</h2>
                <Button onClick={() => setIsCreating(true)}>+ Add Price Type</Button>
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
                            <Button variant="outline" size="sm" onClick={() => setEditingItem(pt)}>
                                Edit
                            </Button>
                        </div>
                    </div>
                ))}
                {items.length === 0 && (
                    <div className="p-6 text-center text-gray-500 border rounded-xl">
                        No price types yet.
                    </div>
                )}
            </div>

            <Modal open={isCreating} onClose={() => setIsCreating(false)} title="Add Price Type">
                <PriceTypeForm
                    onSave={handleCreate}
                    onCancel={() => setIsCreating(false)}
                />
            </Modal>

            <Modal open={!!editingItem} onClose={() => setEditingItem(null)} title="Edit Price Type">
                {editingItem && (
                    <PriceTypeForm
                        item={editingItem}
                        onSave={(name) => handleUpdate(editingItem.id, name)}
                        onCancel={() => setEditingItem(null)}
                    />
                )}
            </Modal>
        </div>
    );
}

function PriceTypeForm({
    item,
    onSave,
    onCancel,
}: {
    item?: PriceType;
    onSave: (name: string) => void;
    onCancel: () => void;
}) {
    const [name, setName] = useState(item?.name || "");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(name);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="price-type-name" className="block text-sm font-medium text-gray-700">
                    Name
                </label>
                <input
                    type="text"
                    id="price-type-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
            </div>
            <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                </Button>
                <Button type="submit">Save</Button>
            </div>
        </form>
    );
}
