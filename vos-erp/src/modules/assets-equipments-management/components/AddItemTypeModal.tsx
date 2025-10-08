"use client";

import { useState } from "react";
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

interface AddItemTypeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (newItemType: any) => void;
}

export function AddItemTypeModal({ isOpen, onClose, onSuccess }: AddItemTypeModalProps) {
    const [typeName, setTypeName] = useState("");

    const handleSubmit = async () => {
        if (!typeName) {
            toast.error("Please enter an item type name.");
            return;
        }

        try {
            const response = await fetch("http://100.119.3.44:8090/items/item_type", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type_name: typeName }),
            });

            if (response.ok) {
                const newItemType = await response.json();
                toast.success("Item type added successfully!");
                onSuccess(newItemType.data);
                onClose();
            } else {
                toast.error("Failed to add new item type.");
            }
        } catch (error) {
            console.error("Error adding new item type:", error);
            toast.error("An error occurred while adding the new item type.");
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add New Item Type</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="typeName">Type Name</Label>
                        <Input
                            id="typeName"
                            value={typeName}
                            onChange={(e) => setTypeName(e.target.value)}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={onClose} variant="outline">
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit}>Add Item Type</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

