// src/modules/product-management/providers/HttpDataProvider.ts
import type {
    DataProvider,
    ListParams,
} from "./DataProvider";
import type {
    Product,
    PriceType,
    ProductPrice,
    UpsertProductDTO,
} from "../types";

async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
    const res = await fetch(url, {
        ...init,
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            ...(init?.headers || {}),
        },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
    return data as T;
}

export class HttpDataProvider implements DataProvider {
    async listProducts(params: ListParams): Promise<{ items: Product[]; total: number }> {
        const qp = new URLSearchParams();
        if (params.q) qp.set("q", params.q);
        if (params.limit != null) qp.set("limit", String(params.limit));
        if (params.offset != null) qp.set("offset", String(params.offset));
        // You can pass sort too, e.g. -product_name
        qp.set("sort", "-product_name");

        // This hits our API route that proxies to Directus with LEFT-join expansions
        const r = await fetchJSON<{ items: Product[]; total?: number }>(`/api/products?${qp.toString()}`);
        return { items: r.items, total: r.total ?? r.items.length };
    }

    async getProduct(productId: string | number): Promise<Product> {
        return fetchJSON<Product>(`/api/products/${encodeURIComponent(String(productId))}`);
    }

    async createProduct(data: UpsertProductDTO): Promise<Product> {
        return fetchJSON<Product>("/api/products", {
            method: "POST",
            body: JSON.stringify(data),
        });
    }

    async updateProduct(productId: string | number, data: UpsertProductDTO): Promise<Product> {
        return fetchJSON<Product>(`/api/products/${encodeURIComponent(String(productId))}`, {
            method: "PATCH",
            body: JSON.stringify(data),
        });
    }

    async deleteProduct(productId: string | number): Promise<void> {
        await fetchJSON(`/api/products/${encodeURIComponent(String(productId))}`, {
            method: "DELETE",
        });
    }

    async listPriceTypes(): Promise<PriceType[]> {
        return fetchJSON<PriceType[]>("/api/price-types");
    }

    async createPriceType(name: string): Promise<PriceType> {
        return fetchJSON<PriceType>("/api/price-types", {
            method: "POST",
            body: JSON.stringify({ name }),
        });
    }

    async updatePriceType(id: number | string, name: string): Promise<PriceType> {
        return fetchJSON<PriceType>(`/api/price-types/${encodeURIComponent(String(id))}`, {
            method: "PATCH",
            body: JSON.stringify({ name }),
        });
    }

    async deletePriceType(id: number | string): Promise<void> {
        await fetchJSON(`/api/price-types/${encodeURIComponent(String(id))}`, {
            method: "DELETE",
        });
    }

    async listProductPrices(productId: string | number): Promise<ProductPrice[]> {
        return fetchJSON<ProductPrice[]>(
            `/api/products/${encodeURIComponent(String(productId))}/prices`
        );
    }

    async setProductPrice(
        productId: string | number,
        priceTypeId: number | string,
        value: number | null
    ): Promise<ProductPrice | null> {
        // If you want to delete a price when value === null, your API can interpret that.
        return fetchJSON<ProductPrice | null>(
            `/api/products/${encodeURIComponent(String(productId))}/prices`,
            {
                method: "POST",
                body: JSON.stringify({ priceTypeId, value }),
            }
        );
    }
}
