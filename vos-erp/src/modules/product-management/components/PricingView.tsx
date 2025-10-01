// src/modules/product-management/components/PricingView.tsx
"use client";

import { useEffect, useState } from "react";
import type { DataProvider } from "../providers/DataProvider";
import type { PriceType, Product, ProductPrice } from "../types";

export function PricingView({
                                provider,
                                priceTypesPreloaded,
                            }: {
    provider: DataProvider;
    priceTypesPreloaded?: boolean;
}) {
    const [products, setProducts] = useState<Product[]>([]);
    const [priceTypes, setPriceTypes] = useState<PriceType[]>([]);
    const [pricesByProduct, setPricesByProduct] = useState<Record<string, ProductPrice[]>>({});

    useEffect(() => {
        provider.listProducts({ limit: 100 }).then(({ items }) => setProducts(items));
        provider.listPriceTypes().then(setPriceTypes);
    }, [provider, priceTypesPreloaded]);

    useEffect(() => {
        (async () => {
            const map: Record<string, ProductPrice[]> = {};
            for (const p of products) {
                map[String(p.id)] = await provider.listProductPrices(p.id);
            }
            setPricesByProduct(map);
        })();
    }, [products, provider]);

    const valueFor = (pid: Product["id"], ptid: PriceType["id"]) =>
        pricesByProduct[String(pid)]?.find((pp) => String(pp.priceTypeId) === String(ptid))?.value ??
        null;

    return (
        <div className="space-y-4">
            <h2 className="text-lg font-semibold">Product Pricing Management</h2>
            {products.map((p) => (
                <div key={p.id} className="border rounded-xl p-4 space-y-2">
                    <div className="text-sm text-gray-500">Code: {p.code ?? "-"}</div>
                    <div className="font-medium">{p.name}</div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-2">
                        {priceTypes.map((pt) => (
                            <div key={pt.id} className="border rounded-lg p-3 bg-gray-50">
                                <div className="text-xs text-gray-500">{pt.name}</div>
                                <div className="text-xl font-semibold">
                                    {valueFor(p.id, pt.id) == null
                                        ? "$.--"
                                        : `$${valueFor(p.id, pt.id)!.toFixed(2)}`}
                                </div>
                                <button
                                    className="mt-2 text-xs border px-2 py-1 rounded"
                                    onClick={async () => {
                                        const input = prompt(
                                            `Set ${pt.name} price for "${p.name}" (blank to clear)`,
                                            String(valueFor(p.id, pt.id) ?? "")
                                        );
                                        if (input === null) return;
                                        const val = input.trim() === "" ? null : Number(input);
                                        await provider.setProductPrice(p.id, pt.id, val);
                                        const list = await provider.listProductPrices(p.id);
                                        setPricesByProduct((s) => ({ ...s, [String(p.id)]: list }));
                                    }}
                                >
                                    {valueFor(p.id, pt.id) == null ? "Set" : "Change"}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
            {products.length === 0 && (
                <div className="p-6 text-center text-gray-500 border rounded-xl">
                    No products yet.
                </div>
            )}
        </div>
    );
}
