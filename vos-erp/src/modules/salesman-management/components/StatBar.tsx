// src/modules/salesman-management/components/StatBar.tsx
"use client";

export function StatBar({
    stats,
}: {
    stats: { total: number; active: number; inactive: number; territories: number };
}) {
    const Item = ({
        label,
        value,
        tone,
    }: {
        label: string;
        value: number;
        tone: string;
    }) => (
        <div className="flex items-baseline gap-2">
            <div className={`text-${tone}-600 text-xl font-semibold`}>{value}</div>
            <div className="text-xs text-gray-500">{label}</div>
        </div>
    );

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-4">
            <Item label="Total Salesmen" value={stats.total} tone="blue" />
            <Item label="Active" value={stats.active} tone="green" />
            <Item label="Inactive" value={stats.inactive} tone="gray" />
            <Item label="Territories" value={stats.territories} tone="amber" />
        </div>
    );
}
