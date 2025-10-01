// src/modules/product-management/types.ts
export type Product = {
    id: number | string;
    code?: string | null;
    barcode?: string | null;
    name: string;
    description?: string | null;
    weight_kg?: number | null;
    stock_qty?: number | null;
    base_price?: number | null;
    cost?: number | null;
    isActive?: boolean;
};

export type UpsertProductDTO = Partial<Omit<Product, "id">> & { name: string };

export type PriceType = {
    id: number | string;
    name: string;
    sort?: number | null;
};

export type ProductPrice = {
    productId: Product["id"];
    priceTypeId: PriceType["id"];
    value: number | null;
};
