// src/modules/product-management/providers/demoMemoryProvider.ts
import type { DataProvider, ListParams } from "./DataProvider";
import type { PriceType, Product, ProductPrice, UpsertProductDTO } from "../types";

export const demoMemoryProvider = (): DataProvider => {
    let products: Product[] = [
        {
            id: 1,
            code: "COCA500",
            barcode: "7894980811517",
            name: "Coca Cola 500ml",
            description: "Coca Cola Soft Drink 500ml Bottle",
            weight_kg: 0.5,
            stock_qty: 100,
            base_price: 2.5,
            cost: 1.5,
            isActive: true,
        },
        {
            id: 2,
            code: "BREAD001",
            barcode: "1234567890123",
            name: "Bread Whole Wheat",
            description: "Fresh Whole Wheat Bread Loaf",
            weight_kg: 0.8,
            stock_qty: 50,
            base_price: 3.5,
            cost: 2.0,
            isActive: true,
        },
    ];

    let priceTypes: PriceType[] = [
        { id: 1, name: "Retail", sort: 1 },
        { id: 2, name: "Wholesale", sort: 2 },
        { id: 3, name: "Member", sort: 3 },
        { id: 4, name: "Bulk", sort: 4 },
    ];

    let prices: ProductPrice[] = [
        { id: 1, productId: 1, priceTypeId: 1, value: 2.5 },
        { id: 2, productId: 1, priceTypeId: 2, value: 2.0 },
        { id: 3, productId: 1, priceTypeId: 3, value: 2.25 },
        { id: 4, productId: 2, priceTypeId: 1, value: 3.5 },
        { id: 5, productId: 2, priceTypeId: 2, value: 3.0 },
    ];

    const nextId = () => Math.max(0, ...products.map((p) => Number(p.id))) + 1;

    return {
        async listProducts({ q, limit = 50, offset = 0 }: ListParams) {
            let items = products;
            if (q) {
                const needle = q.toLowerCase();
                items = items.filter((p) =>
                    [p.name, p.code, p.barcode, p.description].some((v) =>
                        (v ?? "").toLowerCase().includes(needle)
                    )
                );
            }
            return { items: items.slice(offset, offset + limit), total: items.length };
        },

        async getProduct(id) {
            return products.find((p) => String(p.id) === String(id))!;
        },

        async createProduct(data: UpsertProductDTO) {
            const p: Product = { id: nextId(), isActive: true, ...data };
            products.unshift(p);
            return p;
        },

        async updateProduct(id, data) {
            const i = products.findIndex((p) => String(p.id) === String(id));
            products[i] = { ...products[i], ...data };
            return products[i];
        },

        async deleteProduct(id) {
            products = products.filter((p) => String(p.id) !== String(id));
            prices = prices.filter((pp) => String(pp.productId) !== String(id));
        },

        async listPriceTypes() {
            return priceTypes;
        },

        async createPriceType(name) {
            const pt: PriceType = {
                id: Math.max(0, ...priceTypes.map((p) => Number(p.id))) + 1,
                name,
                sort: priceTypes.length + 1,
            };
            priceTypes.push(pt);
            return pt;
        },

        async updatePriceType(id, name) {
            const i = priceTypes.findIndex((p) => String(p.id) === String(id));
            priceTypes[i] = { ...priceTypes[i], name };
            return priceTypes[i];
        },

        async deletePriceType(id) {
            priceTypes = priceTypes.filter((p) => String(p.id) !== String(id));
            prices = prices.filter((pp) => String(pp.priceTypeId) !== String(id));
        },

        async listProductPrices(productId) {
            return prices.filter((pp) => String(pp.productId) === String(productId));
        },

        async setProductPrice(productId, priceTypeId, value) {
            const i = prices.findIndex(
                (pp) =>
                    String(pp.productId) === String(productId) &&
                    String(pp.priceTypeId) === String(priceTypeId)
            );
            if (value == null) {
                if (i >= 0) prices.splice(i, 1);
                return null;
            }
            if (i >= 0) {
                prices[i] = { ...prices[i], value };
                return prices[i];
            }
            const row = { id: Math.random(), productId, priceTypeId, value };
            prices.push(row);
            return row;
        },
    };
};
