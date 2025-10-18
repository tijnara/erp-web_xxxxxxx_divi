// src/modules/customer-management/components/CustomerFormDialog.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import type { Customer, UpsertCustomerDTO } from "../types";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Province = { province_code: string; province_name: string; region_code?: string; psgc_code?: string };
type City = { city_code: string; city_name: string; province_code: string; region_desc?: string; psgc_code?: string };
type Barangay = { brgy_code: string; brgy_name: string; city_code: string; province_code?: string; region_code?: string };

export function CustomerFormDialog({
                                       open,
                                       mode,
                                       initial,
                                       onCloseAction,
                                       onSubmitAction = () => {},
                                   }: {
    open: boolean;
    mode: "create" | "edit";
    initial?: Customer;
    onCloseAction: () => void;
    onSubmitAction?: (data: UpsertCustomerDTO) => Promise<void> | void;
}) {
    const [customer_code, setCode] = useState("");
    const [customer_name, setName] = useState("");
    const [store_name, setStoreName] = useState("");
    const [store_signage, setStoreSignage] = useState("");
    const [province, setProvince] = useState("");
    const [city, setCity] = useState("");
    const [brgy, setBrgy] = useState("");
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
    const [provinces, setProvinces] = useState<Province[]>([]);
    const [cities, setCities] = useState<City[]>([]);
    const [barangays, setBarangays] = useState<Barangay[]>([]);
    const [loadingGeo, setLoadingGeo] = useState<boolean>(false);
    const [storeNameError, setStoreNameError] = useState<string>("");
    const [street_address, setStreetAddress] = useState("");
    const [remarks, setRemarks] = useState<string>("");

    const provinceOptions = useMemo(() => [...provinces].sort((a, b) => a.province_name.localeCompare(b.province_name)), [provinces]);
    const cityOptions = useMemo(() => {
        const filtered = provinceCode ? cities.filter((c) => c.province_code === provinceCode) : cities;
        return filtered.sort((a, b) => a.city_name.localeCompare(b.city_name));
    }, [cities, provinceCode]);
    const barangayOptions = useMemo(() => {
        const filtered = cityCode ? barangays.filter((b) => b.city_code === cityCode) : [];
        return filtered.sort((a, b) => a.brgy_name.localeCompare(b.brgy_name));
    }, [barangays, cityCode]);

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

    // ✅ FIX: Centralized, robust function to generate the next customer code.
    const getNextCustomerCode = (customers: Customer[] | undefined): string => {
        if (!customers || customers.length === 0) {
            return "CC-0001";
        }

        const maxCodeNumber = customers.reduce((max, customer) => {
            if (customer.customer_code && customer.customer_code.startsWith("CC-")) {
                const codeNumber = parseInt(customer.customer_code.split("-")[1], 10);
                if (!isNaN(codeNumber) && codeNumber > max) {
                    return codeNumber;
                }
            }
            return max;
        }, 0);

        const newCodeNumber = maxCodeNumber + 1;
        return `CC-${String(newCodeNumber).padStart(4, "0")}`;
    };

    useEffect(() => {
        if (!open) return;

        // Reset form state from initial props
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
        setStreetAddress(initial?.street_address ?? "");
        setRemarks(initial?.otherDetails ?? "");

        const fetchEncoderDetails = async (id?: number) => {
            const url = id ? `http://100.119.3.44:8090/items/user/${id}` : "http://100.119.3.44:8090/items/user";
            try {
                const res = await fetch(url, { cache: "no-store" });
                if (!res.ok) throw new Error(`Failed to fetch encoder: ${res.status}`);
                const json = await res.json();
                const user = id ? json?.data : json?.data?.[0];
                if (user) {
                    setEncoderId(user.user_id);
                    const fullName = [user.user_fname, user.user_lname].filter(Boolean).join(" ");
                    setEncoderName(fullName || `User ${user.user_id}`);
                }
            } catch (error) {
                console.error("Error fetching encoder details:", error);
            }
        };

        if (mode === "create") {
            fetchEncoderDetails();
            setCode("Generating...");
            // ✅ FIX: Fetch ALL customers to find the true max code for display.
            fetch("/api/customer", { cache: "no-store" })
                .then((res) => res.json())
                .then((body) => {
                    const newCode = getNextCustomerCode(body.data);
                    setCode(newCode);
                });
        } else {
            setCode(initial?.customer_code ?? "");
            fetchEncoderDetails(initial?.encoder_id);
        }

        // Fetch dropdowns
        fetch("/api/store_type").then(r => r.json()).then(j => setStoreTypes(j.data || []));
        fetch("/api/discount_type").then(r => r.json()).then(j => setDiscountTypes(j.data || []));
        fetch("http://100.119.3.44:8090/items/customer_classification")
            .then(r => r.json()).then(j => setCustomerClassifications(j.data || []));

        // Lazy load geo data
        (async () => {
            setLoadingGeo(true);
            try {
                const [provMod, cityMod, brgyMod] = await Promise.all([
                    import("../../../../data/province.json"),
                    import("../../../../data/city.json"),
                    import("../../../../data/barangay.json"),
                ]);
                setProvinces((provMod as any).default ?? provMod);
                setCities((cityMod as any).default ?? cityMod);
                setBarangays((brgyMod as any).default ?? brgyMod);
            } catch (err) {
                console.error("Failed to load geo data", err);
            } finally {
                setLoadingGeo(false);
            }
        })();
    }, [open, initial, mode]);

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

        // Only check for duplicate store name in create mode
        if (mode === 'create') {
            try {
                // Fetch all customers to check for duplicate store name
                const res = await fetch("/api/customer", { cache: "no-store" });
                if (!res.ok) throw new Error(`Failed to fetch customers for code generation: ${res.statusText}`);
                const body = await res.json();
                // Check for duplicate store name (case-insensitive, trimmed)
                const duplicate = (body.data || []).some((c: Customer) =>
                    c.store_name && store_name && c.store_name.trim().toLowerCase() === store_name.trim().toLowerCase()
                );
                if (duplicate) {
                    setStoreNameError("Store name already exists. Please enter a unique store name.");
                    return;
                } else {
                    setStoreNameError("");
                }
                const newCode = getNextCustomerCode(body.data);
                const finalPayload: UpsertCustomerDTO = {
                    customer_code: newCode,
                    customer_name, store_name, store_signage, province, city, brgy,
                    contact_number, customer_email, store_type, discount_type, customer_classification,
                    isActive, isVAT, isEWT, encoder_id,
                    street_address,
                };
                console.log("Payload being sent to API:", finalPayload);
                if (typeof onSubmitAction === "function") {
                    await onSubmitAction(finalPayload);
                } else {
                    console.error("onSubmitAction prop is not a function.");
                }
                if (typeof onCloseAction === "function") {
                    onCloseAction();
                }
            } catch (error) {
                console.error("Could not generate new customer code on submit:", error);
                return;
            }
        } else {
            const finalPayload: UpsertCustomerDTO = {
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
                street_address,
                otherDetails: remarks, // Include remarks in the payload
            };
            if (typeof onSubmitAction === "function") {
                await onSubmitAction(finalPayload);
            } else {
                console.error("onSubmitAction prop is not a function.");
            }
            if (typeof onCloseAction === "function") {
                onCloseAction();
            }
        }
    };

    const handleCancel = () => {
        if (typeof onCloseAction === "function") {
            onCloseAction();
        } else {
            console.error("onCloseAction prop is not a function and was called.");
        }
    };

    if (!open) return null;

    return (
        <Modal
            open={open}
            onClose={onCloseAction}
            title={`${mode === "create" ? "Create" : "Edit"} Customer`}
            hideCloseButton={mode === "create"}
        >
            <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[80vh]">
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
                                    <Input id="store_name" value={store_name} onChange={(e) => {
                                        setStoreName(e.target.value);
                                        if (storeNameError) setStoreNameError("");
                                    }} />
                                    {storeNameError && (
                                        <div className="text-red-500 text-xs mt-1">{storeNameError}</div>
                                    )}
                                </div>
                                <div className="form-group">
                                    <label htmlFor="store_signage">Store Signage</label>
                                    <Input id="store_signage" value={store_signage} onChange={(e) => setStoreSignage(e.target.value)} />
                                </div>
                                <div className="form-group col-span-2">
                                    <label htmlFor="street_address">Street Address</label>
                                    <Input id="street_address" value={street_address} onChange={e => setStreetAddress(e.target.value)} className="w-full" />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="province" className="block text-sm font-medium text-gray-700">Province</label>
                                    <select id="province" value={province} onChange={(e) => {
                                        const newProvName = e.target.value;
                                        setProvince(newProvName);
                                        const newProvCode = findProvinceCodeByName(newProvName);
                                        setProvinceCode(newProvCode);
                                        setCity(""); setCityCode(""); setBrgy("");
                                    }} className="w-full px-3 py-2 border border-gray-300 rounded-md" disabled={loadingGeo} >
                                        <option value="">{loadingGeo ? "Loading..." : "Select Province"}</option>
                                        {provinceOptions.map((p) => <option key={`${p.province_code}-${p.province_name}`} value={p.province_name}>{p.province_name}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="city" className="block text-sm font-medium text-gray-700">City</label>
                                    <select id="city" value={city} onChange={(e) => {
                                        const newCityName = e.target.value;
                                        setCity(newCityName);
                                        const newCityCode = findCityCodeByName(newCityName, provinceCode);
                                        setCityCode(newCityCode);
                                        setBrgy("");
                                    }} className="w-full px-3 py-2 border border-gray-300 rounded-md" disabled={!province || loadingGeo} >
                                        <option value="">Select City</option>
                                        {cityOptions.map((c) => <option key={c.city_code} value={c.city_name}>{c.city_name}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="brgy" className="block text-sm font-medium text-gray-700">Barangay</label>
                                    <select id="brgy" value={brgy} onChange={(e) => setBrgy(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md" disabled={!city || loadingGeo} >
                                        <option value="">Select Barangay</option>
                                        {barangayOptions.map((b) => <option key={b.brgy_code} value={b.brgy_name}>{b.brgy_name}</option>)}
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
                                    <label htmlFor="store_type" className="block text-sm font-medium text-gray-700">Store Type</label>
                                    <select id="store_type" value={store_type} onChange={(e) => setStoreType(Number(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-md" >
                                        <option value={0}>Select Store Type</option>
                                        {storeTypes.map((st) => <option key={st.id} value={st.id}>{st.store_type}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="discount_type" className="block text-sm font-medium text-gray-700">Discount Type</label>
                                    <select id="discount_type" value={discount_type ?? ""} onChange={(e) => setDiscountType(e.target.value ? Number(e.target.value) : null)} className="w-full px-3 py-2 border border-gray-300 rounded-md" >
                                        <option value="">Select Discount Type</option>
                                        {discountTypes.map((dt) => <option key={dt.id} value={dt.id}>{dt.discount_type}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="customer_classification" className="block text-sm font-medium text-gray-700">Classification</label>
                                    <select id="customer_classification" value={customer_classification ?? ""} onChange={(e) => setCustomerClassification(e.target.value ? Number(e.target.value) : null)} className="w-full px-3 py-2 border border-gray-300 rounded-md" >
                                        <option value="">Select Classification</option>
                                        {customerClassifications.map((cc) => <option key={cc.id} value={cc.id}>{cc.classification_name}</option>)}
                                    </select>
                                </div>
                                <div className="form-group col-span-2">
                                    <label className="block text-sm font-medium text-gray-700">Status</label>
                                    <div className="flex items-center gap-4 mt-1">
                                        <label className="flex items-center">
                                            <input type="radio" name="isActive" value={1} checked={isActive === 1} onChange={() => setIsActive(1)} className="form-radio" />
                                            <span className="ml-2">Active</span>
                                        </label>
                                        <label className="flex items-center">
                                            <input type="radio" name="isActive" value={0} checked={isActive === 0} onChange={() => setIsActive(0)} className="form-radio" />
                                            <span className="ml-2">Inactive</span>
                                        </label>
                                    </div>
                                </div>
                                <div className="form-group col-span-2">
                                    <label className="block text-sm font-medium text-gray-700">Tax Settings</label>
                                    <div className="flex items-center gap-4 mt-1">
                                        <label className="flex items-center">
                                            <input type="checkbox" checked={isVAT === 1} onChange={(e) => setIsVAT(e.target.checked ? 1 : 0)} className="form-checkbox" />
                                            <span className="ml-2">VAT</span>
                                        </label>
                                        <label className="flex items-center">
                                            <input type="checkbox" checked={isEWT === 1} onChange={(e) => setIsEWT(e.target.checked ? 1 : 0)} className="form-checkbox" />
                                            <span className="ml-2">EWT</span>
                                        </label>
                                    </div>
                                </div>
                                {encoderName && (
                                    <div className="form-group">
                                        <label htmlFor="encoder">Encoder</label>
                                        <Input id="encoder" value={encoderName} readOnly />
                                    </div>
                                )}
                                <div className="form-group col-span-2">
                                    <label htmlFor="remarks">Remarks / Notes</label>
                                    <textarea
                                        id="remarks"
                                        value={remarks}
                                        onChange={(e) => setRemarks(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                        placeholder="Enter any additional notes or remarks about the customer"
                                    />
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
                <div className="flex justify-end gap-2 p-4 border-t">
                    {mode === "edit" && (
                        <Button variant="ghost" type="button" onClick={handleCancel}>
                            Cancel
                        </Button>
                    )}
                    <Button type="submit">Save</Button>
                </div>
            </form>
        </Modal>
    );
}
