// src/modules/salesman-management/components/SalesmenView.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import type { DataProvider } from "../providers/DataProvider";
import type { Salesman } from "../types";
import { StatBar } from "./StatBar";

export function SalesmenView({ provider }: { provider: DataProvider }) {
    const [q, setQ] = useState("");
    const [rows, setRows] = useState<Salesman[]>([]);
    const [total, setTotal] = useState(0);

    useEffect(() => {
        let alive = true;
        provider.listSalesmen({ q, limit: 100 }).then(({ items, total }) => {
            if (!alive) return;
            setRows(items);
            setTotal(total);
        });
        return () => {
            alive = false;
        };
    }, [q, provider]);

    const stats = useMemo(() => {
        const active = rows.filter((r) => r.isActive !== false).length;
        const inactive = rows.length - active;
        const territories = new Set(rows.map((r) => r.territory ?? "-")).size;
        return { total, active, inactive, territories };
    }, [rows, total]);

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Salesmen</h2>
                <button
                    className="px-3 py-2 rounded-lg bg-black text-white text-sm"
                    onClick={async () => {
                        const name = prompt("Salesman name");
                        if (!name) return;
                        const code = prompt("Code (optional)") || undefined;
                        await provider.createSalesman({ name, code });
                        const { items, total } = await provider.listSalesmen({ q, limit: 100 });
                        setRows(items);
                        setTotal(total);
                    }}
                >
                    + Add Salesman
                </button>
            </div>

            <input
                placeholder="Search by name, code, email, phone, or territory…"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                value={q}
                onChange={(e) => setQ(e.target.value)}
            />

            <div className="overflow-hidden border border-gray-200 rounded-xl">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-600">
                        <tr>
                            <th className="text-left p-3">Code</th>
                            <th className="text-left p-3">Name</th>
                            <th className="text-left p-3">Truck Plate</th>
                            <th className="text-left p-3">Branch</th>
                            <th className="text-left p-3">Active</th>
                            <th className="text-left p-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((r) => (
                            <tr key={r.id} className="border-t">
                                <td className="p-3">{r.code ?? "-"}</td>
                                <td className="p-3">{r.name}</td>
                                <td className="p-3">{r.truck_plate ?? "-"}</td>
                                <td className="p-3">{r.branch_code ?? r.territory ?? "-"}</td>
                                <td className="p-3">
                                    <span
                                        className={`text-xs px-2 py-1 rounded-full ${
                                            r.isActive !== false
                                                ? "bg-blue-600 text-white"
                                                : "bg-gray-200 text-gray-700"
                                        }`}
                                    >
                                        {r.isActive !== false ? "Yes" : "No"}
                                    </span>
                                </td>
                                <td className="p-3">
                                    <div className="flex gap-2">
                                        <button
                                            className="text-xs px-2 py-1 rounded border"
                                            onClick={async () => {
                                                const name = prompt("New name", r.name);
                                                if (!name) return;
                                                await provider.updateSalesman(r.id, { name });
                                                const { items } = await provider.listSalesmen({ q, limit: 100 });
                                                setRows(items);
                                            }}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            className="text-xs px-2 py-1 rounded border border-red-300 text-red-600"
                                            onClick={async () => {
                                                if (!confirm("Delete salesman?")) return;
                                                await provider.deleteSalesman(r.id);
                                                const { items, total } = await provider.listSalesmen({ q, limit: 100 });
                                                setRows(items);
                                                setTotal(total);
                                            }}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {rows.length === 0 && (
                            <tr>
                                <td colSpan={6} className="p-6 text-center text-gray-500">
                                    No salesmen found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <StatBar stats={stats} />
        </div>
    );
}
