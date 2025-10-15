// src/modules/consumables-management/components/ConsumableModal.tsx
"use client";

import { useEffect, useState } from "react";
import { Consumable } from "../types";
import { ConsumablesDataAdapter } from "../adapter";

interface Props {
    item: Consumable | null;
    provider: ConsumablesDataAdapter;
    onClose: () => void;
}

export function ConsumableModal({ item, provider, onClose }: Props) {
    const [form, setForm] = useState<Partial<Consumable>>(
        item || {
            item_code: "",
            item_name: "",
            unit_of_measure: "",
            unit_cost: "",
            brand: "",
            category_id: 0,
            is_active: true,
        }
    );

    const handleChange = (key: keyof Consumable, value: any) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        if (item) {
            await provider.updateConsumable(item.item_id, form);
        } else {
            await provider.createConsumable(form);
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center">
            <div className="bg-white rounded-lg p-6 w-[500px] space-y-4">
                <h2 className="text-xl font-semibold">
                    {item ? "Edit Consumable" : "Add Consumable"}
                </h2>

                <input
                    placeholder="Code"
                    value={form.item_code || ""}
                    onChange={(e) => handleChange("item_code", e.target.value)}
                    className="border p-2 w-full rounded"
                />
                <input
                    placeholder="Name"
                    value={form.item_name || ""}
                    onChange={(e) => handleChange("item_name", e.target.value)}
                    className="border p-2 w-full rounded"
                />
                <input
                    placeholder="Brand"
                    value={form.brand || ""}
                    onChange={(e) => handleChange("brand", e.target.value)}
                    className="border p-2 w-full rounded"
                />
                <input
                    placeholder="Unit of Measure"
                    value={form.unit_of_measure || ""}
                    onChange={(e) => handleChange("unit_of_measure", e.target.value)}
                    className="border p-2 w-full rounded"
                />
                <input
                    placeholder="Unit Cost"
                    value={form.unit_cost || ""}
                    onChange={(e) => handleChange("unit_cost", e.target.value)}
                    className="border p-2 w-full rounded"
                />

                <div className="flex justify-end space-x-2 pt-4">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-md bg-gray-300 hover:bg-gray-400"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
}
