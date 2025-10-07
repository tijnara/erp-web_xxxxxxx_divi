"use client";

import { useEffect, useMemo, useState } from "react";
import type { ChartOfAccount, UpsertChartOfAccountDTO } from "../types";

type User = {
  sub: string;
  name: string;
};

function InputLabel({ children, required }: { children: any; required?: boolean }) {
  return (
    <div className="text-sm font-medium mb-1">
      {children}
      {required ? <span className="text-red-500"> *</span> : null}
    </div>
  );
}

export function ChartOfAccountFormDialog({
  open,
  mode,
  initial,
  onClose,
  onSubmit,
}: {
  open: boolean;
  mode: "create" | "edit";
  initial?: Partial<ChartOfAccount>;
  onClose: () => void;
  onSubmit: (dto: UpsertChartOfAccountDTO) => Promise<void>;
}) {
  const [gl_code, setGlCode] = useState(initial?.gl_code ?? "");
  const [account_title, setAccountTitle] = useState(initial?.account_title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [account_type, setAccountType] = useState<number | undefined>(initial?.account_type);
  const [balance_type, setBalanceType] = useState<number | undefined>(initial?.balance_type);
  const [bsis_code, setBsisCode] = useState<number | undefined>(initial?.bsis_code);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [accountTypes, setAccountTypes] = useState<{ id: number; account_name: string }[]>([]);
  const [balanceTypes, setBalanceTypes] = useState<{ id: number; balance_name: string }[]>([]);
  const [bsisTypes, setBsisTypes] = useState<{ id: number; bsis_code: string; bsis_name: string }[]>([]);

  useEffect(() => {
    async function fetchAccountTypes() {
      try {
        const response = await fetch("http://100.119.3.44:8090/items/account_types");
        const data = await response.json();
        setAccountTypes(data.data);
      } catch (error) {
        console.error("Failed to fetch account types", error);
      }
    }
    async function fetchBalanceTypes() {
      try {
        const response = await fetch("http://100.119.3.44:8090/items/balance_type");
        const data = await response.json();
        setBalanceTypes(data.data);
      } catch (error) {
        console.error("Failed to fetch balance types", error);
      }
    }
    async function fetchBsisTypes() {
      try {
        const response = await fetch("http://100.119.3.44:8090/items/bsis_types");
        const data = await response.json();
        setBsisTypes(data.data);
      } catch (error) {
        console.error("Failed to fetch bsis types", error);
      }
    }
    async function fetchCurrentUser() {
      try {
        const response = await fetch("/api/auth/me");
        const data = await response.json();
        if (data.ok) {
          setCurrentUser(data.user);
        }
      } catch (error) {
        console.error("Failed to fetch current user", error);
      }
    }
    fetchAccountTypes();
    fetchBalanceTypes();
    fetchBsisTypes();
    fetchCurrentUser();
  }, []);

  const canSubmit = useMemo(() => {
    return account_title.trim().length > 0 && account_type !== undefined && balance_type !== undefined && bsis_code !== undefined;
  }, [account_title, account_type, balance_type, bsis_code]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    await onSubmit({
      gl_code,
      account_title,
      description,
      account_type,
      balance_type,
      bsis_code,
      added_by: currentUser ? Number(currentUser.sub) : undefined,
    });
  }

  // Reset form when initial data changes
  useEffect(() => {
    setGlCode(initial?.gl_code ?? "");
    setAccountTitle(initial?.account_title ?? "");
    setDescription(initial?.description ?? "");
    setAccountType(initial?.account_type);
    setBalanceType(initial?.balance_type);
    setBsisCode(initial?.bsis_code);
  }, [initial]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">{mode === "create" ? "Add New Account" : "Edit Account"}</h2>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-4 space-y-4">
            <div>
              <InputLabel required>Account Title</InputLabel>
              <input
                type="text"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                value={account_title}
                onChange={(e) => setAccountTitle(e.target.value)}
              />
            </div>
            <div>
              <InputLabel required>BS/IS Type</InputLabel>
              <select
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                value={bsis_code ?? ""}
                onChange={(e) => setBsisCode(Number(e.target.value))}
              >
                <option value="" disabled>
                  Select a BS/IS type
                </option>
                {bsisTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.bsis_code}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <InputLabel required>Account Type</InputLabel>
              <select
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                value={account_type ?? ""}
                onChange={(e) => setAccountType(Number(e.target.value))}
              >
                <option value="" disabled>
                  Select an account type
                </option>
                {accountTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.account_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <InputLabel required>Balance Type</InputLabel>
              <select
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                value={balance_type ?? ""}
                onChange={(e) => setBalanceType(Number(e.target.value))}
              >
                <option value="" disabled>
                  Select a balance type
                </option>
                {balanceTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.balance_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <InputLabel>GL Code</InputLabel>
              <input
                type="text"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                value={gl_code}
                onChange={(e) => setGlCode(e.target.value)}
              />
            </div>
            <div>
              <InputLabel>Description</InputLabel>
              <textarea
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div>
              <InputLabel>Added By</InputLabel>
              <input
                type="text"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-gray-100"
                value={currentUser?.name ?? "Loading..."}
                readOnly
              />
            </div>
          </div>
          <div className="p-4 border-t flex justify-end gap-2">
            <button type="button" className="px-3 py-2 rounded-lg border text-sm font-semibold" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
              disabled={!canSubmit}
            >
              {mode === "create" ? "Create" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
