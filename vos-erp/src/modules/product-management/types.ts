// src/modules/product-management/types.ts
export type Ref = { id: number | string; name: string };
export type UnitRef = Ref & { shortcut?: string | null };

export type Product = {
    id: number | string;
    code?: string | null;
    barcode?: string | null;
    name: string;
    description?: string | null;
    weight_kg?: number | null;
    stock_qty?: number | null;
    maintaining_quantity?: number | null;
    base_price?: number | null;
    cost?: number | null;
    isActive?: boolean;
    created_at?: string;
    last_updated?: string;
    created_by?: number;

    // Enriched (LEFT-joined) labels/ids
    unit?: UnitRef | null;
    brand?: Ref | null;
    category?: Ref | null;
    segment?: Ref | null;
    section?: Ref | null;
};

export type UpsertProductDTO = Partial<Omit<Product, 'id' | 'unit' | 'brand' | 'category' | 'segment' | 'section'>> & {
    name: string;
    maintaining_quantity?: number | null;

    // relation IDs for writing
    unitId?: number | string | null;
    brandId?: number | string | null;
    categoryId?: number | string | null;
    segmentId?: number | string | null;
    sectionId?: number | string | null;
};

export type PriceType = {
    id: number | string;
    name: string;
    sort?: number | null;
};

export type ProductPrice = {
    id?: number | string;
    productId: Product['id'];
    priceTypeId: PriceType['id'];
    value: number | null;
    status?: string;
};
