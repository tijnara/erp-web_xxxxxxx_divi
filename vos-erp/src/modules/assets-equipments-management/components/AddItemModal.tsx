"use client";

import { useEffect, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { AddItemTypeModal } from "./AddItemTypeModal";
import { AddItemClassificationModal } from "./AddItemClassificationModal";

interface ItemType {
    id: number;
    type_name: string;
}

interface ItemClassification {
    id: number;
    classification_name: string;
}

interface AddItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (newItem: any) => void;
}

export function AddItemModal({ isOpen, onClose, onSuccess }: AddItemModalProps) {
    const [itemName, setItemName] = useState("");
    const [itemType, setItemType] = useState("");
    const [itemClassification, setItemClassification] = useState("");
    const [itemTypes, setItemTypes] = useState<ItemType[]>([]);
    const [itemClassifications, setItemClassifications] = useState<ItemClassification[]>([]);
    const [isAddItemTypeModalOpen, setAddItemTypeModalOpen] = useState(false);
    const [isAddItemClassificationModalOpen, setAddItemClassificationModalOpen] = useState(false);

    const fetchItemTypes = async () => {
        try {
            const itemTypesRes = await fetch("http://100.119.3.44:8090/items/item_type");
            const itemTypesData = await itemTypesRes.json();
            setItemTypes(itemTypesData.data || []);
            return itemTypesData.data || [];
        } catch (error) {
            console.error("Error fetching item types:", error);
            return [];
        }
    };

    const fetchItemClassifications = async () => {
        try {
            const itemClassificationsRes = await fetch("http://100.119.3.44:8090/items/item_classification");
            const itemClassificationsData = await itemClassificationsRes.json();
            setItemClassifications(itemClassificationsData.data || []);
            return itemClassificationsData.data || [];
        } catch (error) {
            console.error("Error fetching item classifications:", error);
            return [];
        }
    };

    useEffect(() => {
        if (isOpen) {
            const fetchDropdownData = async () => {
                fetchItemTypes();
                fetchItemClassifications();
            };
            fetchDropdownData();
        }
    }, [isOpen]);

    const handleAddNewItemTypeSuccess = (newItemType: any) => {
        fetchItemTypes().then(updatedItemTypes => {
            const createdItemType = updatedItemTypes.find((it: ItemType) => it.id === newItemType.id);
            if (createdItemType) {
                setItemType(String(createdItemType.id));
            }
        });
        setAddItemTypeModalOpen(false);
    };

    const handleAddNewItemClassificationSuccess = (newItemClassification: any) => {
        fetchItemClassifications().then(updatedItemClassifications => {
            const createdItemClassification = updatedItemClassifications.find((ic: ItemClassification) => ic.id === newItemClassification.id);
            if (createdItemClassification) {
                setItemClassification(String(createdItemClassification.id));
            }
        });
        setAddItemClassificationModalOpen(false);
    };

    const handleSubmit = async () => {
        if (!itemName || !itemType || !itemClassification) {
            toast.error("Please fill all fields.");
            return;
        }

        try {
            const response = await fetch("http://100.119.3.44:8090/items/items", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    item_name: itemName,
                    item_type: parseInt(itemType),
                    item_classification: parseInt(itemClassification),
                }),
            });

            if (response.ok) {
                const newItem = await response.json();
                toast.success("Item added successfully!");
                onSuccess(newItem.data);
                onClose();
                window.location.reload();
            } else {
                toast.error("Failed to add new item.");
            }
        } catch (error) {
            console.error("Error adding new item:", error);
            toast.error("An error occurred while adding the new item.");
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add New Item</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="itemName">Item Name</Label>
                        <Input
                            id="itemName"
                            value={itemName}
                            onChange={(e) => setItemName(e.target.value)}
                        />
                    </div>
                    <div className="flex items-end space-x-2">
                        <div className="flex-grow">
                            <Label htmlFor="itemType">Item Type</Label>
                            <select
                                id="itemType"
                                value={itemType}
                                onChange={(e) => setItemType(e.target.value)}
                                className="w-full p-2 border rounded"
                            >
                                <option value="">Select an Item Type</option>
                                {itemTypes.map((type) => (
                                    <option key={type.id} value={type.id}>
                                        {type.type_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <Button type="button" onClick={() => setAddItemTypeModalOpen(true)}>
                            +
                        </Button>
                    </div>
                    <div className="flex items-end space-x-2">
                        <div className="flex-grow">
                            <Label htmlFor="itemClassification">Item Classification</Label>
                            <select
                                id="itemClassification"
                                value={itemClassification}
                                onChange={(e) => setItemClassification(e.target.value)}
                                className="w-full p-2 border rounded"
                            >
                                <option value="">Select an Item Classification</option>
                                {itemClassifications.map((classification) => (
                                    <option key={classification.id} value={classification.id}>
                                        {classification.classification_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <Button type="button" onClick={() => setAddItemClassificationModalOpen(true)}>
                            +
                        </Button>
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={onClose} variant="outline">
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit}>Add Item</Button>
                </DialogFooter>
            </DialogContent>
            <AddItemTypeModal
                isOpen={isAddItemTypeModalOpen}
                onClose={() => setAddItemTypeModalOpen(false)}
                onSuccess={handleAddNewItemTypeSuccess}
            />
            <AddItemClassificationModal
                isOpen={isAddItemClassificationModalOpen}
                onClose={() => setAddItemClassificationModalOpen(false)}
                onSuccess={handleAddNewItemClassificationSuccess}
            />
        </Dialog>
    );
}
