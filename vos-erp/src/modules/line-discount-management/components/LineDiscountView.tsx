"use client";

import { useEffect, useMemo, useState } from "react";
import type { LineDiscount } from "../types";
import { StatBar } from "./StatBar";
import { LineDiscountFormDialog } from "./LineDiscountFormDialog";

export function LineDiscountView({ provider }: { provider: ReturnType<typeof import("../providers/fetchProvider").fetchProvider> }) {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<LineDiscount[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 20;

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [current, setCurrent] = useState<LineDiscount | null>(null);

  async function refresh() {
    const offset = (page - 1) * limit;
    const { items, total } = await provider.listLineDiscounts({ q, limit, offset });
    setRows(items);
    setTotal(total);
  }

  useEffect(() => {
    let alive = true;
    const offset = (page - 1) * limit;
    provider.listLineDiscounts({ q, limit, offset }).then(({ items, total }: { items: LineDiscount[], total: number }) => {
      if (!alive) return;
      setRows(items);
      setTotal(total);
    });
    return () => {
      alive = false;
    };
  }, [q, page, provider, limit]);

  const totalPages = useMemo(() => Math.ceil(total / limit), [total, limit]);

  const stats = useMemo(() => {
    return { total } as any;
  }, [total]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Line Discounts</h2>
        <button
          className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold"
          onClick={() => {
            setMode("create");
            setCurrent(null);
            setOpen(true);
          }}
        >
          + Add Line Discount
        </button>
      </div>

      <input
        type="text"
        placeholder="Search by name, shortcut, or contact person..."
        className="w-full px-3 py-2 border rounded-lg"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      <StatBar stats={stats} />

      <div className="border rounded-lg">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="p-3 text-left">Line Discount</th>
              <th className="p-3 text-left">Percentage</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b">
                <td className="p-3">{row.line_discount}</td>
                <td className="p-3">{row.percentage}</td>
                <td className="p-3">
                  <button
                    className="px-3 py-1 rounded-lg border text-sm"
                    onClick={() => {
                      setMode("edit");
                      setCurrent(row);
                      setOpen(true);
                    }}
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex justify-between items-center p-3">
          <div>
            Page {page} of {totalPages} ({total} items)
          </div>
          <div className="flex gap-2">
            <button
              className="px-3 py-1 rounded-lg border"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </button>
            <button
              className="px-3 py-1 rounded-lg border"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>
      <LineDiscountFormDialog
        key={current?.id}
        open={open}
        setOpen={setOpen}
        mode={mode}
        current={current}
        provider={provider}
        onSuccess={refresh}
      />
    </div>
  );
}
