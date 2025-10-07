// src/modules/product-management/providers/DataProvider.ts
import type { Product, PriceType, ProductPrice, UpsertProductDTO } from "../types";

export type ListParams = {
    q?: string;
    limit?: number;
    offset?: number;
};

export interface DataProvider {
    listProducts(params: ListParams): Promise<{ items: Product[]; total: number }>;
    getProduct(productId: string | number): Promise<Product>;
    createProduct(data: UpsertProductDTO): Promise<Product>;
    updateProduct(productId: string | number, data: UpsertProductDTO): Promise<Product>;
    deleteProduct(productId: string | number): Promise<void>;

    getUser(userId: string | number): Promise<{ id: number; first_name: string; last_name: string } | null>;

    listPriceTypes(): Promise<PriceType[]>;
    createPriceType(name: string): Promise<PriceType>;
    updatePriceType(id: number | string, name: string): Promise<PriceType>;
    deletePriceType(id: number | string): Promise<void>;

    listProductPrices(productId: string | number): Promise<ProductPrice[]>;
    setProductPrice(
        productId: string | number,
        priceTypeId: number | string,
        value: number | null
    ): Promise<ProductPrice | null>;

    approveProductPrice(priceId: string | number): Promise<ProductPrice>;
}
