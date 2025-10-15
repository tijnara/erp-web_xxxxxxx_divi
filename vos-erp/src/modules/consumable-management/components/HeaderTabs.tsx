// src/modules/consumables-management/components/HeaderTabs.tsx
"use client";

interface HeaderTabsProps {
    tab: "consumables" | "categories" | "suppliers";
    onChange: (tab: "consumables" | "categories" | "suppliers") => void;
}

export function HeaderTabs({ tab, onChange }: HeaderTabsProps) {
    const btn = (key: typeof tab, label: string) => (
        <button
            key={key}
            onClick={() => onChange(key)}
            className={`px-4 py-2 rounded-full text-sm border transition-colors ${
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
            {btn("consumables", "Consumables")}
            {btn("categories", "Categories")}
        </div>
    );
}
