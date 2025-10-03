// src/modules/salesman-management/components/SalesmanFormDialog.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import type { Salesman, UpsertSalesmanDTO } from "../types";
import { apiUrl, itemsUrl } from "../../../config/api";

export type Option = { value: string | number; label: string };

async function fetchOptionsSafe(endpoint: string): Promise<Option[]> {
  try {
    const res = await fetch(apiUrl(endpoint));
    if (!res.ok) return [];
    const json = await res.json();
    const rows: any[] = json?.data ?? [];
    return rows.map((r) => {
      const value =
        r.price_type_id ?? r.code ?? r.id ?? r.value ?? r.key ?? "";
      const label =
        r.price_type_name ?? r.name ?? r.label ?? r.salesman_name ?? String(value);
      return { value, label } as Option;
    });
  } catch {
    return [];
  }
}

// Branch options: ensure option.value is the branch ID
async function fetchBranchOptions(): Promise<Option[]> {
  try {
    const res = await fetch(apiUrl("items/branches"));
    if (!res.ok) return [];
    const json = await res.json();
    const rows: any[] = json?.data ?? [];
    return rows.map((r) => {
      const value = r.branch_id ?? r.id ?? r.branch_code ?? r.code ?? "";
      const label = r.branch_name ?? r.name ?? String(value);
      return { value, label } as Option;
    });
  } catch {
    return [];
  }
}

// Company options: ensure option.value is the company ID
async function fetchCompanyOptions(): Promise<Option[]> {
  try {
    const res = await fetch(apiUrl("items/company"));
    if (!res.ok) return [];
    const json = await res.json();
    const rows: any[] = json?.data ?? [];
    return rows.map((r) => {
      const value = r.company_id ?? r.id ?? r.company_code ?? r.code ?? "";
      const label = r.company_name ?? r.name ?? String(value);
      return { value, label } as Option;
    });
  } catch {
    return [];
  }
}

// Division options: ensure option.value is the division ID
async function fetchDivisionOptions(): Promise<Option[]> {
  try {
    const res = await fetch(apiUrl("items/division"));
    if (!res.ok) return [];
    const json = await res.json();
    const rows: any[] = json?.data ?? [];
    return rows.map((r) => {
      const value = r.division_id ?? r.id ?? "";
      const label = r.division_name ?? String(value);
      return { value, label } as Option;
    });
  } catch {
    return [];
  }
}

// Supplier options: ensure option.value is the supplier ID
async function fetchSupplierOptions(): Promise<Option[]> {
  try {
    const res = await fetch(apiUrl("items/suppliers"));
    if (!res.ok) return [];
    const json = await res.json();
    const rows: any[] = json?.data ?? [];
    return rows.map((r) => {
      const value = r.id;
      const label = r.supplier_name ?? String(value);
      return { value, label } as Option;
    });
  } catch {
    return [];
  }
}

// Specialized fetch for Users, building Option list and an ID->row map
// Attempts to filter by operation if provided (server may ignore this parameter)
export type UserRow = { user_id: number; user_fname?: string; user_lname?: string };

async function fetchUsersOptions(op?: string | number): Promise<{ options: Option[]; byId: Record<string, UserRow> }> {
  try {
    const url = new URL(itemsUrl("user"));
    if (op != null && op !== "") {
      url.searchParams.set("operation", String(op));
    }
    const res = await fetch(url.toString());
    if (!res.ok) return { options: [], byId: {} };
    const json = await res.json();
    const rows: UserRow[] = json?.data ?? [];
    const byId: Record<string, UserRow> = {};
    const options: Option[] = rows.map((u) => {
      const label = [u.user_fname ?? "", u.user_lname ?? ""].filter(Boolean).join(" ").trim() || String(u.user_id);
      byId[String(u.user_id)] = u;
      return { value: u.user_id, label } as Option;
    });
    return { options, byId };
  } catch {
    return { options: [], byId: {} };
  }
}

function truncateNameDisplay(full: string, max = 24): string {
  if (!full) return "";
  if (full.length <= max) return full;
  return full.slice(0, max - 1) + "…";
}

// Helpers to auto-generate next Salesman Code (SM-XXXX), always incrementing
function parseSalesmanCodeNumber(code: any): number {
  if (typeof code !== "string") return 0;
  const m = code.match(/SM-(\d+)/i);
  if (!m) return 0;
  const n = parseInt(m[1], 10);
  return Number.isFinite(n) ? n : 0;
}

async function generateNextSalesmanCode(): Promise<string> {
  try {
    const res = await fetch(itemsUrl("salesman"));
    if (!res.ok) return "SM-0001";
    const json = await res.json();
    const rows: any[] = json?.data ?? [];
    let max = 0;
    for (const r of rows) {
      const c = r.salesman_code ?? r.code ?? null;
      const num = parseSalesmanCodeNumber(c);
      if (num > max) max = num;
    }
    return `SM-${String(max + 1).padStart(4, "0")}`;
  } catch {
    return "SM-0001";
  }
}

function InputLabel({ children, required }: { children: any; required?: boolean }) {
  return (
    <div className="text-sm font-medium mb-1">
      {children}
      {required ? <span className="text-red-500"> *</span> : null}
    </div>
  );
}

function Help({ children }: { children: any }) {
  return <div className="text-xs text-gray-400 mt-1">{children}</div>;
}

export function SalesmanFormDialog({
  open,
  mode,
  initial,
  onClose,
  onSubmit,
}: {
  open: boolean;
  mode: "create" | "edit";
  initial?: Partial<Salesman>;
  onClose: () => void;
  onSubmit: (dto: UpsertSalesmanDTO) => Promise<void>;
}) {
  const [employee_id, setEmployeeId] = useState<number | "">(initial?.employee_id ?? "");
  const [code, setCode] = useState(initial?.code ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [truck_plate, setTruckPlate] = useState(initial?.truck_plate ?? "");
  const [branch_code, setBranchCode] = useState<string | number | "">(initial?.branch_code ?? "");
  const [division_id, setDivisionId] = useState<string | number | "">(initial?.division_id ?? "");
  const [operation, setOperation] = useState<string | number | "">(initial?.operation ?? "");
  const [company_code, setCompanyCode] = useState<string | number | "">(initial?.company_code ?? "");
  const [supplier_code, setSupplierCode] = useState<string | number | "">(initial?.supplier_code ?? "");
  const [price_type, setPriceType] = useState<string | number | "">(initial?.price_type ?? "");
  const [isActive, setIsActive] = useState<boolean>(initial?.isActive ?? true);

  // Encoder (current logged-in user)
  const [encoderId, setEncoderId] = useState<number | null>(null);
  const [encoderName, setEncoderName] = useState<string>("");

  const [branches, setBranches] = useState<Option[]>([]);
  const [operations, setOperations] = useState<Option[]>([]);
  const [companies, setCompanies] = useState<Option[]>([]);
  const [suppliers, setSuppliers] = useState<Option[]>([]);
  const [divisions, setDivisions] = useState<Option[]>([]);
  const [priceTypes, setPriceTypes] = useState<Option[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Users source for Salesman Name field
  const [users, setUsers] = useState<Option[]>([]);
  const [usersById, setUsersById] = useState<Record<string, any>>({});
  const [selectedUserId, setSelectedUserId] = useState<string | number | "">(initial?.employee_id ?? "");
  // Typeahead state for Salesman Name
  const [userQuery, setUserQuery] = useState("");
  const [showUserSuggestions, setShowUserSuggestions] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState<number>(-1);

  // When user changes, auto-fill employee_id and name
  useEffect(() => {
    if (selectedUserId === "") return;
    const u = usersById[String(selectedUserId)];
    if (u) {
      setEmployeeId(Number(selectedUserId));
      const full = `${u.user_fname ?? ""} ${u.user_lname ?? ""}`.trim();
      setName(full);
    }
  }, [selectedUserId, usersById]);

  const filteredUsers = useMemo(() => {
    const q = userQuery.trim().toLowerCase();
    if (!q) return users.slice(0, 20);
    return users.filter((o) => o.label.toLowerCase().includes(q)).slice(0, 20);
  }, [userQuery, users]);

  useEffect(() => {
    if (!open) return;
    // try to fetch lookups; ignore errors
    fetchBranchOptions().then(setBranches);
    fetchOptionsSafe("items/operation").then(setOperations);
    fetchCompanyOptions().then(setCompanies);
    fetchSupplierOptions().then(setSuppliers);
    fetchDivisionOptions().then(setDivisions);
    fetchOptionsSafe("items/price_types").then(setPriceTypes);
    fetchUsersOptions(operation).then(({ options, byId }) => {
      setUsers(options);
      setUsersById(byId);
    });
  }, [open, operation]);

  useEffect(() => {
    if (!open) return;
    // hydrate from initial when opening
    setEmployeeId(initial?.employee_id ?? "");
    setCode(initial?.code ?? "");
    setName(initial?.name ?? "");
    setTruckPlate(initial?.truck_plate ?? "");
    setBranchCode(initial?.branch_code ?? "");
    setDivisionId(initial?.division_id ?? "");
    setOperation(initial?.operation ?? "");
    setCompanyCode(initial?.company_code ?? "");
    setSupplierCode(initial?.supplier_code ?? "");
    setPriceType(initial?.price_type ?? "");
    setIsActive(initial?.isActive ?? true);
    setSelectedUserId(initial?.employee_id ?? "");
  }, [open, initial]);

  useEffect(() => {
    if (!open) return;
    if (selectedUserId !== "") {
      const sel = users.find((o) => String(o.value) === String(selectedUserId));
      setUserQuery(truncateNameDisplay(sel?.label ?? ""));
    } else {
      setUserQuery("");
    }
    setHighlightIndex(-1);
  }, [open, users, selectedUserId]);

  // Auto-generate Salesman Code when creating a new record
  useEffect(() => {
    if (!open || mode !== "create") return;
    generateNextSalesmanCode()
      .then((next) => setCode(next))
      .catch(() => setCode("SM-0001"));
  }, [open, mode]);

  // Fetch current logged-in user (encoder)
  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        if (!res.ok) return;
        const json = await res.json();
        const u = json?.user;
        if (u?.sub) {
          setEncoderId(Number(u.sub));
          setEncoderName(u.name || `User ${u.sub}`);
        }
      } catch {
        // ignore
      }
    })();
  }, [open]);

  const canSubmit = useMemo(() => {
    if (selectedUserId === "" || !code) return false;
    if (employee_id === "" || isNaN(Number(employee_id))) return false;
    return true;
  }, [selectedUserId, code, employee_id]);

  function clearForm() {
    setEmployeeId("");
    setCode("");
    setName("");
    setTruckPlate("");
    setBranchCode("");
    setDivisionId("");
    setOperation("");
    setCompanyCode("");
    setSupplierCode("");
    setPriceType("");
    setIsActive(true);
    setSelectedUserId("");
    setUserQuery("");
    setShowUserSuggestions(false);
    setHighlightIndex(-1);
  }

  async function handleSubmit() {
    if (!canSubmit) return;
    try {
      setSubmitting(true);
      const picked = selectedUserId === "" ? null : usersById[String(selectedUserId)];
      const fullName = picked ? `${picked.user_fname ?? ""} ${picked.user_lname ?? ""}`.trim() : name;
      const dto: UpsertSalesmanDTO = {
        employee_id: employee_id === "" ? (selectedUserId === "" ? null : Number(selectedUserId)) : Number(employee_id),
        encoder_id: mode === "create" ? (encoderId ?? undefined) : undefined,
        code: code || undefined,
        name: fullName,
        truck_plate: truck_plate || undefined,
        branch_code: branch_code === "" ? undefined : branch_code,
        division_id: division_id === "" ? undefined : division_id,
        operation: operation === "" ? undefined : operation,
        company_code: company_code === "" ? undefined : company_code,
        supplier_code: supplier_code === "" ? undefined : supplier_code,
        price_type: price_type === "" ? undefined : price_type,
        isActive,
      };
      await onSubmit(dto);
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-3xl rounded-xl bg-white shadow-xl border border-gray-200 p-5">
        <h3 className="text-lg font-semibold mb-4">
          {mode === "create" ? "Register New Salesman" : "Edit Salesman"}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <InputLabel required>Employee ID</InputLabel>
            <input
              value={employee_id}
              onChange={(e) => setEmployeeId(e.target.value === "" ? "" : Number(e.target.value))}
              placeholder="12345"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              inputMode="numeric"
            />
            <Help>Required numeric</Help>
          </div>


          <div className="relative">
            <InputLabel required>Salesman Name (User)</InputLabel>
            <input
              value={userQuery}
              onChange={(e) => {
                setUserQuery(e.target.value);
                setShowUserSuggestions(true);
                setHighlightIndex(-1);
                setSelectedUserId("");
              }}
              onFocus={() => setShowUserSuggestions(true)}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setHighlightIndex((i) => Math.min(i + 1, filteredUsers.length - 1));
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setHighlightIndex((i) => Math.max(i - 1, 0));
                } else if (e.key === "Enter") {
                  if (highlightIndex >= 0 && filteredUsers[highlightIndex]) {
                    const o = filteredUsers[highlightIndex];
                    setSelectedUserId(o.value as any);
                    setUserQuery(truncateNameDisplay(o.label));
                    setShowUserSuggestions(false);
                  }
                } else if (e.key === "Escape") {
                  setShowUserSuggestions(false);
                }
              }}
              onBlur={() => setTimeout(() => setShowUserSuggestions(false), 100)}
              placeholder="Type to search users…"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white"
            />
            {showUserSuggestions && filteredUsers.length > 0 && (
              <div className="absolute z-20 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow">
                {filteredUsers.map((o, idx) => (
                  <div
                    key={String(o.value)}
                    className={`px-3 py-2 text-sm cursor-pointer ${idx === highlightIndex ? "bg-gray-100" : ""}`}
                    onMouseDown={() => {
                      setSelectedUserId(o.value as any);
                      setUserQuery(truncateNameDisplay(o.label));
                      setShowUserSuggestions(false);
                    }}
                  >
                    {truncateNameDisplay(o.label)}
                  </div>
                ))}
              </div>
            )}
            <Help>Start typing to search users; label is truncated for display only.</Help>
          </div>

          <div>
            <InputLabel required>Salesman Code</InputLabel>
            <input
              value={code ?? ""}
              onChange={(e) => setCode(e.target.value)}
              placeholder="SM-0001"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              readOnly={mode === "create"}
              title={mode === "create" ? "Auto-generated on create" : undefined}
            />
            <Help>{mode === "create" ? "Auto-generated (next available)." : "Unique code."}</Help>
          </div>

          <div>
            <InputLabel>Truck Plate</InputLabel>
            <input
              value={truck_plate ?? ""}
              onChange={(e) => setTruckPlate(e.target.value)}
              placeholder="ABC-1234"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <InputLabel>Branch</InputLabel>
            <select
              value={branch_code === "" ? "" : String(branch_code)}
              onChange={(e) => setBranchCode(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white"
            >
              <option value="">Select a branch</option>
              {branches.map((o) => (
                <option key={String(o.value)} value={String(o.value)}>
                  {o.label}
                </option>
              ))}
            </select>
            <Help>From branches API</Help>
          </div>

          <div>
            <InputLabel>Division</InputLabel>
            <select
              value={division_id === "" ? "" : String(division_id)}
              onChange={(e) => setDivisionId(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white"
            >
              <option value="">Select a division</option>
              {divisions.map((o) => (
                <option key={String(o.value)} value={String(o.value)}>
                  {o.label}
                </option>
              ))}
            </select>
            <Help>From division API</Help>
          </div>

          <div>
            <InputLabel>Operation</InputLabel>
            <select
              value={operation === "" ? "" : String(operation)}
              onChange={(e) => setOperation(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white"
            >
              <option value="">Select an operation</option>
              {operations.map((o) => (
                <option key={String(o.value)} value={String(o.value)}>
                  {o.label}
                </option>
              ))}
            </select>
            <Help>From operation API</Help>
          </div>

          <div>
            <InputLabel>Company</InputLabel>
            <select
              value={company_code === "" ? "" : String(company_code)}
              onChange={(e) => setCompanyCode(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white"
            >
              <option value="">Select a company</option>
              {companies.map((o) => (
                <option key={String(o.value)} value={String(o.value)}>
                  {o.label}
                </option>
              ))}
            </select>
            <Help>From company API</Help>
          </div>

          <div>
            <InputLabel>Supplier</InputLabel>
            <select
              value={supplier_code === "" ? "" : String(supplier_code)}
              onChange={(e) => setSupplierCode(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white"
            >
              <option value="">Select a supplier</option>
              {suppliers.map((o) => (
                <option key={String(o.value)} value={String(o.value)}>
                  {o.label}
                </option>
              ))}
            </select>
            <Help>From suppliers API</Help>
          </div>

          <div>
            <InputLabel>Price Type</InputLabel>
            <select
              value={price_type === "" ? "" : String(price_type)}
              onChange={(e) => setPriceType(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white"
            >
              <option value="">Select a price type</option>
              {priceTypes.map((o) => (
                <option key={String(o.value)} value={String(o.value)}>
                  {o.label}
                </option>
              ))}
            </select>
            <Help>From price_types API</Help>
          </div>

          <div className="col-span-1 md:col-span-2 mt-2">
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              Active
              <span className="text-red-500"> *</span>
            </label>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-2 rounded-lg border text-sm"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              className="px-3 py-2 rounded-lg border text-sm"
              onClick={clearForm}
              disabled={submitting}
            >
              Clear
            </button>
          </div>
          <div className="flex items-center gap-3">
            <div
              className="text-xs text-gray-500"
              title="Encoder is automatically set to the logged-in user"
            >
              Encoder:{" "}
              <span className="font-medium">
                {encoderName ? encoderName : "—"}
                {encoderId != null ? ` (ID: ${encoderId})` : ""}
              </span>
            </div>
            <button
              className="px-4 py-2 rounded-lg bg-black text-white text-sm disabled:opacity-50"
              disabled={!canSubmit || submitting}
              onClick={handleSubmit}
            >
              {mode === "create" ? "Register Salesman" : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
