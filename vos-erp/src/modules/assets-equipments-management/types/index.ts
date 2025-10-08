export interface AssetItem {
    id: number;
    itemName: string;
    itemType: number;
    itemClassification: number;
}

export interface AssetType {
    id: number;
    typeName: string;
}

export interface AssetClassification {
    id:number;
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
    itemImage: string | null;
    itemId: number;
    quantity: number;
    rfidCode: string | null;
    barcode: string | null;
    department: number;
    employee: number;
    costPerItem: number;
    total: number;
    condition: string;
    lifeSpan: number;
    encoder: number;
    dateAcquired: string;
    dateCreated: string;

    // Enriched data
    itemName?: string;
    itemTypeName?: string;
    itemClassificationName?: string;
    departmentName?: string;
    employeeName?: string;
    encoderName?: string;
}

