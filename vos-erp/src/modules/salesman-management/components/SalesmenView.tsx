// src/modules/salesman-management/components/SalesmenView.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import type { DataProvider } from "../providers/DataProvider";
import type { Salesman } from "../types";
import { StatBar } from "./StatBar";
import { SalesmanFormDialog } from "./SalesmanFormDialog";
import { apiUrl } from "@/config/api";

export function SalesmenView({ provider }: { provider: DataProvider }) {
    const [q, setQ] = useState("");
    const [rows, setRows] = useState<Salesman[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const limit = 20;

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
    // Price type name lookup map (id -> price_type_name)
    const [priceTypeNames, setPriceTypeNames] = useState<Record<string, string>>({});
    // User name lookup map (user_id -> full name) for Encoder display
    const [userNames, setUserNames] = useState<Record<string, string>>({});

    const totalPages = useMemo(() => Math.ceil(total / limit), [total, limit]);

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

    // Load price types once to resolve price_type_name from numeric values
    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                const res = await fetch(apiUrl("items/price_types"));
                if (!res.ok) return;
                const json = await res.json();
                const rows: any[] = json?.data ?? [];
                const map: Record<string, string> = {};
                for (const r of rows) {
                    const id = r.price_type_id ?? r.id;
                    const name: string = r.price_type_name ?? r.name ?? String(id ?? "");
                    if (id != null) map[String(id)] = name;
                }
                if (alive) setPriceTypeNames(map);
            } catch {
                // ignore errors; fallback to showing raw value
            }
        })();
        return () => {
            alive = false;
        };
    }, []);

    // Load users once to resolve encoder name from numeric values
    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                const res = await fetch(apiUrl("items/user"));
                if (!res.ok) return;
                const json = await res.json();
                const rows: any[] = json?.data ?? [];
                const map: Record<string, string> = {};
                for (const u of rows) {
                    const id = u.user_id ?? u.id;
                    if (id != null) {
                        const name: string = [u.user_fname, u.user_lname].filter(Boolean).join(" ").trim() || u.user_email || String(id);
                        map[String(id)] = name;
                    }
                }
                if (alive) setUserNames(map);
            } catch {
                // ignore errors; fallback to showing raw value
            }
        })();
        return () => {
            alive = false;
        };
    }, []);

    async function refresh() {
        const offset = (page - 1) * limit;
        const { items, total } = await provider.listSalesmen({ q, limit, offset });
        setRows(items);
        setTotal(total);
    }

    useEffect(() => {
        let alive = true;
        const offset = (page - 1) * limit;
        provider.listSalesmen({ q, limit, offset }).then(({ items, total }) => {
            if (!alive) return;
            setRows(items);
            setTotal(total);
        });
        return () => {
            alive = false;
        };
    }, [q, page, provider]);

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

    function displayPriceType(val: any): string {
        if (val === null || val === undefined || val === "") return "-";
        const key = String(val);
        return priceTypeNames[key] ?? String(val);
    }

    function displayEncoder(val: any): string {
        if (val === null || val === undefined || val === "") return "-";
        const key = String(val);
        const name = userNames[key];
        return name ? `${name} (ID: ${key})` : String(val);
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Salesmen</h2>
                <button
                    className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold"
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
                                <th className="text-left p-3 font-medium">Salesman Name</th>
                                <th className="text-left p-3 font-medium">Salesman Code</th>
                                <th className="text-left p-3 font-medium">Branch</th>
                                <th className="text-left p-3 font-medium">Status</th>
                                <th className="text-left p-3 font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((r) => (
                                <tr
                                    key={r.id}
                                    className="border-t hover:bg-gray-50 cursor-pointer"
                                    onClick={() => setSelected(r)}
                                >
                                    <td className="p-3">{r.name}</td>
                                    <td className="p-3">{r.code ?? "-"}</td>
                                    <td className="p-3">{displayBranch(r.branch_code)}</td>
                                    <td className="p-3">
                                        <span
                                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                                                r.isActive
                                                    ? "bg-green-100 text-green-800"
                                                    : "bg-red-100 text-red-800"
                                            }`}
                                        >
                                            {r.isActive ? "Active" : "Inactive"}
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
                                    <td colSpan={5} className="p-6 text-center text-gray-500">
                                        No salesmen found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                    <div className="flex justify-between items-center p-3 border-t">
                        <div className="text-sm text-gray-500">
                            Page {page} of {totalPages} ({total} items)
                        </div>
                        <div className="flex gap-2">
                            <button
                                className="text-sm px-3 py-1 rounded border disabled:opacity-50"
                                disabled={page <= 1}
                                onClick={() => setPage(p => p - 1)}
                            >
                                Previous
                            </button>
                            <button
                                className="text-sm px-3 py-1 rounded border disabled:opacity-50"
                                disabled={page >= totalPages}
                                onClick={() => setPage(p => p + 1)}
                            >
                                Next
                            </button>
                        </div>
                    </div>
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
                            <tr className="border-t"><td className="p-3 font-medium text-gray-600">Price Type</td><td className="p-3">{displayPriceType(selected.price_type)}</td></tr>
                            <tr className="border-t"><td className="p-3 font-medium text-gray-600">Active</td><td className="p-3">{selected.isActive !== false ? "Yes" : "No"}</td></tr>
                            <tr className="border-t"><td className="p-3 font-medium text-gray-600">Encoder</td><td className="p-3">{displayEncoder(selected.encoder_id)}</td></tr>
                            <tr className="border-t"><td className="p-3 font-medium text-gray-600">Modified Date</td><td className="p-3">{selected.hireDate ?? "-"}</td></tr>
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
