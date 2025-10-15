"use client";

import { useState, useEffect } from "react";
import { Dialog } from "@/components/ui/dialog";
import provincesRaw from "@/public/province.json";
import citiesRaw from "@/public/city.json";
import barangaysRaw from "@/public/barangay.json";

interface Province {
    code: string;
    name: string;
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

const provinces: Province[] = Array.isArray(provincesRaw) ? provincesRaw.map((province: any) => ({
    code: province.province_code,
    name: province.province_name,
})) : [];

const cities: City[] = Array.isArray(citiesRaw) ? citiesRaw.map((city: any) => ({
    city_code: city.city_code,
    city_name: city.city_name,
    province_code: city.province_code,
})) : [];

const barangays: Barangay[] = Array.isArray(barangaysRaw) ? barangaysRaw.map((barangay: any) => ({
    brgy_code: barangay.brgy_code,
    brgy_name: barangay.brgy_name,
    city_code: barangay.city_code,
})) : [];

interface SalesOrderFormDialogProps {
    onSubmit: (data: any) => Promise<void>;
}

export function SalesOrderFormDialog({
    onSubmit,
}: SalesOrderFormDialogProps) {
    const [selectedProvince, setSelectedProvince] = useState<string>("");
    const [selectedCity, setSelectedCity] = useState<string>("");
    const [filteredCities, setFilteredCities] = useState<City[]>([]);
    const [filteredBarangays, setFilteredBarangays] = useState<Barangay[]>([]);

    useEffect(() => {
        if (selectedProvince) {
            const citiesFiltered = cities.filter((city: City) => city.province_code === selectedProvince);
            setFilteredCities(citiesFiltered);
            setSelectedCity("");
            setFilteredBarangays([]);
        }
    }, [selectedProvince]);

    useEffect(() => {
        if (selectedCity) {
            const barangaysFiltered = barangays.filter((barangay: Barangay) => barangay.city_code === selectedCity);
            setFilteredBarangays(barangaysFiltered);
        }
    }, [selectedCity]);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        const formData = {
            province: selectedProvince,
            city: selectedCity,
            barangay: filteredBarangays.find(b => b.brgy_code === selectedCity)?.brgy_name || "",
        };
        console.log("Form Data Submitted:", formData);
        await onSubmit(formData);
    };

    return (
        <Dialog>
            <form onSubmit={handleSubmit}>
                <label htmlFor="province">Province/State</label>
                <select
                    id="province"
                    value={selectedProvince}
                    onChange={(e) => setSelectedProvince(e.target.value)}
                >
                    <option value="">Select Province</option>
                    {provinces.map((province: Province) => (
                        <option key={province.code} value={province.code}>
                            {province.name}
                        </option>
                    ))}
                </select>

                <label htmlFor="city">City/Municipality</label>
                <select
                    id="city"
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    disabled={!selectedProvince}
                >
                    <option value="">Select City</option>
                    {filteredCities.map((city: City) => (
                        <option key={city.city_code} value={city.city_code}>
                            {city.city_name}
                        </option>
                    ))}
                </select>

                <label htmlFor="barangay">Barangay</label>
                <select
                    id="barangay"
                    value={filteredBarangays.find(b => b.brgy_code === selectedCity)?.brgy_code || ""}
                    onChange={(e) => console.log("Barangay Selected:", e.target.value)}
                    disabled={!selectedCity}
                >
                    <option value="">Select Barangay</option>
                    {filteredBarangays.map((barangay: Barangay) => (
                        <option key={barangay.brgy_code} value={barangay.brgy_code}>
                            {barangay.brgy_name}
                        </option>
                    ))}
                </select>

                <button type="submit">Submit</button>
            </form>
        </Dialog>
    );
}
