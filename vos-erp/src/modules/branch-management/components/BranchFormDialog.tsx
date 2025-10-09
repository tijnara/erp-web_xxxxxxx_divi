// src/modules/branch-management/components/BranchFormDialog.tsx
"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";

export function BranchFormDialog({
  open,
  mode,
  initial,
  onClose,
  onSubmit,
}: {
  open: boolean;
  mode: "create" | "edit";
  initial?: Partial<any>;
  onClose: () => void;
  onSubmit: (dto: any) => Promise<void>;
}) {
  const [branch_name, setBranchName] = useState(initial?.branch_name ?? "");
  const [branch_description, setBranchDescription] = useState(initial?.branch_description ?? "");
  const [branch_head, setBranchHead] = useState(initial?.branch_head ?? "");
  const [branch_code, setBranchCode] = useState(initial?.branch_code ?? "");
  const [state_province, setStateProvince] = useState(initial?.state_province ?? "");
  const [city, setCity] = useState(initial?.city ?? "");
  const [brgy, setBrgy] = useState(initial?.brgy ?? "");
  const [phone_number, setPhoneNumber] = useState(initial?.phone_number ?? "");
  const [postal_code, setPostalCode] = useState(initial?.postal_code ?? "");
  const [isMoving, setIsMoving] = useState(initial?.isMoving ?? 0);
  const [isReturn, setIsReturn] = useState(initial?.isReturn ?? 0);
  const [isActive, setIsActive] = useState(initial?.isActive ?? 1);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setBranchName(initial?.branch_name ?? "");
    setBranchDescription(initial?.branch_description ?? "");
    setBranchHead(initial?.branch_head ?? "");
    setBranchCode(initial?.branch_code ?? "");
    setStateProvince(initial?.state_province ?? "");
    setCity(initial?.city ?? "");
    setBrgy(initial?.brgy ?? "");
    setPhoneNumber(initial?.phone_number ?? "");
    setPostalCode(initial?.postal_code ?? "");
    setIsMoving(initial?.isMoving ?? 0);
    setIsReturn(initial?.isReturn ?? 0);
    setIsActive(initial?.isActive ?? 1);
  }, [open, initial]);

  async function handleSubmit() {
    setSubmitting(true);
    try {
      await onSubmit({
        branch_name,
        branch_description,
        branch_head,
        branch_code,
        state_province,
        city,
        brgy,
        phone_number,
        postal_code,
        isMoving,
        isReturn,
        isActive,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} title={mode === "create" ? "Register New Branch" : "Edit Branch"}>
      <form
        className="space-y-4"
        onSubmit={e => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        <input type="text" placeholder="Branch Name" value={branch_name} onChange={e => setBranchName(e.target.value)} className="block w-full border rounded px-4 py-2" required />
        <input type="text" placeholder="Branch Description" value={branch_description} onChange={e => setBranchDescription(e.target.value)} className="block w-full border rounded px-4 py-2" />
        <input type="text" placeholder="Branch Head" value={branch_head} onChange={e => setBranchHead(e.target.value)} className="block w-full border rounded px-4 py-2" />
        <input type="text" placeholder="Branch Code" value={branch_code} onChange={e => setBranchCode(e.target.value)} className="block w-full border rounded px-4 py-2" required />
        <input type="text" placeholder="State/Province" value={state_province} onChange={e => setStateProvince(e.target.value)} className="block w-full border rounded px-4 py-2" />
        <input type="text" placeholder="City" value={city} onChange={e => setCity(e.target.value)} className="block w-full border rounded px-4 py-2" />
        <input type="text" placeholder="Barangay" value={brgy} onChange={e => setBrgy(e.target.value)} className="block w-full border rounded px-4 py-2" />
        <input type="text" placeholder="Phone Number" value={phone_number} onChange={e => setPhoneNumber(e.target.value)} className="block w-full border rounded px-4 py-2" />
        <input type="text" placeholder="Postal Code" value={postal_code} onChange={e => setPostalCode(e.target.value)} className="block w-full border rounded px-4 py-2" />
        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={!!isMoving} onChange={e => setIsMoving(e.target.checked ? 1 : 0)} /> Moving
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={!!isReturn} onChange={e => setIsReturn(e.target.checked ? 1 : 0)} /> Return
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={!!isActive} onChange={e => setIsActive(e.target.checked ? 1 : 0)} /> Active
          </label>
        </div>
        <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded" disabled={submitting}>
          {submitting ? "Saving..." : mode === "create" ? "Register Branch" : "Save Changes"}
        </button>
      </form>
    </Modal>
  );
}

