// src/modules/customer-management/components/CustomerFormDialog.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import type { Customer, UpsertCustomerDTO } from "../types";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Re-triggering TS server
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
      } catch (err) {
        console.error("Failed to load geo data", err);
      } finally {
        setLoadingGeo(false);
      }
    })();
  }, [open, initial, mode]);

  // When initial data is set, also set the initial province/city codes
  useEffect(() => {
    if (initial?.province && provinces.length > 0) {
      const pCode = findProvinceCodeByName(initial.province);
      setProvinceCode(pCode);
      if (initial.city && cities.length > 0) {
        const cCode = findCityCodeByName(initial.city, pCode);
        setCityCode(cCode);
      }
    }
  }, [initial, provinces, cities]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data: UpsertCustomerDTO = {
      customer_code,
      customer_name,
      store_name,
      store_signage,
      province,
      city,
      brgy,
      contact_number,
      customer_email,
      store_type,
      discount_type,
      customer_classification,
      isActive,
      isVAT,
      isEWT,
      encoder_id,
    };
    await onSubmit(data);
    onClose();
  };

  if (!open) return null;

  // @ts-ignore
    // @ts-ignore
    return (
    <Modal open={open} onClose={onClose} title={`${mode === "create" ? "Create" : "Edit"} Customer`}>
      <form onSubmit={handleSubmit}>
        <div className="p-4">
          <Tabs defaultValue="general" className="col-span-2">
            <TabsList>
              <TabsTrigger value="general">General Information</TabsTrigger>
            </TabsList>
            <TabsContent value="general">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                <div className="form-group">
                  <label htmlFor="customer_code">Customer Code</label>
                  <Input id="customer_code" value={customer_code} readOnly />
                </div>
                <div className="form-group">
                  <label htmlFor="customer_name">Customer Name</label>
                  <Input id="customer_name" value={customer_name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label htmlFor="store_name">Store Name</label>
                  <Input id="store_name" value={store_name} onChange={(e) => setStoreName(e.target.value)} />
                </div>
                <div className="form-group">
                  <label htmlFor="store_signage">Store Signage</label>
                  <Input id="store_signage" value={store_signage} onChange={(e) => setStoreSignage(e.target.value)} />
                </div>

                <div className="form-group">
                  <label htmlFor="province" className="block text-sm font-medium text-gray-700">
                    Province
                  </label>
                  <select
                    id="province"
                    value={province}
                    onChange={(e) => {
                      const newProvName = e.target.value;
                      setProvince(newProvName);
                      const newProvCode = findProvinceCodeByName(newProvName);
                      setProvinceCode(newProvCode);
                      setCity(""); // Reset city
                      setCityCode("");
                      setBrgy(""); // Reset brgy
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    disabled={loadingGeo}
                  >
                    <option value="">{loadingGeo ? "Loading..." : "Select Province"}</option>
                    {provinceOptions.map((p) => (
                      <option key={`${p.province_code}-${p.province_name}`} value={p.province_name}>
                        {p.province_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                    City
                  </label>
                  <select
                    id="city"
                    value={city}
                    onChange={(e) => {
                      const newCityName = e.target.value;
                      setCity(newCityName);
                      const newCityCode = findCityCodeByName(newCityName, provinceCode);
                      setCityCode(newCityCode);
                      setBrgy(""); // Reset brgy
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    disabled={!province || loadingGeo}
                  >
                    <option value="">Select City</option>
                    {cityOptions.map((c) => (
                      <option key={c.city_code} value={c.city_name}>
                        {c.city_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="brgy" className="block text-sm font-medium text-gray-700">
                    Barangay
                  </label>
                  <select
                    id="brgy"
                    value={brgy}
                    onChange={(e) => setBrgy(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    disabled={!city || loadingGeo}
                  >
                    <option value="">Select Barangay</option>
                    {barangayOptions.map((b) => (
                      <option key={b.brgy_code} value={b.brgy_name}>
                        {b.brgy_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="contact_number">Contact</label>
                  <Input id="contact_number" value={contact_number} onChange={(e) => setContact(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label htmlFor="customer_email">Email</label>
                  <Input id="customer_email" type="email" value={customer_email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="form-group">
                  <label htmlFor="store_type" className="block text-sm font-medium text-gray-700">
                    Store Type
                  </label>
                  <select
                    id="store_type"
                    value={store_type}
                    onChange={(e) => setStoreType(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value={0}>Select Store Type</option>
                    {storeTypes.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.store_type}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="discount_type" className="block text-sm font-medium text-gray-700">
                    Discount Type
                  </label>
                  <select
                    id="discount_type"
                    value={discount_type ?? ""}
                    onChange={(e) => setDiscountType(e.target.value ? Number(e.target.value) : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Select Discount Type</option>
                    {discountTypes.map((dt) => (
                      <option key={dt.id} value={dt.id}>
                        {dt.discount_type}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="customer_classification" className="block text-sm font-medium text-gray-700">
                    Classification
                  </label>
                  <select
                    id="customer_classification"
                    value={customer_classification ?? ""}
                    onChange={(e) => setCustomerClassification(e.target.value ? Number(e.target.value) : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Select Classification</option>
                    {customerClassifications.map((cc) => (
                      <option key={cc.id} value={cc.id}>
                        {cc.classification_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <div className="flex items-center gap-4 mt-1">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="isActive"
                        value={1}
                        checked={isActive === 1}
                        onChange={() => setIsActive(1)}
                        className="form-radio"
                      />
                      <span className="ml-2">Active</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="isActive"
                        value={0}
                        checked={isActive === 0}
                        onChange={() => setIsActive(0)}
                        className="form-radio"
                      />
                      <span className="ml-2">Inactive</span>
                    </label>
                  </div>
                </div>
                <div className="form-group col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Tax Settings</label>
                  <div className="flex items-center gap-4 mt-1">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={isVAT === 1}
                        onChange={(e) => setIsVAT(e.target.checked ? 1 : 0)}
                        className="form-checkbox"
                      />
                      <span className="ml-2">VAT</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={isEWT === 1}
                        onChange={(e) => setIsEWT(e.target.checked ? 1 : 0)}
                        className="form-checkbox"
                      />
                      <span className="ml-2">EWT</span>
                    </label>
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="encoder">Encoder</label>
                  <Input id="encoder" value={encoderName} readOnly />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="flex justify-end gap-2 p-4 border-t">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Save</Button>
        </div>
      </form>
    </Modal>
  );
}
