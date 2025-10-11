// src/modules/branch-management/components/BranchFormDialog.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { Modal } from "@/components/ui/Modal";
import Select from "react-select";
import provinces from "@/data/province.json";
import cities from "@/data/city.json";
import barangays from "@/data/barangay.json";
import { API_BASE_URL } from "@/config/api";

interface Province {
  province_code: string;
  province_name: string;
}

interface City {
  city_code: string;
  city_name: string;
  province_code: string;
}

interface Barangay {
  brgy_code: string;
  brgy_name: string;
  city_code: string;
}

interface User {
  user_id: number;
  user_fname: string;
  user_mname: string;
  user_lname: string;
}

export function BranchFormDialog({
  open,
  mode,
  initial,
  onCloseAction,
  onSubmitAction,
}: {
  open: boolean;
  mode: "create" | "edit";
  initial?: Partial<any>;
  onCloseAction: () => void;
  onSubmitAction: (dto: any) => Promise<void>;
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
  const [users, setUsers] = useState<User[]>([]);

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

    async function fetchUsers() {
      try {
        const response = await fetch(`${API_BASE_URL}/items/user`);
        const data = await response.json();
        setUsers(data.data);
      } catch (error) {
        console.error("Failed to fetch users:", error);
      }
    }
    fetchUsers();
  }, [open, initial]);

  async function handleSubmit() {
    setSubmitting(true);
    try {
      await onSubmitAction({
        branch_name,
        branch_description,
        branch_head: Number(branch_head),
        branch_code,
        state_province, // now province_name
        city,           // now city_name
        brgy,           // now brgy_name
        phone_number,
        postal_code,
        isMoving,
        isReturn,
        isActive,
      });
      onCloseAction();
    } finally {
      setSubmitting(false);
    }
  }

  const provinceOptions = (provinces as Province[]).map(province => ({
    value: province.province_name, // use name as value
    code: province.province_code,
    label: province.province_name
  }));

  const cityOptions = useMemo(() => {
    if (!state_province) return [];
    // Find province_code by province_name
    const selectedProvince = (provinces as Province[]).find(p => p.province_name === state_province);
    if (!selectedProvince) return [];
    return (cities as City[])
      .filter(city => city.province_code === selectedProvince.province_code)
      .map(city => ({ value: city.city_name, code: city.city_code, label: city.city_name }));
  }, [state_province]);

  const barangayOptions = useMemo(() => {
    if (!city) return [];
    // Find city_code by city_name
    const selectedCity = (cities as City[]).find(c => c.city_name === city);
    if (!selectedCity) return [];
    return (barangays as Barangay[])
      .filter(b => b.city_code === selectedCity.city_code)
      .map(b => ({ value: b.brgy_name, code: b.brgy_code, label: b.brgy_name }));
  }, [city]);

  const userOptions = useMemo(() => {
    return users.map(user => ({
      value: user.user_id.toString(),
      label: `${user.user_fname} ${user.user_mname} ${user.user_lname}`
    }));
  }, [users]);

  // Reset city and barangay when province/city changes
  useEffect(() => {
    setCity("");
    setBrgy("");
  }, [state_province]);
  useEffect(() => {
    setBrgy("");
  }, [city]);

  if (!open) return null;

  return (
    <Modal open={open} onClose={onCloseAction} title={mode === "create" ? "Register New Branch" : "Edit Branch"}>
      <form
        className="space-y-4"
        onSubmit={e => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        <input type="text" placeholder="Branch Name" value={branch_name} onChange={e => setBranchName(e.target.value)} className="block w-full border rounded px-4 py-2" required />
        <input type="text" placeholder="Branch Description" value={branch_description} onChange={e => setBranchDescription(e.target.value)} className="block w-full border rounded px-4 py-2" />
        <Select
          options={userOptions}
          value={userOptions.find(option => option.value === branch_head)}
          onChange={selectedOption => setBranchHead(selectedOption?.value || "")}
          placeholder="Select Branch Head"
          className="block w-full border rounded px-4 py-2"
        />
        <input type="text" placeholder="Branch Code" value={branch_code} onChange={e => setBranchCode(e.target.value)} className="block w-full border rounded px-4 py-2" required />
        <Select
          options={provinceOptions}
          value={provinceOptions.find(option => option.value === state_province)}
          onChange={selectedOption => setStateProvince(selectedOption?.value || "")}
          placeholder="Select State/Province"
          className="block w-full border rounded px-4 py-2"
        />
        <Select
          options={cityOptions}
          value={cityOptions.find(option => option.value === city)}
          onChange={selectedOption => setCity(selectedOption?.value || "")}
          placeholder="Select City"
          className="block w-full border rounded px-4 py-2"
          isDisabled={!state_province}
        />
        <Select
          options={barangayOptions}
          value={barangayOptions.find(option => option.value === brgy)}
          onChange={selectedOption => setBrgy(selectedOption?.value || "")}
          placeholder="Select Barangay"
          className="block w-full border rounded px-4 py-2"
          isDisabled={!city}
        />
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
