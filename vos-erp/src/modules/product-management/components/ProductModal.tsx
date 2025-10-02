// src/modules/product-management/components/ProductModal.tsx
"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { AsyncSelect } from "@/components/ui/AsyncSelect";
import type { DataProvider } from "../providers/DataProvider";
import type { Product, UpsertProductDTO } from "../types";

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
    const isEdit = !!product;

    const [name, setName] = useState("");
    const [code, setCode] = useState<string | null>(null);
    const [barcode, setBarcode] = useState<string | null>(null);
    const [description, setDescription] = useState<string | null>(null);
    const [weightKg, setWeightKg] = useState<number | null>(null);
    const [isActive, setIsActive] = useState(true);

    // selected relations (kept as id+name so UI shows text)
    const [unit, setUnit]         = useState<{ id: string | number; name: string } | null>(null);
    const [brand, setBrand]       = useState<{ id: string | number; name: string } | null>(null);
    const [category, setCategory] = useState<{ id: string | number; name: string } | null>(null);
    const [segment, setSegment]   = useState<{ id: string | number; name: string } | null>(null);
    const [section, setSection]   = useState<{ id: string | number; name: string } | null>(null);

    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        if (!open) return;
        // seed state for edit
        setName(product?.name || "");
        setCode(product?.code ?? null);
        setBarcode(product?.barcode ?? null);
        setDescription(product?.description ?? null);
        setWeightKg(product?.weight_kg ?? null);
        setIsActive(product?.isActive !== false);

        setUnit(product?.unit ? { id: product.unit.id, name: product.unit.name } : null);
        setBrand(product?.brand ? { id: product.brand.id, name: product.brand.name } : null);
        setCategory(product?.category ? { id: product.category.id, name: product.category.name } : null);
        setSegment(product?.segment ? { id: product.segment.id, name: product.segment.name } : null);
        setSection(product?.section ? { id: product.section.id, name: product.section.name } : null);

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
            isActive,

            // relation ids (optional)
            unitId: unit?.id ?? null,
            brandId: brand?.id ?? null,
            categoryId: category?.id ?? null,
            segmentId: segment?.id ?? null,
            sectionId: section?.id ?? null,
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

                    <div className="flex items-center gap-2">
                        <input
                            id="isActive"
                            type="checkbox"
                            checked={isActive}
                            onChange={(e) => setIsActive(e.target.checked)}
                        />
                        <label htmlFor="isActive" className="text-sm">Active</label>
                    </div>
                </div>

                {/* Autocompletes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <AsyncSelect
                        label="Unit"
                        placeholder="Search units…"
                        fetchUrl="/api/lookup/units"
                        initial={unit}
                        onChange={(o) => setUnit(o)}
                    />
                    <AsyncSelect
                        label="Brand"
                        placeholder="Search brands…"
                        fetchUrl="/api/lookup/brand"
                        initial={brand}
                        onChange={(o) => setBrand(o)}
                    />
                    <AsyncSelect
                        label="Category"
                        placeholder="Search categories…"
                        fetchUrl="/api/lookup/categories"
                        initial={category}
                        onChange={(o) => setCategory(o)}
                    />
                    <AsyncSelect
                        label="Segment"
                        placeholder="Search segments…"
                        fetchUrl="/api/lookup/segment"
                        initial={segment}
                        onChange={(o) => setSegment(o)}
                    />
                    <AsyncSelect
                        label="Section"
                        placeholder="Search sections…"
                        fetchUrl="/api/lookup/sections"
                        initial={section}
                        onChange={(o) => setSection(o)}
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
