import { AssetsEquipmentsManagementModule } from "@/modules/assets-equipments-management/AssetsEquipmentsManagementModule";

export default function AssetsAndEquipmentsPage() {
    return <AssetsEquipmentsManagementModule />;
}
export interface AssetItem {
    id: number;
    itemName: string;
    itemTypeId: number;
    itemTypeName: string;
    itemClassificationId: number;
    itemClassificationName: string;
}

export interface AssetType {
    id: number;
    typeName: string;
}

export interface AssetClassification {
    id: number;
    classificationName: string;
}

export interface AssetDepartment {
    departmentId: number;
    departmentName: string;
}

export interface AssetUser {
    userId: number;
    fullName: string;
}

export interface Asset {
    id: number;
    itemId: number;
    itemName: string;
    itemTypeId: number;
    itemTypeName: string;
    itemClassificationId: number;
    itemClassificationName: string;
    departmentId: number;
    departmentName: string;
    employeeId: number;
    employeeName: string;
    encoderId: number;
    encoderName: string;
    rfidCode?: string;
    barCode?: string;
    dateAcquired: string;
    totalCost: number;
    lifeSpan: number;
    condition: 'Good' | 'Bad' | 'Under Maintenance' | 'Discontinued';
    itemImage?: string;
    quantity: number;
}

