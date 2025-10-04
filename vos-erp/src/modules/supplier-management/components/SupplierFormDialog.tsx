"use client";

import { useEffect, useMemo, useState } from "react";
import type { Supplier, UpsertSupplierDTO } from "../types";

type Province = { province_code: string; province_name: string; region_code?: string; psgc_code?: string };
type City = { city_code: string; city_name: string; province_code: string; region_desc?: string; psgc_code?: string };
type Barangay = { brgy_code: string; brgy_name: string; city_code: string; province_code?: string; region_code?: string };
type Country = { name: string };
type DeliveryTerm = { id: number; delivery_name: string };
type SupplierType = { id: number; transaction_type: string };


function InputLabel({ children, required }: { children: any; required?: boolean }) {
  return (
    <div className="text-sm font-medium mb-1">
      {children}
      {required ? <span className="text-red-500"> *</span> : null}
    </div>
  );
}

export function SupplierFormDialog({
  open,
  mode,
  initial,
  onClose,
  onSubmit,
}: {
  open: boolean;
  mode: "create" | "edit";
  initial?: Partial<Supplier>;
  onClose: () => void;
  onSubmit: (dto: UpsertSupplierDTO) => Promise<void>;
}) {
  const [supplier_name, setSupplierName] = useState(initial?.supplier_name ?? "");
  const [supplier_shortcut, setSupplierShortcut] = useState(initial?.supplier_shortcut ?? "");
  const [contact_person, setContactPerson] = useState(initial?.contact_person ?? "");
  const [email_address, setEmailAddress] = useState(initial?.email_address ?? "");
  const [phone_number, setPhoneNumber] = useState(initial?.phone_number ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [city, setCity] = useState(initial?.city ?? "");
  const [brgy, setBrgy] = useState(initial?.brgy ?? "");
  const [state_province, setStateProvince] = useState(initial?.state_province ?? "");
  const [postal_code, setPostalCode] = useState(initial?.postal_code ?? "");
  const [country, setCountry] = useState(initial?.country ?? "Philippines");
  const [supplier_type, setSupplierType] = useState<string | null>(initial?.supplier_type ?? null);
  const [tin_number, setTinNumber] = useState(initial?.tin_number ?? "");
  const [bank_details, setBankDetails] = useState(initial?.bank_details ?? "");
  const [payment_terms, setPaymentTerms] = useState(initial?.payment_terms ?? "Cash On Delivery");
  const [delivery_terms, setDeliveryTerms] = useState<number | null>(null);
  const [agreement_or_contract, setAgreementOrContract] = useState(initial?.agreement_or_contract ?? "");
  const [preferred_communication_method, setPreferredCommunicationMethod] = useState(initial?.preferred_communication_method ?? "");
  const [notes_or_comments, setNotesOrComments] = useState(initial?.notes_or_comments ?? "");
  const [isActive, setIsActive] = useState(initial?.isActive ?? 1);

  const [submitting, setSubmitting] = useState(false);

  // Codes used for filtering/cascading
  const [provinceCode, setProvinceCode] = useState<string>("");
  const [cityCode, setCityCode] = useState<string>("");

  // Local geographic datasets
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [barangays, setBarangays] = useState<Barangay[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [deliveryTermsOptions, setDeliveryTermsOptions] = useState<DeliveryTerm[]>([]);
  const [supplierTypes, setSupplierTypes] = useState<SupplierType[]>([]);
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
    setSupplierName(initial?.supplier_name ?? "");
    setSupplierShortcut(initial?.supplier_shortcut ?? "");
    setContactPerson(initial?.contact_person ?? "");
    setEmailAddress(initial?.email_address ?? "");
    setPhoneNumber(initial?.phone_number ?? "");
    setAddress(initial?.address ?? "");
    setCity(initial?.city ?? "");
    setBrgy(initial?.brgy ?? "");
    setStateProvince(initial?.state_province ?? "");
    setPostalCode(initial?.postal_code ?? "");
    setCountry(initial?.country ?? "Philippines");
    setSupplierType(initial?.supplier_type ?? null);
    setTinNumber(initial?.tin_number ?? "");
    setBankDetails(initial?.bank_details ?? "");
    setPaymentTerms(initial?.payment_terms ?? "Cash On Delivery");
    setDeliveryTerms(typeof initial?.delivery_terms === 'number' ? initial.delivery_terms : null);
    setAgreementOrContract(initial?.agreement_or_contract ?? "");
    setPreferredCommunicationMethod(initial?.preferred_communication_method ?? "");
    setNotesOrComments(initial?.notes_or_comments ?? "");
    setIsActive(initial?.isActive ?? 1);

    // Lazy-load local geographic JSONs only when dialog is open
    (async () => {
      setLoadingGeo(true);
      try {
        const [
          countries,
          provinces,
          cities,
          barangays,
          deliveryTermsResponse,
          supplierTypesResponse,
        ] = await Promise.all([
          import("../../../../data/countries.json"),
          import("../../../../data/province.json"),
          import("../../../../data/city.json"),
          import("../../../../data/barangay.json"),
          fetch("http://100.119.3.44:8090/items/delivery_terms"),
          fetch("http://100.119.3.44:8090/items/transaction_type"),
        ]);

        const deliveryTerms = await deliveryTermsResponse.json();
        const supplierTypes = await supplierTypesResponse.json();

        const provArr: Province[] = (provinces as any).default ?? provinces;
        const cityArr: City[] = (cities as any).default ?? cities;
        const brgyArr: Barangay[] = (barangays as any).default ?? barangays;
        const countryArr: Country[] = (countries as any).default ?? countries;

        setCountries(countryArr);
        setProvinces(provArr);
        setCities(cityArr);
        setBarangays(brgyArr);

        if (deliveryTerms.data) {
          const terms = deliveryTerms.data as DeliveryTerm[];
          setDeliveryTermsOptions(terms);
          if (initial?.delivery_terms) {
            const term = terms.find((t) => t.id === initial.delivery_terms);
            if (term) {
              setDeliveryTerms(term.id);
            }
          }
        }
        if (supplierTypes.data) {
          setSupplierTypes(supplierTypes.data);
        }

        // Derive codes from existing text (if any)
        const pCode = findProvinceCodeByName(initial?.state_province ?? "");
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
        setCountries([]);
        setDeliveryTermsOptions([]);
        setSupplierTypes([]);
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
    return supplier_name && supplier_shortcut;
  }, [supplier_name, supplier_shortcut]);

  async function handleSubmit() {
    if (!canSubmit) return;
    try {
      setSubmitting(true);
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;

      const dto: UpsertSupplierDTO = {
        supplier_name,
        supplier_shortcut,
        contact_person,
        email_address,
        phone_number,
        address,
        city,
        brgy,
        state_province,
        postal_code,
        country,
        supplier_type,
        tin_number,
        bank_details,
        payment_terms,
        delivery_terms,
        agreement_or_contract,
        preferred_communication_method,
        notes_or_comments,
        isActive,
        date_added: mode === 'create' ? formattedDate : initial?.date_added,
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
      <div className="relative w-full max-w-4xl rounded-xl bg-white shadow-xl border border-gray-200 p-5">
        <h3 className="text-lg font-semibold mb-4">
          {mode === "create" ? "Create New Supplier" : "Edit Supplier"}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <InputLabel required>Supplier Name</InputLabel>
            <input value={supplier_name} onChange={(e) => setSupplierName(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <InputLabel required>Supplier Shortcut</InputLabel>
            <input value={supplier_shortcut} onChange={(e) => setSupplierShortcut(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <InputLabel>Contact Person</InputLabel>
            <input value={contact_person} onChange={(e) => setContactPerson(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <InputLabel>Email</InputLabel>
            <input type="email" value={email_address} onChange={(e) => setEmailAddress(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <InputLabel>Phone Number</InputLabel>
            <input value={phone_number} onChange={(e) => setPhoneNumber(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <InputLabel>Address</InputLabel>
            <input value={address} onChange={(e) => setAddress(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <InputLabel>State/Province</InputLabel>
            <select
              className="w-full rounded-lg border border-gray-200 px-3 py-2"
              value={provinceCode}
              onChange={(e) => {
                const code = e.target.value;
                setProvinceCode(code);
                const p = provinceOptions.find((x) => x.province_code === code);
                setStateProvince(p ? p.province_name : "");
              }}
            >
              <option value="">Select a Province</option>
              {provinceOptions.map((p, i) => (
                <option key={`${p.province_code}-${i}`} value={p.province_code}>{p.province_name}</option>
              ))}
            </select>
          </div>

          <div>
            <InputLabel>City / Municipality</InputLabel>
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
            <InputLabel>Postal Code</InputLabel>
            <input value={postal_code} onChange={(e) => setPostalCode(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <InputLabel>Country</InputLabel>
            <select value={country} onChange={(e) => setCountry(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white">
              {countries.map((c) => (
                <option key={c.name} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <InputLabel>Supplier Type</InputLabel>
            <select value={supplier_type ?? ""} onChange={(e) => setSupplierType(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white">
              <option value="">-- Select Type --</option>
              {supplierTypes.map((t) => (
                <option key={t.id} value={t.transaction_type}>
                  {t.transaction_type}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-2">
            <InputLabel>TIN #</InputLabel>
            <input value={tin_number} onChange={(e) => setTinNumber(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
          </div>
          <div className="col-span-2">
            <InputLabel>Bank Details</InputLabel>
            <input value={bank_details} onChange={(e) => setBankDetails(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <InputLabel>Payment Terms</InputLabel>
            <input value={payment_terms} onChange={(e) => setPaymentTerms(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <InputLabel>Delivery Terms</InputLabel>
            <select value={delivery_terms ?? ""} onChange={(e) => setDeliveryTerms(Number(e.target.value) || null)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white">
              <option value="">Select Delivery Term</option>
              {deliveryTermsOptions.map((d) => (
                <option key={d.id} value={d.id}>{d.delivery_name}</option>
              ))}
            </select>
          </div>
          <div>
            <InputLabel>Agreement/Contract</InputLabel>
            <input value={agreement_or_contract} onChange={(e) => setAgreementOrContract(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <InputLabel>Preferred Communication</InputLabel>
            <input value={preferred_communication_method} onChange={(e) => setPreferredCommunicationMethod(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
          </div>
          <div className="md:col-span-3">
            <InputLabel>Notes/Comments</InputLabel>
            <textarea value={notes_or_comments} onChange={(e) => setNotesOrComments(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <InputLabel>Is Active?</InputLabel>
            <select value={isActive} onChange={(e) => setIsActive(Number(e.target.value))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white">
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
            {submitting ? "Saving..." : (mode === "create" ? "Create Supplier" : "Save Changes")}
          </button>
        </div>
      </div>
    </div>
  );
}
