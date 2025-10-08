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
import { AddItemModal } from "./AddItemModal";
import { AddItemTypeModal } from "./AddItemTypeModal";
import { AddItemClassificationModal } from "./AddItemClassificationModal";
import { useSession } from "@/hooks/use-session";

interface AssetFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

interface Item {
    id: number;
    item_name: string;
    item_type: number;
    item_classification: number;
}

interface Department {
    department_id: number;
    department_name: string;
}

interface ItemType {
    id: number;
    type_name: string;
}

interface ItemClassification {
    id: number;
    classification_name: string;
}

interface User {
    user_id: number;
    user_fname: string;
    user_lname: string;
}

const initialFormData = {
    item_id: "",
    item_type: "",
    item_classification: "",
    quantity: 1,
    department: "",
    employee: "",
    cost_per_item: 0,
    condition: "Good",
    life_span: 1,
    date_acquired: new Date().toISOString().split("T")[0],
    rfid_code: "",
    barcode: "",
    item_image: null,
};

export function AssetForm({ isOpen, onClose, onSuccess }: AssetFormProps) {
    const { session } = useSession();
    const [items, setItems] = useState<Item[]>([]);
    const [itemTypes, setItemTypes] = useState<ItemType[]>([]);
    const [itemClassifications, setItemClassifications] = useState<ItemClassification[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [isAddItemModalOpen, setAddItemModalOpen] = useState(false);
    const [isAddItemTypeModalOpen, setAddItemTypeModalOpen] = useState(false);
    const [isAddItemClassificationModalOpen, setAddItemClassificationModalOpen] = useState(false);
    const [formData, setFormData] = useState(initialFormData);

    const fetchItems = async () => {
        try {
            const itemsRes = await fetch("http://100.119.3.44:8090/items/items");
            const itemsData = await itemsRes.json();
            setItems(itemsData.data || []);
            return itemsData.data || [];
        } catch (error) {
            console.error("Error fetching items:", error);
            return [];
        }
    };

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
                try {
                    const [departmentsRes, usersRes] = await Promise.all([
                        fetch("http://100.119.3.44:8090/items/department"),
                        fetch("http://100.119.3.44:8090/items/user"),
                    ]);
                    fetchItems();
                    fetchItemTypes();
                    fetchItemClassifications();
                    const departmentsData = await departmentsRes.json();
                    const usersData = await usersRes.json();

                    setDepartments(departmentsData.data);
                    setUsers(usersData.data);
                } catch (error) {
                    console.error("Error fetching dropdown data:", error);
                }
            };
            fetchDropdownData();
        }
    }, [isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        if (name === "item_id") {
            const selectedItem = items.find((item) => String(item.id) === value);
            if (selectedItem) {
                setFormData((prev) => ({
                    ...prev,
                    item_id: value,
                    item_type: String(selectedItem.item_type),
                    item_classification: String(selectedItem.item_classification),
                }));
            } else {
                setFormData((prev) => ({
                    ...prev,
                    item_id: value,
                    item_type: "",
                    item_classification: "",
                }));
            }
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }));
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFormData((prev) => ({ ...prev, item_image: e.target.files![0] as any }));
        }
    };

    const handleAddNewItemSuccess = (newItem: any) => {
        fetchItems().then(() => {
            setFormData(prev => ({
                ...prev,
                item_id: String(newItem.id),
                item_type: String(newItem.item_type),
                item_classification: String(newItem.item_classification),
            }));
        });
        setAddItemModalOpen(false);
    };

    const handleAddNewItemTypeSuccess = (newItemType: any) => {
        fetchItemTypes().then(updatedItemTypes => {
            const createdItemType = updatedItemTypes.find((it: ItemType) => it.id === newItemType.id);
            if (createdItemType) {
                setFormData(prev => ({ ...prev, item_type: String(createdItemType.id) }));
            }
        });
        setAddItemTypeModalOpen(false);
    };

    const handleAddNewItemClassificationSuccess = (newItemClassification: any) => {
        fetchItemClassifications().then(updatedItemClassifications => {
            const createdItemClassification = updatedItemClassifications.find((ic: ItemClassification) => ic.id === newItemClassification.id);
            if (createdItemClassification) {
                setFormData(prev => ({ ...prev, item_classification: String(createdItemClassification.id) }));
            }
        });
        setAddItemClassificationModalOpen(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!session) {
            toast.error("You must be logged in to perform this action.");
            return;
        }

        const postData = {
            ...formData,
            total: formData.quantity * formData.cost_per_item,
            encoder: parseInt(session.user.id, 10),
        };

        try {
            const response = await fetch("http://100.119.3.44:8090/items/assets_and_equipment", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(postData),
            });

            if (response.ok) {
                toast.success("Asset added successfully!");
                onSuccess();
                setFormData(initialFormData);
            } else {
                toast.error("Failed to add asset.");
            }
        } catch (error) {
            console.error("Error submitting form:", error);
            toast.error("An error occurred while adding the asset.");
        }
    };

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <SheetContent className="w-full max-w-md p-6 overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>Add New Asset</SheetTitle>
                </SheetHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    <div className="flex items-end space-x-2">
                        <div className="flex-grow">
                            <Label htmlFor="item_id">Item</Label>
                            <select
                                id="item_id"
                                name="item_id"
                                value={formData.item_id}
                                onChange={handleChange}
                                className="w-full p-2 border rounded"
                            >
                                <option value="">Select an Item</option>
                                {items.map((item) => (
                                    <option key={item.id} value={item.id}>
                                        {item.item_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <Button type="button" onClick={() => setAddItemModalOpen(true)}>
                            +
                        </Button>
                    </div>
                    <div className="flex items-end space-x-2">
                        <div className="flex-grow">
                            <Label htmlFor="item_type">Item Type</Label>
                            <select
                                id="item_type"
                                name="item_type"
                                value={formData.item_type}
                                onChange={handleChange}
                                className="w-full p-2 border rounded"
                            >
                                <option value="">Select an Item Type</option>
                                {itemTypes.map(it => <option key={it.id} value={it.id}>{it.type_name}</option>)}
                            </select>
                        </div>
                        <Button type="button" onClick={() => setAddItemTypeModalOpen(true)}>
                            +
                        </Button>
                    </div>
                    <div className="flex items-end space-x-2">
                        <div className="flex-grow">
                            <Label htmlFor="item_classification">Item Classification</Label>
                            <select
                                id="item_classification"
                                name="item_classification"
                                value={formData.item_classification}
                                onChange={handleChange}
                                className="w-full p-2 border rounded"
                            >
                                <option value="">Select an Item Classification</option>
                                {itemClassifications.map(ic => <option key={ic.id} value={ic.id}>{ic.classification_name}</option>)}
                            </select>
                        </div>
                        <Button type="button" onClick={() => setAddItemClassificationModalOpen(true)}>
                            +
                        </Button>
                    </div>
                    <div>
                        <Label htmlFor="quantity">Quantity</Label>
                        <Input id="quantity" name="quantity" type="number" value={formData.quantity} onChange={handleChange} />
                    </div>
                    <div>
                        <Label htmlFor="cost_per_item">Cost Per Item</Label>
                        <Input id="cost_per_item" name="cost_per_item" type="number" value={formData.cost_per_item} onChange={handleChange} />
                    </div>
                    <div>
                        <Label htmlFor="department">Department</Label>
                        <select
                            id="department"
                            name="department"
                            value={formData.department}
                            onChange={handleChange}
                            className="w-full p-2 border rounded"
                        >
                            <option value="">Select a Department</option>
                            {departments.map(dept => <option key={dept.department_id} value={dept.department_id}>{dept.department_name}</option>)}
                        </select>
                    </div>
                    <div>
                        <Label htmlFor="employee">Assigned To</Label>
                        <select
                            id="employee"
                            name="employee"
                            value={formData.employee}
                            onChange={handleChange}
                            className="w-full p-2 border rounded"
                        >
                            <option value="">Select an Employee</option>
                            {users.map(user => <option key={user.user_id} value={user.user_id}>{`${user.user_fname} ${user.user_lname}`}</option>)}
                        </select>
                    </div>
                    <div>
                        <Label htmlFor="condition">Condition</Label>
                        <select
                            id="condition"
                            name="condition"
                            value={formData.condition}
                            onChange={handleChange}
                            className="w-full p-2 border rounded"
                        >
                            <option value="Good">Good</option>
                            <option value="Bad">Bad</option>
                            <option value="Under Maintenance">Under Maintenance</option>
                            <option value="Discontinued">Discontinued</option>
                        </select>
                    </div>
                    <div>
                        <Label htmlFor="life_span">Life Span (Years)</Label>
                        <Input id="life_span" name="life_span" type="number" value={formData.life_span} onChange={handleChange} />
                    </div>
                    <div>
                        <Label htmlFor="date_acquired">Date Acquired</Label>
                        <Input id="date_acquired" name="date_acquired" type="date" value={formData.date_acquired} onChange={handleChange} />
                    </div>
                    <div>
                        <Label htmlFor="rfid_code">RFID Code</Label>
                        <Input id="rfid_code" name="rfid_code" value={formData.rfid_code} onChange={handleChange} />
                    </div>
                    <div>
                        <Label htmlFor="barcode">Barcode</Label>
                        <Input id="barcode" name="barcode" value={formData.barcode} onChange={handleChange} />
                    </div>
                    <div>
                        <Label htmlFor="item_image">Image</Label>
                        <Input id="item_image" name="item_image" type="file" onChange={handleFileChange} />
                    </div>
                    <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button type="submit">Save</Button>
                    </div>
                </form>
            </SheetContent>
            <AddItemModal
                isOpen={isAddItemModalOpen}
                onClose={() => setAddItemModalOpen(false)}
                onSuccess={handleAddNewItemSuccess}
            />
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
        </Sheet>
    );
}
