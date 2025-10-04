"use client";

import { useEffect, useMemo, useState } from "react";
import type { User, UpsertUserDTO } from "../types";
import { apiUrl } from "../../../config/api";

type Province = { province_code: string; province_name: string; region_code?: string; psgc_code?: string };
type City = { city_code: string; city_name: string; province_code: string; region_desc?: string; psgc_code?: string };
type Barangay = { brgy_code: string; brgy_name: string; city_code: string; province_code?: string; region_code?: string };
type Department = { department_id: number; department_name: string };

export type Option = { value: string | number; label: string };

async function fetchOptionsSafe(endpoint: string): Promise<Option[]> {
  try {
    const res = await fetch(apiUrl(endpoint));
    if (!res.ok) return [];
    const json = await res.json();
    const rows: any[] = json?.data ?? [];
    return rows.map((r) => {
      const value = r.id ?? r.value ?? r.key ?? "";
      const label = r.name ?? r.label ?? String(value);
      return { value, label } as Option;
    });
  } catch {
    return [];
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

export function UserFormDialog({
  open,
  mode,
  initial,
  onClose,
  onSubmit,
}: {
  open: boolean;
  mode: "create" | "edit";
  initial?: Partial<User>;
  onClose: () => void;
  onSubmit: (dto: UpsertUserDTO) => Promise<void>;
}) {
  const [user_fname, setFname] = useState(initial?.user_fname ?? "");
  const [user_mname, setMname] = useState(initial?.user_mname ?? "");
  const [user_lname, setLname] = useState(initial?.user_lname ?? "");
  const [user_email, setEmail] = useState(initial?.user_email ?? "");
  const [user_password, setPassword] = useState("");
  const [user_contact, setContact] = useState(initial?.user_contact ?? "");
  const [user_position, setPosition] = useState(initial?.user_position ?? "");
  const [isAdmin, setIsAdmin] = useState(initial?.isAdmin ?? 0);
  const [user_province, setProvince] = useState(initial?.user_province ?? "");
  const [user_city, setCity] = useState(initial?.user_city ?? "");
  const [user_brgy, setBrgy] = useState(initial?.user_brgy ?? "");
  const [user_department, setDepartment] = useState(initial?.user_department);
  const [user_sss, setSss] = useState(initial?.user_sss ?? "");
  const [user_philhealth, setPhilhealth] = useState(
    initial?.user_philhealth ?? ""
  );
  const [user_tin, setTin] = useState(initial?.user_tin ?? "");
  const [user_dateOfHire, setDateOfHire] = useState(
    initial?.user_dateOfHire ?? ""
  );
  const [user_bday, setBday] = useState(initial?.user_bday ?? "");
  const [rf_id, setRfId] = useState(initial?.rf_id ?? "");

  const [submitting, setSubmitting] = useState(false);

  const [departments, setDepartments] = useState<Department[]>([]);

  // Codes used for filtering/cascading
  const [provinceCode, setProvinceCode] = useState<string>("");
  const [cityCode, setCityCode] = useState<string>("");

  // Local geographic datasets
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [barangays, setBarangays] = useState<Barangay[]>([]);
  const [loadingGeo, setLoadingGeo] = useState<boolean>(false);

  // Derived filtered lists
  const provinceOptions = useMemo(() => {
    return [...provinces].sort((a, b) => a.province_name.localeCompare(b.province_name));
  }, [provinces]);

  const cityOptions = useMemo(() => {
    const filtered = provinceCode ? cities.filter((c) => c.province_code === provinceCode) : cities;
    return filtered.sort((a, b) => a.city_name.localeCompare(b.city_name));
  }, [cities, provinceCode]);

  const barangayOptions = useMemo(() => {
    const filtered = cityCode ? barangays.filter((b) => b.city_code === cityCode) : [];
    return filtered.sort((a, b) => a.brgy_name.localeCompare(b.brgy_name));
  }, [barangays, cityCode]);

    // Helper: find codes by names (case-insensitive)
    function findProvinceCodeByName(name?: string | null): string {
      if (!name) return "";
      const n = String(name).trim().toLowerCase();
      return provinces.find((p) => p.province_name.trim().toLowerCase() === n)?.province_code || "";
    }
    function findCityCodeByName(name?: string | null, provCode?: string): string {
      if (!name) return "";
      const n = String(name).trim().toLowerCase();
      const list = provCode ? cities.filter((c) => c.province_code === provCode) : cities;
      return list.find((c) => c.city_name.trim().toLowerCase() === n)?.city_code || "";
    }

  useEffect(() => {
    if (!open) return;
    // hydrate from initial when opening
    setFname(initial?.user_fname ?? "");
    setMname(initial?.user_mname ?? "");
    setLname(initial?.user_lname ?? "");
    setEmail(initial?.user_email ?? "");
    setPassword(""); // Always clear password for security
    setContact(initial?.user_contact ?? "");
    setPosition(initial?.user_position ?? "");
    setIsAdmin(initial?.isAdmin ?? 0);
    setProvince(initial?.user_province ?? "");
    setCity(initial?.user_city ?? "");
    setBrgy(initial?.user_brgy ?? "");
    setDepartment(initial?.user_department);
    setSss(initial?.user_sss ?? "");
    setPhilhealth(initial?.user_philhealth ?? "");
    setTin(initial?.user_tin ?? "");
    setDateOfHire(initial?.user_dateOfHire ?? "");
    setBday(initial?.user_bday ?? "");
    setRfId(initial?.rf_id ?? "");

    fetch("http://100.119.3.44:8090/items/department")
    .then((res) => res.json())
    .then((data) => {
      setDepartments(data.data);
    });

        // Lazy-load local geographic JSONs only when dialog is open
        (async () => {
          setLoadingGeo(true);
          try {
            const provMod = await import("../../../../data/province.json");
            const cityMod = await import("../../../../data/city.json");
            const brgyMod = await import("../../../../data/barangay.json");
            const provArr: Province[] = (provMod as any).default ?? (provMod as any);
            const cityArr: City[] = (cityMod as any).default ?? (cityMod as any);
            const brgyArr: Barangay[] = (brgyMod as any).default ?? (brgyMod as any);
            setProvinces(provArr);
            setCities(cityArr);
            setBarangays(brgyArr);

            // Derive codes from existing text (if any)
            const pCode = findProvinceCodeByName(initial?.user_province ?? "");
            setProvinceCode(pCode);
            const cCode = findCityCodeByName(initial?.user_city ?? "", pCode);
            setCityCode(cCode);
            if (cCode) {
              const c = cityArr.find((x) => x.city_code === cCode);
              if (c) setCity(c.city_name);
            }
          } catch (e) {
            // Fallback: keep empty lists if JSON not available
            setProvinces([]);
            setCities([]);
            setBarangays([]);
            setProvinceCode("");
            setCityCode("");
          } finally {
            setLoadingGeo(false);
          }
        })();
  }, [open, initial]);

  // When province code changes, clear dependent fields
  useEffect(() => {
    if (loadingGeo) return; // avoid clearing during initial bootstrap
    setCityCode("");
    setCity("");
    setBrgy("");
  }, [provinceCode, loadingGeo]);

  // When city code changes, clear barangay text
  useEffect(() => {
    if (loadingGeo) return; // avoid clearing during initial bootstrap
    setBrgy("");
  }, [cityCode, loadingGeo]);

  const canSubmit = useMemo(() => {
    return (
      user_fname &&
      user_mname &&
      user_lname &&
      user_email &&
      (mode === "edit" || user_password) &&
      user_contact &&
      user_dateOfHire &&
      user_bday
    );
  }, [
    user_fname,
    user_mname,
    user_lname,
    user_email,
    user_password,
    mode,
    user_contact,
    user_dateOfHire,
    user_bday,
  ]);

  async function handleSubmit() {
    if (!canSubmit) return;
    try {
      setSubmitting(true);
      const dto: UpsertUserDTO = {
        user_fname,
        user_mname: user_mname || undefined,
        user_lname,
        user_email,
        user_password: user_password || undefined,
        user_contact: user_contact || undefined,
        user_position: user_position || undefined,
        isAdmin: isAdmin,
        user_province: user_province || undefined,
        user_city: user_city || undefined,
        user_brgy: user_brgy || undefined,
        user_department: user_department,
        user_sss: user_sss || undefined,
        user_philhealth: user_philhealth || undefined,
        user_tin: user_tin || undefined,
        user_dateOfHire: user_dateOfHire || undefined,
        user_bday: user_bday || undefined,
        rf_id: rf_id || undefined,
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
      <div className="relative w-full max-w-2xl rounded-xl bg-white shadow-xl border border-gray-200 p-5">
        <h3 className="text-lg font-semibold mb-4">
          {mode === "create" ? "Create New User" : "Edit User"}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <InputLabel required>First Name</InputLabel>
            <input
              value={user_fname}
              onChange={(e) => setFname(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <InputLabel required>Middle Name</InputLabel>
            <input
              value={user_mname}
              onChange={(e) => setMname(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <InputLabel required>Last Name</InputLabel>
            <input
              value={user_lname}
              onChange={(e) => setLname(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <InputLabel required>Email</InputLabel>
            <input
              type="email"
              value={user_email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <InputLabel required={mode === "create"}>Password</InputLabel>
            <input
              type="password"
              value={user_password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={
                mode === "edit" ? "Leave blank to keep unchanged" : ""
              }
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <InputLabel required>Contact Number</InputLabel>
            <input
              value={user_contact}
              onChange={(e) => setContact(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <InputLabel>Province</InputLabel>
            <select
              className="w-full rounded-lg border border-gray-200 px-3 py-2"
              value={provinceCode}
              onChange={(e) => {
                const code = e.target.value;
                setProvinceCode(code);
                const p = provinceOptions.find((x) => x.province_code === code);
                setProvince(p ? p.province_name : "");
              }}
            >
              <option value="">Select a Province</option>
              {provinceOptions.map((p, i) => (
                <option key={`${p.province_code}-${i}`} value={p.province_code}>{p.province_name}</option>
              ))}
            </select>
          </div>
          <div>
            <InputLabel>City</InputLabel>
            <select
              className="w-full rounded-lg border border-gray-200 px-3 py-2"
              value={cityCode}
              onChange={(e) => {
                const code = e.target.value;
                setCityCode(code);
                const c = cityOptions.find((x) => x.city_code === code);
                setCity(c ? c.city_name : "");
              }}
              disabled={!provinceCode}
            >
              <option value="">{provinceCode ? "Select a City / Municipality" : "Select province first"}</option>
              {cityOptions.map((c, i) => (
                <option key={`${c.city_code}-${i}`} value={c.city_code}>{c.city_name}</option>
              ))}
            </select>
          </div>
          <div>
            <InputLabel>Barangay</InputLabel>
            <select
              className="w-full rounded-lg border border-gray-200 px-3 py-2"
              value={user_brgy || ""}
              onChange={(e) => {
                const name = e.target.value;
                setBrgy(name);
              }}
              disabled={!cityCode}
            >
              <option value="">{cityCode ? "Select a Barangay" : "Select city first"}</option>
              {barangayOptions.map((b, i) => (
                <option key={`${b.brgy_code}-${i}`} value={b.brgy_name}>{b.brgy_name}</option>
              ))}
            </select>
          </div>
          <div>
            <InputLabel>Department</InputLabel>
            <select
              value={user_department ?? ""}
              onChange={(e) => setDepartment(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            >
              <option value="">Select a Department</option>
              {departments.map((d) => (
                <option key={d.department_id} value={d.department_id}>
                  {d.department_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <InputLabel>SSS</InputLabel>
            <input
              value={user_sss}
              onChange={(e) => setSss(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <InputLabel>PhilHealth</InputLabel>
            <input
              value={user_philhealth}
              onChange={(e) => setPhilhealth(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <InputLabel>TIN</InputLabel>
            <input
              value={user_tin}
              onChange={(e) => setTin(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <InputLabel>Position</InputLabel>
            <input
              value={user_position}
              onChange={(e) => setPosition(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <InputLabel required>Date of Hire</InputLabel>
            <input
              type="date"
              value={user_dateOfHire}
              onChange={(e) => setDateOfHire(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <InputLabel required>Birthday</InputLabel>
            <input
              type="date"
              value={user_bday}
              onChange={(e) => setBday(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <InputLabel>RF ID</InputLabel>
            <input
              value={rf_id}
              onChange={(e) => setRfId(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <InputLabel>Is Admin?</InputLabel>
            <select
              value={isAdmin}
              onChange={(e) => setIsAdmin(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white"
            >
              <option value={1}>Yes</option>
              <option value={0}>No</option>
            </select>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2">
          <button className="px-3 py-2 rounded-lg border text-sm" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button className="px-4 py-2 rounded-lg bg-black text-white text-sm disabled:opacity-50" disabled={!canSubmit || submitting} onClick={handleSubmit}>
            {submitting ? "Saving..." : (mode === "create" ? "Create User" : "Save Changes")}
          </button>
        </div>
      </div>
    </div>
  );
}
