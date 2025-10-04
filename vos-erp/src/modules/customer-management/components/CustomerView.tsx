// src/modules/customer-management/components/CustomerView.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import type { Customer } from "../types";
import { StatBar } from "./StatBar";
import { CustomerFormDialog } from "./CustomerFormDialog";

export function CustomerView({ provider }: { provider: ReturnType<typeof import("../providers/fetchProvider").fetchProvider> }) {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 20;

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [current, setCurrent] = useState<Customer | null>(null);
  const [selected, setSelected] = useState<Customer | null>(null);
  const [storeTypes, setStoreTypes] = useState<{ id: number; store_type: string }[]>([]);
  const [discountTypes, setDiscountTypes] = useState<{ id: number; discount_type: string }[]>([]);
  const [users, setUsers] = useState<{ user_id: number; user_fname: string; user_lname: string }[]>([]);

  const totalPages = useMemo(() => Math.ceil(total / limit), [total, limit]);

  async function refresh() {
    const offset = (page - 1) * limit;
    const { items, total } = await provider.listCustomers({ q, limit, offset });
    setRows(items);
    setTotal(total);
  }

  useEffect(() => {
    let alive = true;
    const offset = (page - 1) * limit;
    provider.listCustomers({ q, limit, offset }).then(({ items, total }) => {
      if (!alive) return;
      setRows(items);
      setTotal(total);
    });
    provider.listStoreTypes().then((types) => {
      if (alive) setStoreTypes(types);
    });
    provider.listDiscountTypes().then((types) => {
      if (alive) setDiscountTypes(types);
    });
    provider.listUsers().then((userItems) => {
      if (alive) setUsers(userItems);
    });
    return () => {
      alive = false;
    };
  }, [q, page, provider]);

  const storeTypeMap = useMemo(() => {
    return storeTypes.reduce((acc, type) => {
      acc[type.id] = type.store_type;
      return acc;
    }, {} as Record<number, string>);
  }, [storeTypes]);

  const discountTypeMap = useMemo(() => {
    return discountTypes.reduce((acc, type) => {
      acc[type.id] = type.discount_type;
      return acc;
    }, {} as Record<number, string>);
  }, [discountTypes]);

  const userMap = useMemo(() => {
    return users.reduce((acc, user) => {
      const fullName = [user.user_fname, user.user_lname].filter(Boolean).join(" ");
      acc[user.user_id] = fullName || `User ${user.user_id}`;
      return acc;
    }, {} as Record<number, string>);
  }, [users]);

  const stats = useMemo(() => {
    const active = rows.filter((r) => (r.isActive ?? 0) === 1).length;
    const inactive = rows.length - active;
    const provinces = new Set(rows.map((r) => r.province ?? "-")).size;
    return { total, active, inactive, provinces } as any;
  }, [rows, total]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Customers</h2>
        <button
          className="px-3 py-2 rounded-lg bg-black text-white text-sm"
          onClick={() => {
            setMode("create");
            setCurrent(null);
            setOpen(true);
          }}
        >
          + Add Customer
        </button>
      </div>

      {!selected && (
        <input
          placeholder="Search by code, name, store, contact, city/province…"
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
                <th className="text-left p-3">Customer Name</th>
                <th className="text-left p-3">Store</th>
                <th className="text-left p-3">City/Province</th>
                <th className="text-left p-3">Contact</th>
                <th className="text-left p-3">Active</th>
                <th className="text-left p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t hover:bg-gray-50 cursor-pointer" onClick={() => setSelected(r)}>
                  <td className="p-3">{r.customer_code}</td>
                  <td className="p-3">{r.customer_name}</td>
                  <td className="p-3">{r.store_name}</td>
                  <td className="p-3">{[r.city, r.province].filter(Boolean).join(", ") || "-"}</td>
                  <td className="p-3">{r.contact_number ?? "-"}</td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${(r.isActive ?? 0) === 1 ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"}`}>
                      {(r.isActive ?? 0) === 1 ? "Yes" : "No"}
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
                  <td colSpan={7} className="p-6 text-center text-gray-500">No customers found.</td>
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
            <div className="font-medium">Customer Details</div>
            <div className="flex gap-2">
              <button className="text-xs px-2 py-1 rounded border" onClick={() => setSelected(null)}>Back to list</button>
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
              <tr className="border-t"><td className="p-3 font-medium text-gray-600">Code</td><td className="p-3">{selected.customer_code}</td></tr>
              <tr className="border-t"><td className="p-3 font-medium text-gray-600">Name</td><td className="p-3">{selected.customer_name}</td></tr>
              <tr className="border-t"><td className="p-3 font-medium text-gray-600">Store</td><td className="p-3">{selected.store_name} ({selected.store_signage})</td></tr>
              <tr className="border-t"><td className="p-3 font-medium text-gray-600">Address</td><td className="p-3">{[selected.brgy, selected.city, selected.province].filter(Boolean).join(", ") || "-"}</td></tr>
              <tr className="border-t"><td className="p-3 font-medium text-gray-600">Contact</td><td className="p-3">{selected.contact_number ?? "-"}</td></tr>
              <tr className="border-t"><td className="p-3 font-medium text-gray-600">Email</td><td className="p-3">{selected.customer_email ?? "-"}</td></tr>
              <tr className="border-t"><td className="p-3 font-medium text-gray-600">Store Type</td><td className="p-3">{storeTypeMap[selected.store_type] ?? selected.store_type ?? "-"}</td></tr>
              <tr className="border-t"><td className="p-3 font-medium text-gray-600">Discount Type</td><td className="p-3">{selected.discount_type ? discountTypeMap[selected.discount_type] ?? selected.discount_type : "-"}</td></tr>
              <tr className="border-t"><td className="p-3 font-medium text-gray-600">Encoder</td><td className="p-3">{userMap[selected.encoder_id] ?? selected.encoder_id ?? "-"}</td></tr>
              <tr className="border-t"><td className="p-3 font-medium text-gray-600">Active</td><td className="p-3">{(selected.isActive ?? 0) === 1 ? "Yes" : "No"}</td></tr>
            </tbody>
          </table>
        </div>
      )}

      <StatBar stats={stats as any} />

      <CustomerFormDialog
        open={open}
        mode={mode}
        initial={current ?? undefined}
        onClose={() => setOpen(false)}
        onSubmit={async (dto) => {
          if (mode === "create") {
            await provider.createCustomer(dto);
          } else if (current) {
            await provider.updateCustomer(current.id, dto);
          }
          await refresh();
          if (selected) {
            try {
              const latest = await provider.getCustomer(selected.id);
              setSelected(latest);
            } catch {}
          }
        }}
      />
    </div>
  );
}
