"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HttpDataProvider } from "../providers/HttpDataProvider";

interface ConsumableCategory {
    category_id: number;
    category_name: string;
    category_description: string;
    date_added: string;
    updated_at: string;
}

export function CategoriesView({ provider }: { provider: HttpDataProvider }) {
    const [categories, setCategories] = useState<ConsumableCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState({
        category_name: "",
        category_description: "",
    });

    useEffect(() => {
        provider.listCategories().then((data: ConsumableCategory[]) => {
            setCategories(data);
            setLoading(false);
        });
    }, [provider]);

    const handleSubmit = async () => {
        if (!form.category_name.trim()) return alert("Category name is required");
        try {
            await provider.createCategory(form);
            const data = await provider.listCategories();
            setCategories(data);
            setForm({ category_name: "", category_description: "" });
            setOpen(false);
        } catch (err) {
            console.error("Error adding category:", err);
            alert("Failed to add category.");
        }
    };

    if (loading) return <p>Loading categories...</p>;

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Consumable Categories</h2>
                <Button onClick={() => setOpen(true)}>Add Category</Button>
            </div>

            <table className="w-full border border-gray-200 text-sm">
                <thead className="bg-gray-100">
                <tr>
                    <th className="border px-4 py-2 text-left">ID</th>
                    <th className="border px-4 py-2 text-left">Name</th>
                    <th className="border px-4 py-2 text-left">Description</th>
                    <th className="border px-4 py-2 text-left">Date Added</th>
                </tr>
                </thead>
                <tbody>
                {categories.map((cat) => (
                    <tr key={cat.category_id}>
                        <td className="border px-4 py-2">{cat.category_id}</td>
                        <td className="border px-4 py-2">{cat.category_name}</td>
                        <td className="border px-4 py-2">{cat.category_description}</td>
                        <td className="border px-4 py-2">
                            {new Date(cat.date_added).toLocaleString()}
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>

            {/* Add Category Modal */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New Category</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <div>
                            <Label>Category Name</Label>
                            <Input
                                value={form.category_name}
                                onChange={(e) => setForm({ ...form, category_name: e.target.value })}
                                placeholder="Enter category name"
                            />
                        </div>
                        <div>
                            <Label>Description</Label>
                            <Input
                                value={form.category_description}
                                onChange={(e) =>
                                    setForm({ ...form, category_description: e.target.value })
                                }
                                placeholder="Enter description"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSubmit}>Save</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
