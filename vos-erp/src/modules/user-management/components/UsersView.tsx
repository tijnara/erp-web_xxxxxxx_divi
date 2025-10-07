"use client";

import { useEffect, useMemo, useState } from "react";
import type { DataProvider } from "../providers/DataProvider";
import type { User } from "../types";
import { UserFormDialog } from "./UserFormDialog";

type Department = { department_id: number; department_name: string };

export function UsersView({ provider }: { provider: DataProvider }) {
    const [q, setQ] = useState("");
    const [rows, setRows] = useState<User[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const limit = 20;

    const [open, setOpen] = useState(false);
    const [mode, setMode] = useState<"create" | "edit">("create");
    const [current, setCurrent] = useState<User | null>(null);
    const [selected, setSelected] = useState<User | null>(null);
    const [departments, setDepartments] = useState<Department[]>([]);

    const totalPages = useMemo(() => Math.ceil(total / limit), [total, limit]);

    async function refresh() {
        const offset = (page - 1) * limit;
        const { items, total } = await provider.listUsers({ q, limit, offset });
        setRows(items);
        setTotal(total);
    }

    useEffect(() => {
        let alive = true;
        const offset = (page - 1) * limit;
        provider.listUsers({ q, limit, offset }).then(({ items, total }) => {
            if (!alive) return;
            setRows(items);
            setTotal(total);
        });
        fetch("http://100.119.3.44:8090/items/department")
        .then((res) => res.json())
        .then((data) => {
          if(alive) setDepartments(data.data);
        });
        return () => {
            alive = false;
        };
    }, [q, page, provider]);

    function displayFullName(user: User): string {
        return [user.user_fname, user.user_mname, user.user_lname].filter(Boolean).join(" ");
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Users</h2>
                <button
                    className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold"
                    onClick={() => {
                        setMode("create");
                        setCurrent(null);
                        setOpen(true);
                    }}
                >
                    + Add User
                </button>
            </div>

            {!selected && (
                <input
                    placeholder="Search by name or email..."
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
                                <th className="text-left p-3 font-medium">User Name</th>
                                <th className="text-left p-3 font-medium">Email Address</th>
                                <th className="text-left p-3 font-medium">Contact Info</th>
                                <th className="text-left p-3 font-medium">Position</th>
                                <th className="text-left p-3 font-medium">Status</th>
                                <th className="text-left p-3 font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((r) => (
                                <tr
                                    key={r.user_id}
                                    className="border-b border-gray-200 hover:bg-gray-50 cursor-pointer"
                                    onClick={() => setSelected(r)}
                                >
                                    <td className="p-3">{displayFullName(r)}</td>
                                    <td className="p-3">{r.user_email}</td>
                                    <td className="p-3">
                                        <div>{r.user_contact}</div>
                                        <div>{r.user_email}</div>
                                    </td>
                                    <td className="p-3">
                                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                            {r.user_position}
                                        </span>
                                    </td>
                                    <td className="p-3">
                                        <span
                                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                                                !r.isDeleted
                                                    ? "bg-green-100 text-green-800"
                                                    : "bg-red-100 text-red-800"
                                            }`}
                                        >
                                            {!r.isDeleted ? "Active" : "Inactive"}
                                        </span>
                                    </td>
                                    <td className="p-3">
                                        <div className="flex items-center space-x-2">
                                            <button
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
                                onClick={() => setPage((p) => p - 1)}
                            >
                                Previous
                            </button>
                            <button
                                className="text-sm px-3 py-1 rounded border disabled:opacity-50"
                                disabled={page >= totalPages}
                                onClick={() => setPage((p) => p + 1)}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="overflow-hidden border border-gray-200 rounded-xl">
                    <div className="flex items-center justify-between p-3 bg-gray-50 border-b">
                        <div className="font-medium">User Details</div>
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
                            <tr className="border-t"><td className="p-3 font-medium text-gray-600">Full Name</td><td className="p-3">{displayFullName(selected)}</td></tr>
                            <tr className="border-t"><td className="p-3 font-medium text-gray-600">Email</td><td className="p-3">{selected.user_email}</td></tr>
                            <tr className="border-t"><td className="p-3 font-medium text-gray-600">Contact</td><td className="p-3">{selected.user_contact ?? "-"}</td></tr>
                            <tr className="border-t"><td className="p-3 font-medium text-gray-600">Address</td><td className="p-3">{[selected.user_brgy, selected.user_city, selected.user_province].filter(Boolean).join(", ") || "-"}</td></tr>
                            <tr className="border-t"><td className="p-3 font-medium text-gray-600">Birthday</td><td className="p-3">{selected.user_bday ?? "-"}</td></tr>
                            <tr className="border-t"><td className="p-3 font-medium text-gray-600">Position</td><td className="p-3">{selected.user_position ?? "-"}</td></tr>
                            <tr className="border-t"><td className="p-3 font-medium text-gray-600">Department</td><td className="p-3">{departments.find(d => d.department_id === selected.user_department)?.department_name ?? selected.user_department ?? "-"}</td></tr>
                            <tr className="border-t"><td className="p-3 font-medium text-gray-600">Date of Hire</td><td className="p-3">{selected.user_dateOfHire ?? "-"}</td></tr>
                            <tr className="border-t"><td className="p-3 font-medium text-gray-600">SSS</td><td className="p-3">{selected.user_sss ?? "-"}</td></tr>
                            <tr className="border-t"><td className="p-3 font-medium text-gray-600">PhilHealth</td><td className="p-3">{selected.user_philhealth ?? "-"}</td></tr>
                            <tr className="border-t"><td className="p-3 font-medium text-gray-600">TIN</td><td className="p-3">{selected.user_tin ?? "-"}</td></tr>
                            <tr className="border-t"><td className="p-3 font-medium text-gray-600">RF ID</td><td className="p-3">{selected.rf_id ?? "-"}</td></tr>
                            <tr className="border-t"><td className="p-3 font-medium text-gray-600">Is Admin</td><td className="p-3">{selected.isAdmin ? "Yes" : "No"}</td></tr>
                        </tbody>
                    </table>
                </div>
            )}

            <UserFormDialog
                open={open}
                mode={mode}
                initial={current ?? undefined}
                onClose={() => setOpen(false)}
                onSubmit={async (dto) => {
                    if (mode === "create") {
                        await provider.createUser(dto);
                    } else if (current) {
                        await provider.updateUser(current.user_id, dto);
                    }
                    await refresh();
                    if (selected) {
                        try {
                            const latest = await provider.getUser(selected.user_id);
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
