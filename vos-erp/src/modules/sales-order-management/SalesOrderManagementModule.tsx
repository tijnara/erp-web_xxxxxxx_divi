"use client";

import React, { useState, ChangeEvent, FormEvent, useEffect } from 'react';
// Assuming these are custom components from your project structure
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import axios from 'axios';

// --- Type definitions for our data structures ---
interface WindowData {
    width: string;
    height: string;
    direction: string;
}

interface FormData {
    firstName: string; lastName: string; email: string; phone: string;
    street: string; province: string; city: string; barangay: string; postal: string;
    propertyType: string; roomUse: string; roomLength: string; roomWidth:string; ceilingHeight: string;
    sunExposure: string; insulation: string; occupants: string;
    supplyVoltage: string; breaker: string; unitType: string; budget: string; notes: string;
    preferredDate: string; preferredTime: string; attachments: FileList | null;
}

// Interfaces for the expected structure of our address JSON data
interface Province { province_name: string; province_code: string; }
interface City { city_name: string; province_code: string; city_code: string; }
interface Barangay { brgy_name: string; city_code: string; }


// --- Main Component ---
export default function SalesOrderManagementModule() {
    // State for the main form data
    const [form, setForm] = useState<FormData>({
        firstName: '', lastName: '', email: '', phone: '',
        street: '', province: '', city: '', barangay: '', postal: '',
        propertyType: '', roomUse: '', roomLength: '', roomWidth: '', ceilingHeight: '',
        sunExposure: '', insulation: '', occupants: '',
        supplyVoltage: '', breaker: '', unitType: '', budget: '', notes: '',
        preferredDate: '', preferredTime: '', attachments: null,
    });

    // --- State for Address Data ---
    // Holds the full list of data fetched from JSON files
    const [allProvinces, setAllProvinces] = useState<Province[]>([]);
    const [allCities, setAllCities] = useState<City[]>([]);
    const [allBarangays, setAllBarangays] = useState<Barangay[]>([]);

    // Holds the filtered options for the dropdowns
    const [cityOptions, setCityOptions] = useState<City[]>([]);
    const [barangayOptions, setBarangayOptions] = useState<Barangay[]>([]);

    // State for the dynamic list of windows
    const [windows, setWindows] = useState<WindowData[]>([{ width: '', height: '', direction: 'North' }]);

    // State for calculated values
    const [roomVolume, setRoomVolume] = useState(0);
    const [coolingCapacity, setCoolingCapacity] = useState(0);

    // --- Static Dropdown Options ---
    const propertyTypes = ['Residential - House', 'Residential - Condo', 'Commercial'];
    const roomUses = ['Bedroom', 'Living Room', 'Office'];
    const sunExposures = ['Low', 'Medium', 'High'];
    const insulationLevels = ['None', 'Basic', 'Advanced'];
    const windowDirections = ['North', 'South', 'East', 'West'];
    const supplyVoltages = ['110V', '220V'];
    const unitTypes = ['Window Type', 'Split Type', 'Portable'];

    // --- Effect Hooks ---

    // Effect for real-time room calculations
    useEffect(() => {
        const length = parseFloat(form.roomLength) || 0;
        const width = parseFloat(form.roomWidth) || 0;
        const height = parseFloat(form.ceilingHeight) || 0;
        const volume = length * width * height;
        const areaSqM = length * width;
        const btuNeeded = areaSqM * 600;
        const hp = btuNeeded / 9000;

        setRoomVolume(volume);
        setCoolingCapacity(hp);
    }, [form.roomLength, form.roomWidth, form.ceilingHeight]);

    // **CHANGE**: Fetch all address data ONCE when the component mounts
    useEffect(() => {
        const fetchAddressData = async () => {
            try {
                const [provinceRes, cityRes, barangayRes] = await Promise.all([
                    axios.get('/province.json'),
                    axios.get('/city.json'),
                    axios.get('/barangay.json')
                ]);
                setAllProvinces(provinceRes.data);
                setAllCities(cityRes.data);
                setAllBarangays(barangayRes.data);
            } catch (error) {
                console.error("Failed to fetch address data", error);
            }
        };
        fetchAddressData();
    }, []);

    // **CHANGE**: Effect to update cities when a province is selected
    useEffect(() => {
        if (form.province) {
            const selectedProvince = allProvinces.find(p => p.province_name === form.province);
            if (selectedProvince) {
                const filteredCities = allCities.filter(city =>
                    String(city.province_code) === String(selectedProvince.province_code)
                );
                setCityOptions(filteredCities);
            }
        } else {
            setCityOptions([]); // Clear cities if no province is selected
        }
        setBarangayOptions([]); // Always clear barangays when province changes
    }, [form.province, allProvinces, allCities]);

    // **CHANGE**: Effect to update barangays when a city is selected
    useEffect(() => {
        if (form.city) {
            const selectedCity = allCities.find(c => c.city_name === form.city);
            if (selectedCity) {
                // By converting both to strings, the comparison will work regardless of original data type.
                const filteredBarangays = allBarangays.filter(brgy =>
                    String(brgy.city_code) === String(selectedCity.city_code)
                );
                setBarangayOptions(filteredBarangays);
            }
        } else {
            setBarangayOptions([]); // Clear barangays if no city is selected
        }
    }, [form.city, allCities, allBarangays]);


    // --- Event Handlers ---

    // **CHANGE**: Updated handler to reset child fields on change
    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;

        if (type === 'file') {
            const { files } = e.target as HTMLInputElement;
            setForm(f => ({ ...f, [name]: files }));
        } else {
            setForm(prevForm => {
                const newForm = { ...prevForm, [name]: value };

                // When province changes, reset city and barangay
                if (name === 'province') {
                    newForm.city = '';
                    newForm.barangay = '';
                }
                // When city changes, reset barangay
                if (name === 'city') {
                    newForm.barangay = '';
                }

                return newForm;
            });
        }
    };

    const handleWindowChange = (index: number, e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const updatedWindows = [...windows];
        updatedWindows[index] = { ...updatedWindows[index], [name]: value };
        setWindows(updatedWindows);
    };

    const addWindow = () => {
        setWindows([...windows, { width: '', height: '', direction: 'North' }]);
    };

    const removeWindow = (index: number) => {
        if (windows.length <= 1) return;
        const updatedWindows = windows.filter((_, i) => i !== index);
        setWindows(updatedWindows);
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        const fullSubmissionData = {
            ...form,
            windows,
            calculated: {
                roomVolume: roomVolume.toFixed(2),
                coolingCapacity: coolingCapacity.toFixed(2),
            }
        };
        console.log('Form Submitted:', fullSubmissionData);
        alert('Form data has been logged to the console.');
        // TODO: Add API call to send data to the server
    };

    return (
        <form className="space-y-6 p-6 bg-white rounded shadow" onSubmit={handleSubmit}>
            {/* 1) Client Information */}
            <section className="border rounded p-4">
                <h2 className="font-bold mb-2">1) Client Information</h2>
                <div className="grid grid-cols-2 gap-4">
                    <label className="block w-full">First Name *<Input name="firstName" value={form.firstName} onChange={handleChange} required /></label>
                    <label className="block w-full">Last Name *<Input name="lastName" value={form.lastName} onChange={handleChange} required /></label>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-2">
                    <label className="block w-full">Email<Input name="email" value={form.email} onChange={handleChange} type="email" /></label>
                    <label className="block w-full">Phone *<Input name="phone" value={form.phone} onChange={handleChange} required /></label>
                </div>
            </section>

            {/* 2) Installation Address */}
            <section className="border rounded p-4">
                <h2 className="font-bold mb-2">2) Installation Address</h2>
                <label className="block w-full mb-2">Street Address *<Input name="street" value={form.street} onChange={handleChange} required /></label>
                <div className="grid grid-cols-2 gap-4 mt-2">
                    <label className="block w-full">Province/State
                        <select name="province" value={form.province} onChange={handleChange} className="border rounded p-2 h-10 w-full mt-1">
                            <option value="">Select Province/State</option>
                            {allProvinces.map((province, index) => (
                                <option key={`${province.province_code}-${index}`} value={province.province_name}>{province.province_name}</option>
                            ))}
                        </select>
                    </label>
                    <label className="block w-full">City/Municipality *
                        <select name="city" value={form.city} onChange={handleChange} className="border rounded p-2 h-10 w-full mt-1" required disabled={!form.province}>
                            <option value="">Select City/Municipality</option>
                            {cityOptions.map((city) => (
                                <option key={city.city_code} value={city.city_name}>{city.city_name}</option>
                            ))}
                        </select>
                    </label>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-2">
                    <label className="block w-full">Barangay *
                        <select name="barangay" value={form.barangay} onChange={handleChange} className="border rounded p-2 h-10 w-full mt-1" required disabled={!form.city}>
                            <option value="">Select Barangay</option>
                            {barangayOptions.map((barangay, index) => (
                                <option key={`${barangay.city_code}-${index}`} value={barangay.brgy_name}>{barangay.brgy_name}</option>
                            ))}
                        </select>
                    </label>
                    <label className="block w-full">Postal Code<Input name="postal" value={form.postal} onChange={handleChange} /></label>
                </div>
            </section>

            {/* Sections 3, 4, 5, and Action Buttons remain the same as the previous correct version */}
            {/* For brevity, they are not repeated here. Paste the JSX for sections 3-5 and the action buttons from the previous response. */}

            {/* 3) Property & Room Details (Paste Here) */}
            <section className="border rounded p-4 space-y-4">
                <h2 className="font-bold mb-2">3) Property & Room Details</h2>
                <div className="grid grid-cols-2 gap-4">
                    <label className="block w-full">Property Type
                        <select name="propertyType" value={form.propertyType} onChange={handleChange} className="border rounded p-2 h-10 w-full mt-1">
                            <option value="">Select Property Type</option>
                            {propertyTypes.map((type) => <option key={type} value={type}>{type}</option>)}
                        </select>
                    </label>
                    <label className="block w-full">Room Use
                        <select name="roomUse" value={form.roomUse} onChange={handleChange} className="border rounded p-2 h-10 w-full mt-1">
                            <option value="">Select Room Use</option>
                            {roomUses.map((use) => <option key={use} value={use}>{use}</option>)}
                        </select>
                    </label>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <label className="block w-full">Room Length (m) *<Input name="roomLength" value={form.roomLength} onChange={handleChange} required type="number" step="0.1" /></label>
                    <label className="block w-full">Room Width (m) *<Input name="roomWidth" value={form.roomWidth} onChange={handleChange} required type="number" step="0.1" /></label>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <label className="block w-full">Ceiling Height (m) *<Input name="ceilingHeight" value={form.ceilingHeight} onChange={handleChange} required type="number" step="0.1" /></label>
                    <label className="block w-full">Sun Exposure
                        <select name="sunExposure" value={form.sunExposure} onChange={handleChange} className="border rounded p-2 h-10 w-full mt-1">
                            <option value="">Select Sun Exposure</option>
                            {sunExposures.map((exp: string) => <option key={exp} value={exp}>{exp}</option>)}
                        </select>
                    </label>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <label className="block w-full">Insulation
                        <select name="insulation" value={form.insulation} onChange={handleChange} className="border rounded p-2 h-10 w-full mt-1">
                            <option value="">Select Insulation Level</option>
                            {insulationLevels.map((ins: string) => <option key={ins} value={ins}>{ins}</option>)}
                        </select>
                    </label>
                    <label className="block w-full">Typical Occupants<Input name="occupants" value={form.occupants} onChange={handleChange} type="number" /></label>
                </div>
                <div>
                    <h3 className="font-semibold text-sm mb-2">Windows</h3>
                    {windows.map((window, index) => (
                        <div key={index} className="grid grid-cols-4 gap-2 items-end mb-2 p-2 border rounded">
                            <label className="block w-full">{`W${index + 1} Width (m)`}<Input name="width" value={window.width} onChange={e => handleWindowChange(index, e)} type="number" step="0.1" /></label>
                            <label className="block w-full">{`W${index + 1} Height (m)`}<Input name="height" value={window.height} onChange={e => handleWindowChange(index, e)} type="number" step="0.1" /></label>
                            <label className="block w-full">Direction
                                <select name="direction" value={window.direction} onChange={e => handleWindowChange(index, e)} className="border rounded p-2 h-10 w-full mt-1">
                                    {windowDirections.map((dir: string) => <option key={dir} value={dir}>{dir}</option>)}
                                </select>
                            </label>
                            <Button type="button" variant="destructive" onClick={() => removeWindow(index)} disabled={windows.length <= 1}>Remove</Button>
                        </div>
                    ))}
                    <Button type="button" onClick={addWindow}>+ Add Window</Button>
                </div>
                <div className="mt-2 text-sm bg-gray-50 p-3 rounded">
                    Estimated Room Space: <b>{roomVolume.toFixed(2)} m³</b><br />
                    Estimated Cooling Capacity: <b>{coolingCapacity.toFixed(2)} HP</b>
                </div>
            </section>

            {/* 4) Electrical & Preferences (Paste Here) */}
            <section className="border rounded p-4">
                <h2 className="font-bold mb-2">4) Electrical & Preferences</h2>
                <div className="grid grid-cols-2 gap-4">
                    <label className="block w-full">Supply Voltage
                        <select name="supplyVoltage" value={form.supplyVoltage} onChange={handleChange} className="border rounded p-2 h-10 w-full mt-1">
                            <option value="">Select Voltage</option>
                            {supplyVoltages.map((voltage: string) => <option key={voltage} value={voltage}>{voltage}</option>)}
                        </select>
                    </label>
                    <label className="block w-full">Available Breaker (A)<Input name="breaker" value={form.breaker} onChange={handleChange} type="number" /></label>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-2">
                    <label className="block w-full">Preferred Unit Type
                        <select name="unitType" value={form.unitType} onChange={handleChange} className="border rounded p-2 h-10 w-full mt-1">
                            <option value="">Select Unit Type</option>
                            {unitTypes.map((unit: string) => <option key={unit} value={unit}>{unit}</option>)}
                        </select>
                    </label>
                    <label className="block w-full">Budget (₱)<Input name="budget" value={form.budget} onChange={handleChange} type="number" /></label>
                </div>
                <label className="block mb-2 mt-2">Notes</label>
                <textarea name="notes" value={form.notes} onChange={handleChange} className="w-full border rounded p-2" rows={3} />
            </section>

            {/* 5) Preferred Schedule (Paste Here) */}
            <section className="border rounded p-4">
                <h2 className="font-bold mb-2">5) Preferred Schedule</h2>
                <div className="grid grid-cols-2 gap-4">
                    <label className="block w-full">Preferred Date<Input name="preferredDate" value={form.preferredDate} onChange={handleChange} type="date" /></label>
                    <label className="block w-full">Preferred Time<Input name="preferredTime" value={form.preferredTime} onChange={handleChange} type="time" /></label>
                </div>
            </section>

            {/* Action Buttons (Paste Here) */}
            <div className="flex gap-2 mt-4">
                <Button type="button" variant="default">Save Draft</Button>
                <Button type="button" variant="default">Export JSON</Button>
                <Button type="button" variant="default">Print</Button>
                <Button type="submit" variant="default">Submit</Button>
            </div>
        </form>
    );
}