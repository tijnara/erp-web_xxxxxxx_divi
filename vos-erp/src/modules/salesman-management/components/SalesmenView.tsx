// src/modules/salesman-management/components/SalesmenView.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import type { DataProvider } from "../providers/DataProvider";
import type { Salesman } from "../types";
import { StatBar } from "./StatBar";
import { SalesmanFormDialog } from "./SalesmanFormDialog";
import { apiUrl } from "../../../config/api";

export function SalesmenView({ provider }: { provider: DataProvider }) {
    const [q, setQ] = useState("");
    const [rows, setRows] = useState<Salesman[]>([]);
    const [total, setTotal] = useState(0);

    const [open, setOpen] = useState(false);
    const [mode, setMode] = useState<"create" | "edit">("create");
    const [current, setCurrent] = useState<Salesman | null>(null);
    const [selected, setSelected] = useState<Salesman | null>(null);

    // Branch name lookup map (id/code -> branch_name)
    const [branchNames, setBranchNames] = useState<Record<string, string>>({});
    // Operation name lookup map (id -> operation_name)
    const [operationNames, setOperationNames] = useState<Record<string, string>>({});
    // Company name lookup map (id/code -> company_name)
    const [companyNames, setCompanyNames] = useState<Record<string, string>>({});

    // Load branches once to resolve branch_name from numeric/code values
    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                const res = await fetch(apiUrl("items/branches"));
                if (!res.ok) return;
                const json = await res.json();
                const rows: any[] = json?.data ?? [];
                const map: Record<string, string> = {};
                for (const r of rows) {
                    const name: string = r.branch_name ?? r.branch_description ?? String(r.id ?? r.branch_code ?? "");
                    if (r.id != null) map[String(r.id)] = name;
                    if (r.branch_code != null) map[String(r.branch_code)] = name;
                }
                if (alive) setBranchNames(map);
            } catch {
                // ignore errors; fallback to showing raw value
            }
        })();
        return () => {
            alive = false;
        };
    }, []);

    // Load operations once to resolve operation_name from numeric values
    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                const res = await fetch(apiUrl("items/operation"));
                if (!res.ok) return;
                const json = await res.json();
                const rows: any[] = json?.data ?? [];
                const map: Record<string, string> = {};
                for (const r of rows) {
                    const id = r.id ?? r.operation_id ?? r.code;
                    const name: string = r.operation_name ?? r.name ?? r.operation_code ?? String(id ?? "");
                    if (id != null) map[String(id)] = name;
                }
                if (alive) setOperationNames(map);
            } catch {
                // ignore errors; fallback to showing raw value
            }
        })();
        return () => {
            alive = false;
        };
    }, []);

    // Load companies once to resolve company_name from numeric/code values
    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                const res = await fetch(apiUrl("items/company"));
                if (!res.ok) return;
                const json = await res.json();
                const rows: any[] = json?.data ?? [];
                const map: Record<string, string> = {};
                for (const r of rows) {
                    const name: string = r.company_name ?? String(r.company_id ?? r.company_code ?? "");
                    if (r.company_id != null) map[String(r.company_id)] = name;
                    if (r.company_code != null) map[String(r.company_code)] = name;
                }
                if (alive) setCompanyNames(map);
            } catch {
                // ignore errors; fallback to showing raw value
            }
        })();
        return () => {
            alive = false;
        };
    }, []);

    async function refresh() {
        const { items, total } = await provider.listSalesmen({ q, limit: 100 });
        setRows(items);
        setTotal(total);
    }

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

    function displayBranch(val: any): string {
        if (val === null || val === undefined || val === "") return "-";
        const key = String(val);
        return branchNames[key] ?? String(val);
    }

    function displayOperation(val: any): string {
        if (val === null || val === undefined || val === "") return "-";
        const key = String(val);
        return operationNames[key] ?? String(val);
    }

    function displayCompany(val: any): string {
        if (val === null || val === undefined || val === "") return "-";
        const key = String(val);
        return companyNames[key] ?? String(val);
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Salesmen</h2>
                <button
                    className="px-3 py-2 rounded-lg bg-black text-white text-sm"
                    onClick={() => {
                        setMode("create");
                        setCurrent(null);
                        setOpen(true);
                    }}
                >
                    + Add Salesman
                </button>
            </div>

            {!selected && (
                <input
                    placeholder="Search by name, code, email, phone, or territory…"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                />
            )}

            {!selected ? (
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
                                <tr
                                    key={r.id}
                                    className="border-t hover:bg-gray-50 cursor-pointer"
                                    onClick={() => setSelected(r)}
                                >
                                    <td className="p-3">{r.code ?? "-"}</td>
                                    <td className="p-3">{r.name}</td>
                                    <td className="p-3">{r.truck_plate ?? "-"}</td>
                                    <td className="p-3">{displayBranch(r.branch_code ?? r.territory)}</td>
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
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setMode("edit");
                                                    setCurrent(r);
                                                    setOpen(true);
                                                }}
                                            >
                                                Edit
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
            ) : (
                <div className="overflow-hidden border border-gray-200 rounded-xl">
                    <div className="flex items-center justify-between p-3 bg-gray-50 border-b">
                        <div className="font-medium">Salesman Details</div>
                        <div className="flex gap-2">
                            <button
                                className="text-xs px-2 py-1 rounded border"
                                onClick={() => setSelected(null)}
                            >
                                Back to list
                            </button>
                            <button
                                className="text-xs px-2 py-1 rounded border"
                                onClick={() => {
                                    setMode("edit");
                                    setCurrent(selected);
                                    setOpen(true);
                                }}
                            >
                                Edit
                            </button>
                        </div>
                    </div>
                    <table className="w-full text-sm">
                        <tbody>
                            <tr className="border-t"><td className="p-3 font-medium text-gray-600">Code</td><td className="p-3">{selected.code ?? "-"}</td></tr>
                            <tr className="border-t"><td className="p-3 font-medium text-gray-600">Name</td><td className="p-3">{selected.name ?? "-"}</td></tr>
                            <tr className="border-t"><td className="p-3 font-medium text-gray-600">Employee ID</td><td className="p-3">{selected.employee_id ?? "-"}</td></tr>
                            <tr className="border-t"><td className="p-3 font-medium text-gray-600">Truck Plate</td><td className="p-3">{selected.truck_plate ?? "-"}</td></tr>
                            <tr className="border-t"><td className="p-3 font-medium text-gray-600">Branch</td><td className="p-3">{displayBranch(selected.branch_code ?? selected.territory)}</td></tr>
                            <tr className="border-t"><td className="p-3 font-medium text-gray-600">Operation</td><td className="p-3">{displayOperation(selected.operation)}</td></tr>
                            <tr className="border-t"><td className="p-3 font-medium text-gray-600">Company</td><td className="p-3">{displayCompany(selected.company_code)}</td></tr>
                            <tr className="border-t"><td className="p-3 font-medium text-gray-600">Price Type</td><td className="p-3">{selected.price_type ?? "-"}</td></tr>
                            <tr className="border-t"><td className="p-3 font-medium text-gray-600">Active</td><td className="p-3">{selected.isActive !== false ? "Yes" : "No"}</td></tr>
                            <tr className="border-t"><td className="p-3 font-medium text-gray-600">Modified Date</td><td className="p-3">{selected.hireDate ?? "-"}</td></tr>
                            <tr className="border-t"><td className="p-3 font-medium text-gray-600">Territory</td><td className="p-3">{selected.territory ?? "-"}</td></tr>
                            <tr className="border-t"><td className="p-3 font-medium text-gray-600">ID</td><td className="p-3">{String(selected.id)}</td></tr>
                        </tbody>
                    </table>
                </div>
            )}

            <StatBar stats={stats} />

            <SalesmanFormDialog
                open={open}
                mode={mode}
                initial={current ?? undefined}
                onClose={() => setOpen(false)}
                onSubmit={async (dto) => {
                    if (mode === "create") {
                        await provider.createSalesman(dto);
                    } else if (current) {
                        await provider.updateSalesman(current.id, dto);
                    }
                    await refresh();
                    if (selected) {
                        try {
                            const latest = await provider.getSalesman(selected.id);
                            setSelected(latest);
                        } catch (e) {
                            // ignore
                        }
                    }
                }}
            />
        </div>
    );
}
