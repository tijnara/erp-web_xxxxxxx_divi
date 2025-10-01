// src/modules/product-management/components/HeaderTabs.tsx
"use client";

export function HeaderTabs({
                               tab,
                               onChange,
                           }: {
    tab: "products" | "pricing" | "types";
    onChange: (t: "products" | "pricing" | "types") => void;
}) {
    const btn = (key: typeof tab, label: string) => (
        <button
            key={key}
            onClick={() => onChange(key)}
            className={`px-4 py-2 rounded-full text-sm border ${
                tab === key
                    ? "bg-black text-white border-black"
                    : "bg-white hover:bg-gray-50 border-gray-200"
            }`}
        >
            {label}
        </button>
    );

    return (
        <div className="flex items-center gap-2 bg-gray-100 rounded-full p-1 w-fit">
            {btn("products", "Products")}
            {btn("pricing", "Pricing")}
            {btn("types", "Price Types")}
        </div>
    );
}
