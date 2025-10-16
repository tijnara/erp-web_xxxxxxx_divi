import { useEffect, useState } from "react";
import { Asset } from "@/modules/assets-equipments-management/types";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { peso } from "@/lib/utils";

interface AssetDetailsProps {
    isOpen: boolean;
    onClose: () => void;
    asset: Asset;
}

// Added proper type definitions for fetched data
interface Item {
    id: number;
    item_type: number;
    item_classification: number;
    item_name: string;
}

interface ItemType {
    id: number;
    type_name: string;
}

interface ItemClassification {
    id: number;
    classification_name: string;
}

interface Department {
    department_id: number;
    department_name: string;
}

interface User {
    user_id: number;
    user_fname: string;
    user_lname: string;
}

export function AssetDetails({ isOpen, onClose, asset: initialAsset }: AssetDetailsProps) {
    const [asset, setAsset] = useState<Asset>(initialAsset);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const [itemsRes, itemTypesRes, classRes, deptRes, usersRes] = await Promise.all([
                    fetch("http://100.119.3.44:8090/items/items"),
                    fetch("http://100.119.3.44:8090/items/item_type"),
                    fetch("http://100.119.3.44:8090/items/item_classification"),
                    fetch("http://100.119.3.44:8090/items/department"),
                    fetch("http://100.119.3.44:8090/items/user"),
                ]);

                const itemsData: { data: Item[] } = await itemsRes.json();
                const itemTypesData: { data: ItemType[] } = await itemTypesRes.json();
                const classData: { data: ItemClassification[] } = await classRes.json();
                const deptData: { data: Department[] } = await deptRes.json();
                const usersData: { data: User[] } = await usersRes.json();

                const itemsMap = new Map(itemsData.data.map((i) => [i.id, i]));
                const typesMap = new Map(itemTypesData.data.map((t) => [t.id, t]));
                const classMap = new Map(classData.data.map((c) => [c.id, c]));
                const deptMap = new Map(deptData.data.map((d) => [d.department_id, d]));
                const userMap = new Map(usersData.data.map((u) => [u.user_id, u]));

                const item = itemsMap.get(initialAsset.item_id);
                const itemType = item ? typesMap.get(item.item_type) : null;
                const itemClassification = item ? classMap.get(item.item_classification) : null;
                const department = deptMap.get(initialAsset.department);
                const employee = userMap.get(initialAsset.employee);
                const encoder = userMap.get(initialAsset.encoder);

                setAsset({
                    ...initialAsset,
                    itemName: item?.item_name || 'Unknown Item',
                    itemTypeName: itemType?.type_name || 'Unknown Type',
                    itemClassificationName: itemClassification?.classification_name || 'Unknown Classification',
                    departmentName: department?.department_name || 'Unknown Department',
                    employeeName: `${employee?.user_fname || ''} ${employee?.user_lname || ''}`.trim() || 'Unknown User',
                    encoderName: `${encoder?.user_fname || ''} ${encoder?.user_lname || ''}`.trim() || 'Unknown User',
                });

            } catch (error) {
                console.error("Error fetching asset details:", error);
            }
        };

        if (isOpen) {
            fetchDetails();
        }
    }, [isOpen, initialAsset]);

    const card = (k: string, v: string | number | null | undefined, full = false) => (
        <div className={`border rounded-lg p-3 bg-slate-50 ${full ? 'sm:col-span-2' : ''}`}>
            <div className="text-xs text-slate-500">{k}</div>
            <div className="font-semibold break-words">{v ?? '—'}</div>
        </div>
    );

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <SheetContent className="w-full max-w-md p-6 overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>Asset Details</SheetTitle>
                </SheetHeader>
                <div className="space-y-4 mt-4">
                    <div className="border rounded-lg p-4 mb-4 bg-white">
                        <img src={asset.item_image || "https://placehold.co/400x300/e2e8f0/475569?text=No+Image"}
                             className="w-full h-48 object-cover rounded-lg mb-4 bg-slate-100" alt={asset.itemName || 'Asset Image'}/>
                        <div className="text-xl font-bold">{asset.itemName}</div>
                        <div className="text-sm text-slate-500">Asset ID: {asset.id}</div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {card("Item Type", asset.itemTypeName)}
                        {card("Classification", asset.itemClassificationName)}
                        {card("Department", asset.departmentName, true)}
                        {card("Assigned To", asset.employeeName, true)}
                        {card("Purchase Date", new Date(asset.date_acquired).toLocaleDateString())}
                        {card("Cost", peso(asset.total))}
                        {card("Life Span (Years)", asset.life_span)}
                        {card("Condition", asset.condition)}
                        {card("Encoded By", asset.encoderName, true)}
                        {card("RFID Code", asset.rfid_code)}
                        {card("Bar Code", asset.barcode)}
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
