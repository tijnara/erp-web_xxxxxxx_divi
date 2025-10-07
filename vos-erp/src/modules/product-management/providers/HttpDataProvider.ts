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

    async getUser(userId: string | number): Promise<{ id: number; first_name: string; last_name: string } | null> {
        try {
            // Note: Directus user IDs are UUIDs, but your schema seems to use integers.
            // This call might need adjustment if the API expects a different format.
            const result = await fetchJSON<{ data: any }>(`http://100.119.3.44:8090/items/user/${encodeURIComponent(String(userId))}`);
            const user = result.data;
            if (!user) return null;
            return {
                id: user.id,
                first_name: user.user_fname,
                last_name: user.user_lname,
            };
        } catch (e) {
            console.error(`Failed to fetch user ${userId}`, e);
            return null;
        }
    }

    async listPriceTypes(): Promise<PriceType[]> {
        const result = await fetchJSON<{ data: any[] }>("http://100.119.3.44:8090/items/price_types");
        return (result.data || []).map(item => ({
            id: item.price_type_id,
            name: item.price_type_name,
            sort: item.sort,
        }));
    }

    async createPriceType(name: string): Promise<PriceType> {
        const result = await fetchJSON<{ data: any }>("http://100.119.3.44:8090/items/price_types", {
            method: "POST",
            body: JSON.stringify({ price_type_name: name }),
        });
        const item = result.data;
        return {
            id: item.price_type_id,
            name: item.price_type_name,
            sort: item.sort,
        };
    }

    async updatePriceType(id: number | string, name: string): Promise<PriceType> {
        const result = await fetchJSON<{ data: any }>(`http://100.119.3.44:8090/items/price_types/${encodeURIComponent(String(id))}`, {
            method: "PATCH",
            body: JSON.stringify({ price_type_name: name }),
        });
        const item = result.data;
        return {
            id: item.price_type_id,
            name: item.price_type_name,
            sort: item.sort,
        };
    }

    async deletePriceType(id: number | string): Promise<void> {
        await fetchJSON(`http://100.119.3.44:8090/items/price_types/${encodeURIComponent(String(id))}`, {
            method: "DELETE",
        });
    }

    async listProductPrices(productId: string | number): Promise<ProductPrice[]> {
        const result = await fetchJSON<{ data: any[] }>(
            `http://100.119.3.44:8090/items/product_per_price_type?filter[product_id][_eq]=${encodeURIComponent(String(productId))}`
        );
        return (result.data || []).map(item => ({
            id: item.id,
            productId: item.product_id,
            priceTypeId: item.price_type_id,
            value: item.price,
            status: item.status,
        }));
    }

    async setProductPrice(
        productId: string | number,
        priceTypeId: number | string,
        value: number | null
    ): Promise<ProductPrice | null> {
        // Find existing price to determine if we need to create or update
        const prices = await this.listProductPrices(productId);
        const existing = prices.find(p => String(p.priceTypeId) === String(priceTypeId));

        if (existing) {
            // Update existing price
            const result = await fetchJSON<{ data: any }>(`http://100.119.3.44:8090/items/product_per_price_type/${existing.id}`, {
                method: "PATCH",
                body: JSON.stringify({ price: value }),
            });
            const item = result.data;
            return {
                id: item.id,
                productId: item.product_id,
                priceTypeId: item.price_type_id,
                value: item.price,
                status: item.status,
            };
        } else if (value !== null) {
            // Create new price
            const result = await fetchJSON<{ data: any }>("http://100.119.3.44:8090/items/product_per_price_type", {
                method: "POST",
                body: JSON.stringify({
                    product_id: productId,
                    price_type_id: priceTypeId,
                    price: value
                }),
            });
            const item = result.data;
            return {
                id: item.id,
                productId: item.product_id,
                priceTypeId: item.price_type_id,
                value: item.price,
                status: item.status,
            };
        }

        return null;
    }

    async approveProductPrice(priceId: string | number): Promise<ProductPrice> {
        const result = await fetchJSON<{ data: any }>(`http://100.119.3.44:8090/items/product_per_price_type/${encodeURIComponent(String(priceId))}`, {
            method: "PATCH",
            body: JSON.stringify({ status: "approved" }),
        });
        const item = result.data;
        return {
            id: item.id,
            productId: item.product_id,
            priceTypeId: item.price_type_id,
            value: item.price,
            status: item.status,
        };
    }
}
