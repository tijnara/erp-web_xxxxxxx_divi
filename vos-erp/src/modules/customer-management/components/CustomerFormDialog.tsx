// src/modules/customer-management/components/CustomerFormDialog.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import type { Customer, UpsertCustomerDTO } from "../types";

type Province = { province_code: string; province_name: string; region_code?: string; psgc_code?: string };
type City = { city_code: string; city_name: string; province_code: string; region_desc?: string; psgc_code?: string };
type Barangay = { brgy_code: string; brgy_name: string; city_code: string; province_code?: string; region_code?: string };

export function CustomerFormDialog({
  open,
  mode,
  initial,
  onClose,
  onSubmit,
}: {
  open: boolean;
  mode: "create" | "edit";
  initial?: Customer;
  onClose: () => void;
  onSubmit: (data: UpsertCustomerDTO) => Promise<void> | void;
}) {
  const [customer_code, setCode] = useState("");
  const [customer_name, setName] = useState("");
  const [store_name, setStoreName] = useState("");
  const [store_signage, setStoreSignage] = useState("");

  // Text values persisted to DB
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [brgy, setBrgy] = useState("");

  // Codes used for filtering/cascading
  const [provinceCode, setProvinceCode] = useState<string>("");
  const [cityCode, setCityCode] = useState<string>("");

  const [contact_number, setContact] = useState("");
  const [customer_email, setEmail] = useState("");
  const [store_type, setStoreType] = useState<number>(0);
  const [discount_type, setDiscountType] = useState<number | null>(null);
  const [customer_classification, setCustomerClassification] = useState<number | null>(null);
  const [isActive, setIsActive] = useState<number>(1);
  const [isVAT, setIsVAT] = useState<number>(0);
  const [isEWT, setIsEWT] = useState<number>(0);
  const [encoder_id, setEncoderId] = useState<number>(0);
  const [encoderName, setEncoderName] = useState<string>("");

  const [storeTypes, setStoreTypes] = useState<{ id: number; store_type: string }[]>([]);
  const [discountTypes, setDiscountTypes] = useState<{ id: number; discount_type: string }[]>([]);
  const [customerClassifications, setCustomerClassifications] = useState<{ id: number; classification_name: string }[]>([]);

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

  // Fetch current logged-in user (encoder)
  useEffect(() => {
    if (!open) return;

    const fetchEncoderName = async (id: number) => {
      try {
        const res = await fetch(`/api/lookup/user?id=${id}`);
        const json = await res.json();
        if (json.data) {
          const user = json.data;
          const fullName = [user.user_fname, user.user_lname].filter(Boolean).join(" ");
          setEncoderName(fullName || `User ${id}`);
        }
      } catch {
        setEncoderName(`User ${id}`);
      }
    };

    if (mode === "create") {
      (async () => {
        try {
          const res = await fetch("http://100.119.3.44:8090/users/me", {
            cache: "no-store",
            headers: {
              'Authorization': 'Bearer hTovVgKHSA-XqQFinWFQn6dOu9MFTMs2'
            }
          });
          if (!res.ok) return;
          const json = await res.json();
          const u = json?.user;
          let id: number | null = null;
          if (u?.id) id = Number(u.id);
          else if (u?.sub) id = Number(u.sub);

          if (id) {
            setEncoderId(id);
            const name = u.name || [u.user_fname, u.user_lname].filter(Boolean).join(" ");
            setEncoderName(name || `User ${id}`);
          }
        } catch {
          // ignore
        }
      })();
    } else if (initial?.encoder_id) {
      setEncoderId(initial.encoder_id);
      fetchEncoderName(initial.encoder_id);
    }
  }, [open, mode, initial]);

  useEffect(() => {
    if (!open) return;

    // Set fields from initial data first
    setName(initial?.customer_name ?? "");
    setStoreName(initial?.store_name ?? "");
    setStoreSignage(initial?.store_signage ?? "");
    setProvince(initial?.province ?? "");
    setCity(initial?.city ?? "");
    setBrgy(initial?.brgy ?? "");
    setContact(initial?.contact_number ?? "");
    setEmail(initial?.customer_email ?? "");
    setStoreType(initial?.store_type ?? 0);
    setDiscountType(initial?.discount_type ?? null);
    setCustomerClassification(initial?.customer_classification ?? null);
    setIsActive(initial?.isActive ?? 1);
    setIsVAT(initial?.isVAT ?? 0);
    setIsEWT(initial?.isEWT ?? 0);

    if (mode === "create") {
      // Auto-generate customer code for new customers
      fetch("/api/customer", { cache: "no-store" })
        .then((res) => res.json())
        .then((body) => {
          const latestCustomer = body.data?.[0];
          if (latestCustomer && latestCustomer.customer_code) {
            const lastCode = latestCustomer.customer_code;
            const lastNumber = parseInt(lastCode.split("-")[1], 10);
            const newNumber = lastNumber + 1;
            const newCode = `CC-${String(newNumber).padStart(4, "0")}`;
            setCode(newCode);
          } else {
            setCode("CC-0001");
          }
        });
    } else {
      // For edits, just use the initial code
      setCode(initial?.customer_code ?? "");
    }

    // Load dropdowns
    fetch("/api/store_type", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => setStoreTypes(j.data || []))
      .catch(() => setStoreTypes([]));
    fetch("/api/discount_type", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => setDiscountTypes(j.data || []))
      .catch(() => setDiscountTypes([]));
    fetch("http://100.119.3.44:8090/items/customer_classification", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => setCustomerClassifications(j.data || []))
      .catch(() => setCustomerClassifications([]));

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
        const pCode = findProvinceCodeByName(initial?.province ?? "");
        setProvinceCode(pCode);
        const cCode = findCityCodeByName(initial?.city ?? "", pCode);
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

  if (!open) return null;

  const title = mode === "create" ? "Add Customer" : "Edit Customer";

  async function handleSubmit() {
    const dto: UpsertCustomerDTO = {
      customer_code: customer_code || undefined,
      customer_name: customer_name || undefined,
      store_name: store_name || undefined,
      store_signage: store_signage || undefined,
      province: province || undefined,
      city: city || undefined,
      brgy: brgy || undefined,
      contact_number: contact_number || undefined,
      customer_email: customer_email || undefined,
      store_type: store_type || undefined,
      discount_type: discount_type ?? undefined,
      customer_classification: customer_classification ?? undefined,
      isActive,
      isVAT,
      isEWT,
      encoder_id,
    };
    await onSubmit(dto);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-3xl bg-white rounded-xl shadow-lg border">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="font-semibold">{title}</div>
          <button className="text-sm text-gray-500" onClick={onClose}>Close</button>
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Customer Code</label>
            <input className="w-full rounded-lg border border-gray-200 px-3 py-2 bg-gray-100" value={customer_code} readOnly placeholder="CC-0001" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs text-gray-600 mb-1">Customer Name</label>
            <input className="w-full rounded-lg border border-gray-200 px-3 py-2" value={customer_name} onChange={(e)=>setName(e.target.value)} placeholder="Enter customer name" />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Store Name</label>
            <input className="w-full rounded-lg border border-gray-200 px-3 py-2" value={store_name} onChange={(e)=>setStoreName(e.target.value)} placeholder="Enter store name" />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Store Signage</label>
            <input className="w-full rounded-lg border border-gray-200 px-3 py-2" value={store_signage} onChange={(e)=>setStoreSignage(e.target.value)} placeholder="Enter store signage" />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Contact Number</label>
            <input className="w-full rounded-lg border border-gray-200 px-3 py-2" value={contact_number} onChange={(e)=>setContact(e.target.value)} placeholder="Enter contact number" />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Email</label>
            <input className="w-full rounded-lg border border-gray-200 px-3 py-2" value={customer_email ?? ""} onChange={(e)=>setEmail(e.target.value)} placeholder="Enter email address" />
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">Province</label>
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
            <label className="block text-xs text-gray-600 mb-1">City / Municipality</label>
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
            <label className="block text-xs text-gray-600 mb-1">Barangay</label>
            <select
              className="w-full rounded-lg border border-gray-200 px-3 py-2"
              value={brgy || ""}
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
            <label className="block text-xs text-gray-600 mb-1">Store Type</label>
            <select className="w-full rounded-lg border border-gray-200 px-3 py-2" value={store_type} onChange={(e)=>setStoreType(Number(e.target.value))}>
              <option value={0}>Select store type</option>
              {storeTypes.map((t)=> (
                <option key={t.id} value={t.id}>{t.store_type}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Discount Type</label>
            <select className="w-full rounded-lg border border-gray-200 px-3 py-2" value={discount_type ?? 0} onChange={(e)=>setDiscountType(Number(e.target.value) || null)}>
              <option value={0}>Select discount</option>
              {discountTypes.map((t)=> (
                <option key={t.id} value={t.id}>{t.discount_type}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Customer Classification</label>
            <select className="w-full rounded-lg border border-gray-200 px-3 py-2" value={customer_classification ?? 0} onChange={(e)=>setCustomerClassification(Number(e.target.value) || null)}>
              <option value={0}>Select classification</option>
              {customerClassifications.map((c)=> (
                <option key={c.id} value={c.id}>{c.classification_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Encoder ID</label>
            <input type="text" className="w-full rounded-lg border border-gray-200 px-3 py-2 bg-gray-100" value={encoderName} readOnly placeholder="Encoder Name" />
          </div>
          <div className="flex items-center gap-2 mt-2">
            <input id="isActive" type="checkbox" className="h-4 w-4" checked={!!isActive} onChange={(e)=>setIsActive(e.target.checked ? 1 : 0)} />
            <label htmlFor="isActive" className="text-sm">Active</label>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <input id="isVAT" type="checkbox" className="h-4 w-4" checked={!!isVAT} onChange={(e)=>setIsVAT(e.target.checked ? 1 : 0)} />
            <label htmlFor="isVAT" className="text-sm">VAT</label>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <input id="isEWT" type="checkbox" className="h-4 w-4" checked={!!isEWT} onChange={(e)=>setIsEWT(e.target.checked ? 1 : 0)} />
            <label htmlFor="isEWT" className="text-sm">EWT</label>
          </div>
        </div>
        <div className="p-4 border-t flex justify-end gap-2">
          <button className="px-3 py-2 rounded border" onClick={onClose}>Cancel</button>
          <button className="px-3 py-2 rounded bg-black text-white" onClick={handleSubmit}>{mode === "create" ? "Create" : "Save"}</button>
        </div>
      </div>
    </div>
  );
}
