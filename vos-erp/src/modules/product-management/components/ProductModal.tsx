// src/modules/product-management/components/ProductModal.tsx
"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { AsyncSelect } from "@/components/ui/AsyncSelect";
import type { DataProvider } from "../providers/DataProvider";
import type { Product, UpsertProductDTO } from "../types";
import { BrandDropdown } from "./BrandDropdown";
import { CategoryDropdown } from "./CategoryDropdown";
import { useSession } from "@/hooks/use-session";

export function ProductModal({
                                 open,
                                 onClose,
                                 provider,
                                 product,    // if present → Edit; otherwise → Add
                                 onSaved,    // callback to refresh list
                             }: {
    open: boolean;
    onClose: () => void;
    provider: DataProvider;
    product?: Product | null;
    onSaved?: (saved: Product) => void;
}) {
    const { session } = useSession();
    const isEdit = !!product;

    const [name, setName] = useState("");
    const [code, setCode] = useState<string | null>(null);
    const [barcode, setBarcode] = useState<string | null>(null);
    const [description, setDescription] = useState<string | null>(null);
    const [weightKg, setWeightKg] = useState<number | null>(null);
    const [maintainingQuantity, setMaintainingQuantity] = useState<number | null>(null);
    const [basePrice, setBasePrice] = useState<number | null>(null);
    const [isActive, setIsActive] = useState(true);

    // selected relations (kept as id+name so UI shows text)
    const [unit, setUnit]         = useState<{ id: string | number; name: string } | null>(null);
    const [brand, setBrand]       = useState<{ id: string | number; name: string } | null>(null);
    const [category, setCategory] = useState<{ id: string | number; name: string } | null>(null);

    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    const [unitOptions, setUnitOptions] = useState<{ id: number; name: string }[]>([]);

    useEffect(() => {
        if (!open) return;

        // Fetch unit options when the modal opens
        fetch("http://100.119.3.44:8090/items/units?fields=unit_id,unit_name")
            .then((response) => response.json())
            .then((data) => {
                const options = (data.data || []).map((unit: any) => ({
                    id: unit.unit_id,
                    name: unit.unit_name,
                }));
                setUnitOptions(options);
            })
            .catch((error) => {
                console.error("Failed to fetch unit options:", error);
            });
    }, [open]);

    useEffect(() => {
        if (!open) return;
        // seed state for edit
        setName(product?.name || "");
        setCode(product?.code ?? null);
        setBarcode(product?.barcode ?? null);
        setDescription(product?.description ?? null);
        setWeightKg(product?.weight_kg ?? null);
        setMaintainingQuantity(product?.maintaining_quantity ?? null);
        setIsActive(product?.isActive !== false);
        setBasePrice(product?.base_price ?? null);

        setUnit(product?.unit ? { id: product.unit.id, name: product.unit.name } : null);
        setBrand(product?.brand ? { id: product.brand.id, name: product.brand.name } : null);
        setCategory(product?.category ? { id: product.category.id, name: product.category.name } : null);

        setErr(null);
    }, [open, product]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!name.trim()) {
            setErr("Name is required.");
            return;
        }
        setSaving(true);
        setErr(null);

        const payload: UpsertProductDTO = {
            name: name.trim(),
            code: (code ?? "") || null,
            barcode: (barcode ?? "") || null,
            description: (description ?? "") || null,
            weight_kg: weightKg ?? null,
            maintaining_quantity: maintainingQuantity,
            base_price: basePrice,
            isActive,
            created_at: new Date().toISOString(),
            created_by: session?.user?.id ? Number(session.user.id) : undefined,

            // relation ids (optional)
            unitId: unit?.id ?? null,
            brandId: brand?.id ?? null,
            categoryId: category?.id ?? null,
        };

        try {
            let saved: Product;
            if (isEdit && product) {
                saved = await provider.updateProduct(product.id, payload);
            } else {
                saved = await provider.createProduct(payload);
            }
            onSaved?.(saved);
            onClose();
        } catch (e: any) {
            setErr(e?.message || "Save failed");
        } finally {
            setSaving(false);
        }
    }

    return (
        <Modal
            open={open}
            onClose={() => !saving && onClose()}
            title={isEdit ? "Edit Product" : "Add Product"}
            width="max-w-2xl"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm">Name *</label>
                        <input
                            className="mt-1 w-full rounded-md border px-3 py-2 bg-white dark:bg-zinc-900"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Product name"
                            required
                        />
                    </div>

                    <div>
                        <label className="text-sm">Code</label>
                        <input
                            className="mt-1 w-full rounded-md border px-3 py-2 bg-white dark:bg-zinc-900"
                            value={code ?? ""}
                            onChange={(e) => setCode(e.target.value || null)}
                            placeholder="e.g. CB-DLX-150G"
                        />
                    </div>

                    <div>
                        <label className="text-sm">Barcode</label>
                        <input
                            className="mt-1 w-full rounded-md border px-3 py-2 bg-white dark:bg-zinc-900"
                            value={barcode ?? ""}
                            onChange={(e) => setBarcode(e.target.value || null)}
                            placeholder="EAN/UPC"
                        />
                    </div>

                    <div>
                        <label className="text-sm">Price</label>
                        <input
                            type="number"
                            step="0.01"
                            className="mt-1 w-full rounded-md border px-3 py-2 bg-white dark:bg-zinc-900"
                            value={basePrice ?? ""}
                            onChange={(e) => setBasePrice(e.target.value === "" ? null : Number(e.target.value))}
                            placeholder="e.g. 45.50"
                        />
                    </div>

                    <div>
                        <label className="text-sm">Weight (kg)</label>
                        <input
                            type="number"
                            step="0.001"
                            className="mt-1 w-full rounded-md border px-3 py-2 bg-white dark:bg-zinc-900"
                            value={weightKg ?? ""}
                            onChange={(e) => setWeightKg(e.target.value === "" ? null : Number(e.target.value))}
                            placeholder="e.g. 0.150"
                        />
                    </div>

                    <div>
                        <label className="text-sm">Maintaining Quantity</label>
                        <input
                            type="number"
                            className="mt-1 w-full rounded-md border px-3 py-2 bg-white dark:bg-zinc-900"
                            value={maintainingQuantity ?? ""}
                            onChange={(e) => setMaintainingQuantity(e.target.value === "" ? null : Number(e.target.value))}
                            placeholder="e.g. 10"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            id="isActive"
                            type="checkbox"
                            checked={isActive}
                            onChange={(e) => setIsActive(e.target.checked)}
                        />
                        <label htmlFor="isActive" className="text-sm">Active</label>
                    </div>

                    {session?.user && (
                        <div>
                            <label className="text-sm">Created By</label>
                            <input
                                className="mt-1 w-full rounded-md border px-3 py-2 bg-zinc-100 dark:bg-zinc-800"
                                value={session.user.name}
                                readOnly
                            />
                        </div>
                    )}
                </div>

                {/* Autocompletes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div>
                        <label className="text-sm">Unit</label>
                        <select
                            className="mt-1 w-full rounded-md border px-3 py-2 bg-white dark:bg-zinc-900"
                            value={unit?.id || ""}
                            onChange={(e) => {
                                const selectedId = Number(e.target.value);
                                const selectedUnit = unitOptions.find((option) => option.id === selectedId);
                                setUnit(selectedUnit || null);
                            }}
                        >
                            <option value="">Select a unit</option>
                            {unitOptions.map((option) => (
                                <option key={option.id} value={option.id}>
                                    {option.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <BrandDropdown
                        value={brand}
                        onChange={(o) => setBrand(o)}
                    />
                    <CategoryDropdown
                        value={category}
                        onChange={(o) => setCategory(o)}
                    />
                </div>

                {err && <div className="text-sm text-red-600">{err}</div>}

                <div className="flex justify-end gap-2 pt-2">
                    <button
                        type="button"
                        className="px-3 py-2 rounded-md border"
                        onClick={onClose}
                        disabled={saving}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="px-3 py-2 rounded-md bg-black text-white disabled:opacity-60"
                        disabled={saving}
                    >
                        {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Product"}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
