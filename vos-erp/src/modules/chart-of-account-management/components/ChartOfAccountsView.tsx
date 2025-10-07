"use client";

import { useEffect, useMemo, useState } from "react";
import type { DataProvider } from "../providers/DataProvider";
import type { ChartOfAccount, UpsertChartOfAccountDTO } from "../types";
import { ChartOfAccountFormDialog } from "./ChartOfAccountFormDialog";

const PAGE_SIZE = 20;

export function ChartOfAccountsView({ provider }: { provider: DataProvider }) {
  const [items, setItems] = useState<ChartOfAccount[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [current, setCurrent] = useState<ChartOfAccount | null>(null);
  const [selected, setSelected] = useState<ChartOfAccount | null>(null);
  const [accountTypeNames, setAccountTypeNames] = useState<
    Record<string, string>
  >({});
  const [balanceTypeNames, setBalanceTypeNames] = useState<
    Record<string, string>
  >({});
  const [userNames, setUserNames] = useState<Record<string, string>>({});

  const totalPages = useMemo(() => Math.ceil(total / PAGE_SIZE), [total]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("http://100.119.3.44:8090/items/account_types");
        if (!res.ok) return;
        const json = await res.json();
        const rows: any[] = json?.data ?? [];
        const map: Record<string, string> = {};
        for (const r of rows) {
          const id = r.id;
          const name: string = r.account_name ?? String(id ?? "");
          if (id != null) map[String(id)] = name;
        }
        if (alive) setAccountTypeNames(map);
      } catch {
        // ignore errors
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("http://100.119.3.44:8090/items/balance_type");
        if (!res.ok) return;
        const json = await res.json();
        const rows: any[] = json?.data ?? [];
        const map: Record<string, string> = {};
        for (const r of rows) {
          const id = r.id;
          const name: string = r.balance_name ?? String(id ?? "");
          if (id != null) map[String(id)] = name;
        }
        if (alive) setBalanceTypeNames(map);
      } catch {
        // ignore errors
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("http://100.119.3.44:8090/items/user");
        if (!res.ok) return;
        const json = await res.json();
        const rows: any[] = json?.data ?? [];
        const map: Record<string, string> = {};
        for (const r of rows) {
          const id = r.user_id;
          const name: string = [r.user_fname, r.user_lname]
            .filter(Boolean)
            .join(" ") || String(id ?? "");
          if (id != null) map[String(id)] = name;
        }
        if (alive) setUserNames(map);
      } catch {
        // ignore errors
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  async function refresh() {
    const offset = (page - 1) * PAGE_SIZE;
    const { items, total } = await provider.listChartOfAccounts({
      q,
      limit: PAGE_SIZE,
      offset,
    });
    setItems(items);
    setTotal(total);
  }

  async function doFetch() {
    setLoading(true);
    setError(null);
    try {
      const offset = (page - 1) * PAGE_SIZE;
      const { items, total } = await provider.listChartOfAccounts({
        q,
        limit: PAGE_SIZE,
        offset,
      });
      setItems(items);
      setTotal(total);
    } catch (err: any) {
      setError(err.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    doFetch();
  }, [q, page]);

  function handleCreateClick() {
    setDialogMode("create");
    setCurrent(null);
    setDialogOpen(true);
  }

  function handleRowClick(item: ChartOfAccount) {
    setSelected(item);
  }

  function handleEditClick(item: ChartOfAccount) {
    setDialogMode("edit");
    setCurrent(item);
    setDialogOpen(true);
  }

  function displayAccountType(val: any): string {
    if (val === null || val === undefined || val === "") return "-";
    const key = String(val);
    return accountTypeNames[key] ?? String(val);
  }

  function displayBalanceType(val: any): string {
    if (val === null || val === undefined || val === "") return "-";
    const key = String(val);
    return balanceTypeNames[key] ?? String(val);
  }

  function displayUser(val: any): string {
    if (val === null || val === undefined || val === "") return "-";
    const key = String(val);
    return userNames[key] ?? String(val);
  }

  const pageCount = useMemo(() => {
    return Math.ceil(total / PAGE_SIZE);
  }, [total]);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">
          {selected ? "Account Details" : "Chart of Accounts"}
        </h2>
        {!selected ? (
          <button
            className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold"
            onClick={handleCreateClick}
          >
            + Add Account
          </button>
        ) : (
          <button
            className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold"
            onClick={() => setSelected(null)}
          >
            Back
          </button>
        )}
      </div>

      {!selected && (
        <input
          placeholder="Search by account title or GL code..."
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      )}

      {loading && (
        <div className="py-4 text-center text-sm text-gray-500">
          Loading...
        </div>
      )}

      {error && (
        <div className="py-4 text-center text-sm text-red-500">{error}</div>
      )}

      {!loading && !error && !selected && (
        <>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left p-3 font-medium">Account Title</th>
                  <th className="text-left p-3 font-medium">GL Code</th>
                  <th className="text-left p-3 font-medium">Account Type</th>
                  <th className="text-left p-3 font-medium">Balance Type</th>
                  <th className="text-left p-3 font-medium">Added By</th>
                  <th className="text-left p-3 font-medium">Date Added</th>
                  <th className="text-left p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    key={item.coa_id}
                    className="border-t hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleRowClick(item)}
                  >
                    <td className="p-3">{item.account_title}</td>
                    <td className="p-3">{item.gl_code}</td>
                    <td className="p-3">
                      {displayAccountType(item.account_type)}
                    </td>
                    <td className="p-3">{displayBalanceType(item.balance_type)}</td>
                    <td className="p-3">{displayUser(item.added_by)}</td>
                    <td className="p-3">
                      {new Date(item.date_added).toLocaleDateString()}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button
                          className="text-xs px-2 py-1 rounded border"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditClick(item);
                          }}
                        >
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-gray-500">
                      No accounts found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex justify-between items-center mt-4">
            <div>
              <p className="text-sm text-muted-foreground">
                Showing {items.length} of {total} items
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 rounded-lg border text-sm font-semibold disabled:opacity-50"
              >
                Previous
              </button>
              <div className="flex items-center gap-2">
                <span className="text-sm">
                  Page {page} of {pageCount}
                </span>
              </div>
              <button
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                disabled={page === pageCount}
                className="px-3 py-1 rounded-lg border text-sm font-semibold disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}

      {selected && (
        <div className="border rounded-lg overflow-hidden">
          <div className="p-4 space-y-4">
            <div>
              <h3 className="font-semibold">Account Title</h3>
              <p>{selected.account_title}</p>
            </div>
            <div>
              <h3 className="font-semibold">GL Code</h3>
              <p>{selected.gl_code}</p>
            </div>
            <div>
              <h3 className="font-semibold">Account Type</h3>
              <p>{displayAccountType(selected.account_type)}</p>
            </div>
            <div>
              <h3 className="font-semibold">Balance Type</h3>
              <p>{displayBalanceType(selected.balance_type)}</p>
            </div>
            <div>
              <h3 className="font-semibold">Added By</h3>
              <p>{displayUser(selected.added_by)}</p>
            </div>
            <div>
              <h3 className="font-semibold">Date Added</h3>
              <p>{new Date(selected.date_added).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      )}

      <ChartOfAccountFormDialog
        open={dialogOpen}
        mode={dialogMode}
        initial={current ?? undefined}
        onClose={() => setDialogOpen(false)}
        onSubmit={async (dto) => {
          if (dialogMode === "create") {
            await provider.createChartOfAccount(dto);
          } else if (current) {
            await provider.updateChartOfAccount(current.coa_id, dto);
          }
          await refresh();
          setDialogOpen(false);
        }}
      />
    </div>
  );
}
