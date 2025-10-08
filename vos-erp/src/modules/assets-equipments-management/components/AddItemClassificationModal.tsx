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

interface AddItemClassificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (newItemClassification: any) => void;
}

export function AddItemClassificationModal({ isOpen, onClose, onSuccess }: AddItemClassificationModalProps) {
    const [classificationName, setClassificationName] = useState("");

    const handleSubmit = async () => {
        if (!classificationName) {
            toast.error("Please enter an item classification name.");
            return;
        }

        try {
            const response = await fetch("http://100.119.3.44:8090/items/item_classification", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ classification_name: classificationName }),
            });

            if (response.ok) {
                const newItemClassification = await response.json();
                toast.success("Item classification added successfully!");
                onSuccess(newItemClassification.data);
                onClose();
            } else {
                toast.error("Failed to add new item classification.");
            }
        } catch (error) {
            console.error("Error adding new item classification:", error);
            toast.error("An error occurred while adding the new item classification.");
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add New Item Classification</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="classificationName">Classification Name</Label>
                        <Input
                            id="classificationName"
                            value={classificationName}
                            onChange={(e) => setClassificationName(e.target.value)}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={onClose} variant="outline">
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit}>Add Item Classification</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

