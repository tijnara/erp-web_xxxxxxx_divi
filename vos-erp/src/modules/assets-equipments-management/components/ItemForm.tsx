"use client";

import { useEffect, useState } from "react";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface ItemFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (newItem: any) => void;
}

interface ItemType {
    id: number;
    type_name: string;
}

interface ItemClassification {
    id: number;
    classification_name: string;
}

export function ItemForm({ isOpen, onClose, onSuccess }: ItemFormProps) {
    const [itemTypes, setItemTypes] = useState<ItemType[]>([]);
    const [itemClassifications, setItemClassifications] = useState<ItemClassification[]>([]);
    const [formData, setFormData] = useState({
        item_name: "",
        item_type: "",
        item_classification: "",
    });

    useEffect(() => {
        if (isOpen) {
            const fetchDropdownData = async () => {
                try {
                    const [itemTypesRes, itemClassificationsRes] = await Promise.all([
                        fetch("http://100.119.3.44:8090/items/item_type"),
                        fetch("http://100.119.3.44:8090/items/item_classification"),
                    ]);
                    const itemTypesData = await itemTypesRes.json();
                    const itemClassificationsData = await itemClassificationsRes.json();

                    setItemTypes(itemTypesData.data);
                    setItemClassifications(itemClassificationsData.data);
                } catch (error) {
                    console.error("Error fetching dropdown data:", error);
                }
            };
            fetchDropdownData();
        }
    }, [isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const { item_name, item_type, item_classification } = formData;

        if (!item_name || !item_type || !item_classification) {
            toast.error("Please fill out all fields.");
            return;
        }

        try {
            const response = await fetch("http://100.119.3.44:8090/items/items", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    item_name,
                    item_type: parseInt(item_type),
                    item_classification: parseInt(item_classification),
                }),
            });

            if (response.ok) {
                const newItems = await response.json();
                toast.success("Item added successfully!");
                onSuccess(newItems.data);
            } else {
                toast.error("Failed to add item.");
            }
        } catch (error) {
            console.error("Error submitting form:", error);
            toast.error("An error occurred while adding the item.");
        }
    };

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <SheetContent className="w-full max-w-md p-6 overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>Add New Item</SheetTitle>
                </SheetHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    <div>
                        <Label htmlFor="item_name">Item Name</Label>
                        <Input id="item_name" name="item_name" value={formData.item_name} onChange={handleChange} />
                    </div>
                    <div>
                        <Label htmlFor="item_type">Item Type</Label>
                        <select id="item_type" name="item_type" value={formData.item_type} onChange={handleChange} className="w-full p-2 border rounded">
                            <option value="">Select an Item Type</option>
                            {itemTypes.map(it => <option key={it.id} value={it.id}>{it.type_name}</option>)}
                        </select>
                    </div>
                    <div>
                        <Label htmlFor="item_classification">Item Classification</Label>
                        <select id="item_classification" name="item_classification" value={formData.item_classification} onChange={handleChange} className="w-full p-2 border rounded">
                            <option value="">Select an Item Classification</option>
                            {itemClassifications.map(ic => <option key={ic.id} value={ic.id}>{ic.classification_name}</option>)}
                        </select>
                    </div>
                    <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button type="submit">Save</Button>
                    </div>
                </form>
            </SheetContent>
        </Sheet>
    );
}

