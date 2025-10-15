"use client";

import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { StatBar } from "./StatBar";
import { Label } from "@/components/ui/label";
import { HttpDataProvider } from "../providers/HttpDataProvider";

interface Consumable {
    item_id: number;
    item_code: string;
    item_name: string;
    item_description: string | null;
    category_id: number;
    unit_of_measure: string;
    unit_cost: string;
    brand: string;
    supplier_id: number | null;
    is_active: number;
    date_added: string;
    updated_at: string;
}

interface ConsumableCategory {
    category_id: number;
    category_name: string;
    category_description?: string;
}

const PAGE_SIZE = 20;

export function ConsumablesView({ provider }: { provider: HttpDataProvider }) {
    const [consumables, setConsumables] = useState<Consumable[]>([]);
    const [categories, setCategories] = useState<ConsumableCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [q, setQ] = useState("");
    const [page, setPage] = useState(1);

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [currentId, setCurrentId] = useState<number | null>(null);

    const [form, setForm] = useState<Partial<Consumable>>({
        item_code: "",
        item_name: "",
        item_description: "",
        category_id: 0,
        unit_of_measure: "",
        unit_cost: "",
        brand: "",
        supplier_id: null,
        is_active: 1,
    });

    useEffect(() => {
        let alive = true;
        const offset = (page - 1) * PAGE_SIZE;
        Promise.all([provider.listConsumables(), provider.listCategories()])
            .then(([items, cats]) => {
                if (!alive) return;
                const filtered = (items as unknown as Consumable[]).filter(
                    (c) =>
                        c.item_name.toLowerCase().includes(q.toLowerCase()) ||
                        c.item_code.toLowerCase().includes(q.toLowerCase()) ||
                        c.brand.toLowerCase().includes(q.toLowerCase())
                );
                setConsumables(filtered.slice(offset, offset + PAGE_SIZE));
                setCategories(cats as unknown as ConsumableCategory[]);
            })
            .catch((err) => console.error("Error loading:", err))
            .finally(() => setLoading(false));
        return () => {
            alive = false;
        };
    }, [provider, q, page]);

    const total = useMemo(() => consumables.length, [consumables]);
    const pageCount = useMemo(() => Math.ceil(total / PAGE_SIZE) || 1, [total]);

    const getCategoryName = (id: number) => {
        const c = categories.find((cat) => cat.category_id === id);
        return c ? c.category_name : "—";
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this consumable?")) return;
        try {
            await provider.deleteConsumable(id);
            setConsumables((prev) => prev.filter((i) => i.item_id !== id));
        } catch (err) {
            console.error("Delete failed:", err);
            alert("Failed to delete consumable.");
        }
    };

    const handleSave = async () => {
        try {
            if (!form.item_name || !form.item_code || !form.unit_of_measure || !form.unit_cost) {
                alert("Please fill in all required fields.");
                return;
            }
            if (editMode && currentId) {
                const updated = await provider.updateConsumable(currentId, form);
                setConsumables((prev) =>
                    prev.map((item) => (item.item_id === currentId ? (updated as Consumable) : item))
                );
            } else {
                const created = await provider.createConsumable(form);
                setConsumables((prev) => [...prev, created as unknown as Consumable]);
            }

            setIsDialogOpen(false);
            setEditMode(false);
            setCurrentId(null);
            setForm({
                item_code: "",
                item_name: "",
                item_description: "",
                category_id: 0,
                unit_of_measure: "",
                unit_cost: "",
                brand: "",
                supplier_id: null,
                is_active: 1,
            });
        } catch (err) {
            console.error("Save failed:", err);
            alert("Failed to save consumable.");
        }
    };

    const openEditDialog = (item: Consumable) => {
        setForm(item);
        setCurrentId(item.item_id);
        setEditMode(true);
        setIsDialogOpen(true);
    };

    if (loading) return <p>Loading consumables...</p>;

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Consumable Items</h2>
                <Button
                    onClick={() => {
                        setForm({
                            item_code: "",
                            item_name: "",
                            item_description: "",
                            category_id: 0,
                            unit_of_measure: "",
                            unit_cost: "",
                            brand: "",
                            supplier_id: null,
                            is_active: 1,
                        });
                        setEditMode(false);
                        setIsDialogOpen(true);
                    }}
                >
                    + Add Consumable
                </Button>
            </div>

            {/* Search */}
            <Input
                placeholder="Search by name, code, or brand…"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                value={q}
                onChange={(e) => {
                    setQ(e.target.value);
                    setPage(1);
                }}
            />

            {/* Table */}
            <div className="overflow-hidden border border-gray-200 rounded-xl">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-600">
                    <tr>
                        <th className="text-left p-3 font-medium">Name</th>
                        <th className="text-left p-3 font-medium">Category</th>
                        <th className="text-left p-3 font-medium">Unit</th>
                        <th className="text-left p-3 font-medium">Cost</th>
                        <th className="text-left p-3 font-medium">Brand</th>
                        <th className="text-left p-3 font-medium">Date Added</th>
                        <th className="text-left p-3 font-medium">Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {consumables.map((item) => (
                        <tr
                            key={item.item_id}
                            className="border-b border-gray-200 hover:bg-gray-50 cursor-pointer"
                        >
                            <td className="p-3">{item.item_name}</td>
                            <td className="p-3">{getCategoryName(item.category_id)}</td>
                            <td className="p-3">{item.unit_of_measure}</td>
                            <td className="p-3">{item.unit_cost}</td>
                            <td className="p-3">{item.brand}</td>
                            <td className="p-3">{new Date(item.date_added).toLocaleString()}</td>
                            <td className="p-3 flex items-center gap-2">
                                <Button variant="outline" size="sm" onClick={() => openEditDialog(item)}>
                                    Edit
                                </Button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center mt-4">
                <div>
                    <p className="text-sm text-muted-foreground">
                        Showing {consumables.length} of {total} items
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-3 py-1 rounded-lg border text-sm font-semibold disabled:opacity-50"
                    >
                        Previous
                    </Button>
                    <div className="flex items-center gap-2">
                        <span className="text-sm">
                            Page {page} of {pageCount}
                        </span>
                    </div>
                    <Button
                        onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                        disabled={page === pageCount}
                        className="px-3 py-1 rounded-lg border text-sm font-semibold disabled:opacity-50"
                    >
                        Next
                    </Button>
                </div>
            </div>

            {/* ADD/EDIT DIALOG */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editMode ? "Edit Consumable" : "Add New Consumable"}</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-3">
                        <div>
                            <Label>Item Code</Label>
                            <Input
                                value={form.item_code}
                                onChange={(e) => setForm({ ...form, item_code: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label>Item Name</Label>
                            <Input
                                value={form.item_name}
                                onChange={(e) => setForm({ ...form, item_name: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label>Category</Label>
                            <select
                                className="border w-full p-2 rounded"
                                value={form.category_id}
                                onChange={(e) => setForm({ ...form, category_id: Number(e.target.value) })}
                            >
                                <option value={0}>Select category</option>
                                {categories.map((cat) => (
                                    <option key={cat.category_id} value={cat.category_id}>
                                        {cat.category_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <Label>Unit of Measure</Label>
                            <Input
                                value={form.unit_of_measure}
                                onChange={(e) => setForm({ ...form, unit_of_measure: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label>Unit Cost</Label>
                            <Input
                                type="number"
                                value={form.unit_cost}
                                onChange={(e) => setForm({ ...form, unit_cost: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label>Brand</Label>
                            <Input
                                value={form.brand}
                                onChange={(e) => setForm({ ...form, brand: e.target.value })}
                            />
                        </div>
                        <div className="flex justify-end space-x-2 mt-4">
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleSave}>{editMode ? "Save Changes" : "Add"}</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>

    );
}
