// src/modules/customer-management/components/SalesOrderManagementModule.tsx
"use client";

import React, { useState, ChangeEvent, FormEvent, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import axios from 'axios';
import AsyncSelect from 'react-select/async';

// --- Static Data Imports ---
import provincesData from "@/public/province.json";
import citiesData from "@/public/city.json";
import barangaysData from "@/public/barangay.json";

// --- Type Definitions ---

// ✅ FIX: This interface now matches what your form state (clientInfo) actually uses.
interface ClientInfo {
    id?: number;
    complete_name: string; // Changed from first_name/last_name
    email: string;
    phone: string;
    street_address: string;
    province_state: string; // This will hold the province_code
    city_municipality: string; // This will hold the city_code
    barangay: string; // This will hold the brgy_code
}

interface RoomData {
    property_type_id: number | '';
    room_use_id: number | '';
    length_m: number | '';
    width_m: number | '';
    ceiling_height_m: number | '';
    sun_exposure_id: number | '';
    insulation_type_id: number | '';
    typical_occupants: number | '';
    windows: { width_m: number | ''; height_m: number | '' }[];
}

interface RequestData {
    supply_voltage_id: number | '';
    available_breaker_amps: number | '';
    preferred_unit_type_id: number | '';
    budget_php: number | '';
    notes: string;
    preferred_date: string;
    preferred_time: string;
}

interface DropdownOption { id: number; name: string; }

// ✅ FIX: Define the shape of the customer API data
interface ApiCustomer {
    id: number;
    customer_name: string;
    customer_email: string;
    contact_number: string;
    street_address: string | null;
    province: string;
    city: string;
    brgy: string;
    [key: string]: any; // Allow other properties
}

// ✅ FIX: The 'value' is now the full ApiCustomer object
interface UserOption { label: string; value: ApiCustomer; }

interface Province { province_code: string; province_name: string; }
interface City { city_code: string; city_name: string; province_code: string; }
interface Barangay { brgy_code: string; brgy_name: string; city_code: string; }

// --- Main Component ---
export default function SalesOrderManagementModule() {
    // --- State Management ---
    // ✅ FIX: Updated initial state to match the new ClientInfo interface
    const [clientInfo, setClientInfo] = useState<ClientInfo>({
        complete_name: '', email: '', phone: '',
        street_address: '', province_state: '', city_municipality: '', barangay: ''
    });
    const [roomData, setRoomData] = useState<RoomData>({
        property_type_id: '', room_use_id: '', length_m: '', width_m: '', ceiling_height_m: 2.4,
        sun_exposure_id: '', insulation_type_id: '', typical_occupants: 1,
        windows: [{ width_m: '', height_m: '' }],
    });
    const [requestData, setRequestData] = useState<RequestData>({
        supply_voltage_id: '', available_breaker_amps: '', preferred_unit_type_id: '',
        budget_php: '', notes: '', preferred_date: '', preferred_time: '',
    });

    const [selectedUser, setSelectedUser] = useState<UserOption | null>(null);
    const [attachments, setAttachments] = useState<File[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Dropdown options from API
    const [propertyTypes, setPropertyTypes] = useState<DropdownOption[]>([]);
    const [roomUses, setRoomUses] = useState<DropdownOption[]>([]);
    const [sunExposures, setSunExposures] = useState<DropdownOption[]>([]);
    const [insulationTypes, setInsulationTypes] = useState<DropdownOption[]>([]);
    const [supplyVoltages, setSupplyVoltages] = useState<DropdownOption[]>([]);
    const [acUnitTypes, setAcUnitTypes] = useState<DropdownOption[]>([]);

    // Calculated values
    const [roomVolume, setRoomVolume] = useState(0);
    const [coolingCapacity, setCoolingCapacity] = useState(0);

    // Filtered address options
    const [filteredCities, setFilteredCities] = useState<City[]>([]);
    const [filteredBarangays, setFilteredBarangays] = useState<Barangay[]>([]);

    // --- Effect Hooks ---

    useEffect(() => {
        const length = Number(roomData.length_m) || 0;
        const width = Number(roomData.width_m) || 0;
        const height = Number(roomData.ceiling_height_m) || 0;
        setRoomVolume(length * width * height);
        // Using a common estimation formula: (L * W * AreaFactor) / 12000 BTU/hr per Ton. Here using a simplified HP calc.
        setCoolingCapacity((length * width * 600) / 9000);
    }, [roomData.length_m, roomData.width_m, roomData.ceiling_height_m]);

    useEffect(() => {
        const fetchDropdownData = async () => {
            try {
                const API_BASE_URL = 'http://100.119.3.44:8090/items';
                const [
                    roomUseRes, propTypeRes, sunExpRes, insulationRes, voltageRes, unitTypeRes
                ] = await Promise.all([
                    axios.get(`${API_BASE_URL}/room_uses`),
                    axios.get(`${API_BASE_URL}/property_types`),
                    axios.get(`${API_BASE_URL}/sun_exposures`),
                    axios.get(`${API_BASE_URL}/insulation_types`),
                    axios.get(`${API_BASE_URL}/supply_voltages`),
                    axios.get(`${API_BASE_URL}/ac_unit_types`)
                ]);

                setRoomUses(roomUseRes.data.data.map((item: any) => ({ id: item.id, name: item.name })));
                setPropertyTypes(propTypeRes.data.data.map((item: any) => ({ id: item.id, name: item.name })));
                setSunExposures(sunExpRes.data.data.map((item: any) => ({ id: item.id, name: item.level })));
                setInsulationTypes(insulationRes.data.data.map((item: any) => ({ id: item.id, name: item.type })));
                setSupplyVoltages(voltageRes.data.data.map((item: any) => ({ id: item.id, name: item.voltage_range })));
                setAcUnitTypes(unitTypeRes.data.data.map((item: any) => ({ id: item.id, name: item.type })));
            } catch (error) {
                console.error("Failed to fetch dropdown data:", error);
                alert("Could not load form options. Please check the connection and refresh.");
            }
        };
        fetchDropdownData();
    }, []);

    // --- Event Handlers ---

    // ✅ FIX: This function now correctly types the response and returns the full 'user' object as the value.
    const loadUserOptions = async (inputValue: string): Promise<UserOption[]> => {
        if (inputValue.length < 2) return [];
        try {
            // Updated to use new customer API and fields
            const response = await axios.get(`http://100.119.3.44:8090/items/customer?search=${inputValue}`);
            const users = response.data.data || [];
            return users.map((user: ApiCustomer) => ({
                label: `${user.customer_name} (${user.customer_email})`,
                value: user // The value is the full customer object
            }));
        } catch (error) {
            console.error("Failed to fetch users", error);
            return [];
        }
    };

    // ✅ FIX: This function is entirely replaced.
    // It no longer makes a new API call.
    // It uses the data from 'selectedOption.value' to populate all fields and dropdowns.
    const handleUserSelect = (selectedOption: UserOption | null) => {
        setSelectedUser(selectedOption);
        if (!selectedOption) {
            clearForm();
            return;
        }

        // No fetch needed! Data is already here.
        const clientData = selectedOption.value; // clientData is the full ApiCustomer object

        // --- Find Codes from Names ---
        const allProvinces = provincesData as Province[];
        const allCities = citiesData as City[];
        const allBarangays = barangaysData as Barangay[];

        // 1. Find Province Code from Name
        const provinceCode = allProvinces.find(p => p.province_name.toLowerCase() === clientData.province?.toLowerCase())?.province_code || "";

        // 2. Filter Cities based on Province Code
        const citiesForProvince = provinceCode ? allCities.filter(c => c.province_code === provinceCode) : [];
        setFilteredCities(citiesForProvince); // Update dropdown state

        // 3. Find City Code from Name
        const cityCode = citiesForProvince.find(c => c.city_name.toLowerCase() === clientData.city?.toLowerCase())?.city_code || "";

        // 4. Filter Barangays based on City Code
        const barangaysForCity = cityCode ? allBarangays.filter(b => b.city_code === cityCode) : [];
        setFilteredBarangays(barangaysForCity); // Update dropdown state

        // 5. Find Barangay Code from Name
        const barangayCode = barangaysForCity.find(b => b.brgy_name.toLowerCase() === clientData.brgy?.toLowerCase())?.brgy_code || "";

        // --- Set Full Client State ---
        setClientInfo({
            id: clientData.id, // Store the ID for updates
            complete_name: clientData.customer_name || "",
            email: clientData.customer_email || "",
            phone: clientData.contact_number || "",
            street_address: clientData.street_address || "", // Handle null
            province_state: provinceCode, // Set the code
            city_municipality: cityCode, // Set the code
            barangay: barangayCode, // Set the code
        });
    };

    const clearForm = () => {
        // ✅ FIX: Matches the new ClientInfo state
        setClientInfo({ complete_name: '', email: '', phone: '', street_address: '', province_state: '', city_municipality: '', barangay: '' });
        setRoomData({ property_type_id: '', room_use_id: '', length_m: '', width_m: '', ceiling_height_m: 2.4, sun_exposure_id: '', insulation_type_id: '', typical_occupants: 1, windows: [{ width_m: '', height_m: '' }]});
        setRequestData({ supply_voltage_id: '', available_breaker_amps: '', preferred_unit_type_id: '', budget_php: '', notes: '', preferred_date: '', preferred_time: '' });
        setSelectedUser(null);
        setAttachments([]);
        setFilteredCities([]);
        setFilteredBarangays([]);
    };

    const handleProvinceChange = (e: ChangeEvent<HTMLSelectElement>) => {
        const provinceCode = e.target.value;
        setClientInfo(prev => ({ ...prev, province_state: provinceCode, city_municipality: "", barangay: "" }));
        setFilteredCities((citiesData as City[]).filter(city => city.province_code === provinceCode));
        setFilteredBarangays([]);
    };

    const handleCityChange = (e: ChangeEvent<HTMLSelectElement>) => {
        const cityCode = e.target.value;
        setClientInfo(prev => ({ ...prev, city_municipality: cityCode, barangay: "" }));
        setFilteredBarangays((barangaysData as Barangay[]).filter(barangay => barangay.city_code === cityCode));
    };

    const handleClientInputChange = (e: ChangeEvent<HTMLInputElement>) => setClientInfo(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handleClientSelectChange = (e: ChangeEvent<HTMLSelectElement>) => setClientInfo(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handleRoomChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setRoomData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handleRequestChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setRequestData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handleWindowChange = (index: number, e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const updatedWindows = roomData.windows.map((win, i) => i === index ? { ...win, [name]: value === '' ? '' : parseFloat(value) } : win);
        setRoomData(prev => ({ ...prev, windows: updatedWindows }));
    };
    const addWindow = () => setRoomData(prev => ({ ...prev, windows: [...prev.windows, { width_m: '', height_m: '' }] }));
    const removeWindow = (index: number) => { if (roomData.windows.length > 1) setRoomData(prev => ({ ...prev, windows: prev.windows.filter((_, i) => i !== index)})); };
    const handleAttachmentChange = (event: ChangeEvent<HTMLInputElement>) => { if (event.target.files) setAttachments(Array.from(event.target.files)); };

    // --- Form Submission Logic ---
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const API_BASE_URL = 'http://100.119.3.44:8090';

        // --- Find full string names for address parts for the payload ---
        const provinceName = (provincesData as Province[]).find(p => p.province_code === clientInfo.province_state)?.province_name || '';
        const cityName = (citiesData as City[]).find(c => c.city_code === clientInfo.city_municipality)?.city_name || '';
        const barangayName = (barangaysData as Barangay[]).find(b => b.brgy_code === clientInfo.barangay)?.brgy_name || '';

        if (!provinceName || !cityName || !barangayName) {
            alert("Please ensure a valid Province, City, and Barangay are selected.");
            setIsSubmitting(false);
            return;
        }

        try {
            // --- STEP 1: Create or Update Customer ---
            let customerId: number;
            const customerPayload = {
                customer_name: clientInfo.complete_name,
                contact_number: clientInfo.phone,
                customer_email: clientInfo.email,
                street_address: clientInfo.street_address,
                province: provinceName,
                city: cityName,
                brgy: barangayName,
            };

            if (clientInfo.id) {
                // UPDATE existing customer
                const response = await axios.patch(`${API_BASE_URL}/items/customer/${clientInfo.id}`, customerPayload);
                customerId = response.data.data.id;
            } else {
                // CREATE new customer
                const response = await axios.post(`${API_BASE_URL}/items/customer`, customerPayload);
                customerId = response.data.data.id;
            }

            if (!customerId) throw new Error("Could not save customer information.");

            console.log("Customer ID:", customerId); // Log the customer ID for debugging

            // --- STEP 2: Create Installation Request ---
            // Fetch existing installation requests to determine the next ir_code
            const existingRequestsResponse = await axios.get(`${API_BASE_URL}/items/installation_requests?fields=ir_code`);
            const existingRequests = existingRequestsResponse.data.data || [];

            // Determine the highest ir_code and generate the next one
            const highestIrCode = existingRequests
                .map((req: { ir_code: string }) => parseInt(req.ir_code?.split('-')[1] || '0', 10))
                .filter((num) => !isNaN(num))
                .reduce((max, num) => Math.max(max, num), 0);

            const nextIrCode = `SO-${(highestIrCode + 1).toString().padStart(4, '0')}`;

            // Add the generated ir_code to the payload
            const installationRequestPayload = {
                client_id: customerId,
                supply_voltage_id: requestData.supply_voltage_id || null,
                available_breaker_amps: requestData.available_breaker_amps || null,
                preferred_unit_type_id: requestData.preferred_unit_type_id || null,
                budget_php: requestData.budget_php || null,
                notes: requestData.notes,
                preferred_date: requestData.preferred_date || null,
                preferred_time: requestData.preferred_time || null,
                room_data: {
                    ...roomData,
                    windows: roomData.windows.filter(w => w.width_m && w.height_m) // Clean up empty windows
                },
                ir_code: nextIrCode // Include the generated ir_code
            };

            console.log("Generated ir_code:", nextIrCode); // Log the generated ir_code for debugging
            console.log("Installation Request Payload:", installationRequestPayload); // Log the payload for debugging

            const requestResponse = await axios.post(`${API_BASE_URL}/items/installation_requests`, installationRequestPayload);
            const newRequestId = requestResponse.data.data.id;
            console.log("Created installation request:", requestResponse.data.data);

            if (!newRequestId) throw new Error("Could not create the installation request.");

            // --- STEP 3 & 4: Upload and Link Attachments ---
            if (attachments.length > 0) {
                const uploadPromises = attachments.map(file => {
                    const formData = new FormData();
                    formData.append('file', file);
                    return axios.post(`${API_BASE_URL}/files`, formData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });
                });

                const uploadResults = await Promise.all(uploadPromises);
                console.log("File upload successful:", uploadResults);

                const attachmentPayloads = uploadResults.map((result, index) => {
                    const uploadedFile = result.data.data;
                    const originalFile = attachments[index];
                    return {
                        request_id: newRequestId,
                        file_name: originalFile.name,
                        file_path: uploadedFile.id,
                        file_type: originalFile.type,
                        file_size_bytes: originalFile.size,
                    };
                });

                await axios.post(`${API_BASE_URL}/items/attachments`, attachmentPayloads);
                console.log("Attachment records created.");
            }

            // --- SUCCESS ---
            alert("Request submitted successfully!");
            clearForm();

        } catch (error: any) {
            console.error("Submission failed:", error);
            const errorMessage = axios.isAxiosError(error)
                ? error.response?.data?.errors?.[0]?.message || error.message
                : error.message;
            alert(`An error occurred: ${errorMessage}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- JSX Return ---
    return (
        <form className="space-y-6 p-6 bg-white rounded shadow-lg" onSubmit={handleSubmit}>

            <div className="space-y-2 p-4 border rounded bg-slate-50">
                <Label htmlFor="clientSearch" className="font-semibold">Search Existing Client</Label>
                <AsyncSelect id="clientSearch" cacheOptions defaultOptions loadOptions={loadUserOptions} onChange={handleUserSelect} value={selectedUser} placeholder="Type a name or email to search..." isClearable instanceId="clientSearch" />
                <Button type="button" onClick={clearForm} variant="outline" className="mt-2">Clear Form / New Client</Button>
            </div>

            <section className="border rounded p-4">
                <h2 className="font-bold mb-2">1) Client Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* ✅ FIX: Field name is 'complete_name' */}
                    <Label>Complete Name *<Input name="complete_name" value={clientInfo.complete_name || ''} onChange={handleClientInputChange} required /></Label>
                    <Label>Email<Input name="email" value={clientInfo.email} onChange={handleClientInputChange} type="email" /></Label>
                    <Label>Phone *<Input name="phone" value={clientInfo.phone} onChange={handleClientInputChange} required /></Label>
                </div>
            </section>

            <section className="border rounded p-4">
                <h2 className="font-bold mb-2">2) Installation Address</h2>
                <Label className="block w-full mb-2">Street Address *<Input name="street_address" value={clientInfo.street_address} onChange={handleClientInputChange} required /></Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    <Label>Province *
                        <select name="province_state" value={clientInfo.province_state} onChange={handleProvinceChange} className="border rounded p-2 h-10 w-full mt-1" required>
                            <option value="">Select Province</option>{(provincesData as Province[]).map((p, index) => (<option key={`${p.province_code}-${index}`} value={p.province_code}>{p.province_name}</option>))}</select>
                    </Label>
                    <Label>City/Municipality *
                        <select name="city_municipality" value={clientInfo.city_municipality} onChange={handleCityChange} className="border rounded p-2 h-10 w-full mt-1" required disabled={!clientInfo.province_state}>
                            <option value="">Select City/Municipality</option>
                            {filteredCities.map(c => <option key={c.city_code} value={c.city_code}>{c.city_name}</option>)}
                        </select>
                    </Label>
                    <Label>Barangay *
                        <select name="barangay" value={clientInfo.barangay} onChange={handleClientSelectChange} className="border rounded p-2 h-10 w-full mt-1" required disabled={!clientInfo.city_municipality}>
                            <option value="">Select Barangay</option>
                            {filteredBarangays.map(b => <option key={b.brgy_code} value={b.brgy_code}>{b.brgy_name}</option>)}
                        </select>
                    </Label>
                </div>
            </section>

            {/* ... (Rest of your component remains unchanged) ... */}

            <section className="border rounded p-4 space-y-4">
                <h2 className="font-bold mb-2">3) Property & Room Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Label>Property Type *
                        <select name="property_type_id" value={roomData.property_type_id} onChange={handleRoomChange} className="border rounded p-2 h-10 w-full mt-1" required>
                            <option value="" disabled>Select Property Type</option>
                            {propertyTypes.map(opt => <option key={opt.id} value={opt.id}>{opt.name}</option>)}
                        </select>
                    </Label>
                    <Label>Room Use *
                        <select name="room_use_id" value={roomData.room_use_id} onChange={handleRoomChange} className="border rounded p-2 h-10 w-full mt-1" required>
                            <option value="" disabled>Select Room Use</option>
                            {roomUses.map(opt => <option key={opt.id} value={opt.id}>{opt.name}</option>)}
                        </select>
                    </Label>
                    <Label>Room Length (m) *<Input name="length_m" value={roomData.length_m} onChange={handleRoomChange} required type="number" step="0.1" /></Label>
                    <Label>Room Width (m) *<Input name="width_m" value={roomData.width_m} onChange={handleRoomChange} required type="number" step="0.1" /></Label>
                    <Label>Ceiling Height (m) *<Input name="ceiling_height_m" value={roomData.ceiling_height_m} onChange={handleRoomChange} required type="number" step="0.1" /></Label>
                    <Label>Sun Exposure *
                        <select name="sun_exposure_id" value={roomData.sun_exposure_id} onChange={handleRoomChange} className="border rounded p-2 h-10 w-full mt-1" required>
                            <option value="" disabled>Select Sun Exposure</option>
                            {sunExposures.map(opt => <option key={opt.id} value={opt.id}>{opt.name}</option>)}
                        </select>
                    </Label>
                    <Label>Insulation *
                        <select name="insulation_type_id" value={roomData.insulation_type_id} onChange={handleRoomChange} className="border rounded p-2 h-10 w-full mt-1" required>
                            <option value="" disabled>Select Insulation</option>
                            {insulationTypes.map(opt => <option key={opt.id} value={opt.id}>{opt.name}</option>)}
                        </select>
                    </Label>
                    <Label>Typical Occupants *<Input name="typical_occupants" value={roomData.typical_occupants} onChange={handleRoomChange} required type="number" min="1" /></Label>
                </div>
                <div>
                    <h3 className="font-semibold text-sm mb-2">Windows</h3>
                    {roomData.windows.map((window, index) => (
                        <div key={index} className="grid grid-cols-3 gap-2 items-end mb-2 p-2 border rounded">
                            <Label>Width (m)<Input name="width_m" value={window.width_m} onChange={e => handleWindowChange(index, e)} type="number" step="0.1" /></Label>
                            <Label>Height (m)<Input name="height_m" value={window.height_m} onChange={e => handleWindowChange(index, e)} type="number" step="0.1" /></Label>
                            <Button type="button" variant="destructive" onClick={() => removeWindow(index)} disabled={roomData.windows.length <= 1}>Remove</Button>
                        </div>
                    ))}
                    <Button type="button" onClick={addWindow}>+ Add Window</Button>
                </div>
                <div className="mt-2 text-sm bg-gray-50 p-3 rounded">Estimated Room Space: <b>{roomVolume.toFixed(2)} m³</b> | Estimated Cooling Capacity: <b>{coolingCapacity.toFixed(2)} HP</b></div>
            </section>

            <section className="border rounded p-4 space-y-4">
                <h2 className="font-bold mb-2">4) Electrical & Preferences</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Label>Supply Voltage
                        <select name="supply_voltage_id" value={requestData.supply_voltage_id} onChange={handleRequestChange} className="border rounded p-2 h-10 w-full mt-1">
                            <option value="">Select Voltage</option>
                            {supplyVoltages.map(opt => <option key={opt.id} value={opt.id}>{opt.name}</option>)}
                        </select>
                    </Label>
                    <Label>Available Breaker (A)<Input name="available_breaker_amps" value={requestData.available_breaker_amps} onChange={handleRequestChange} type="number" /></Label>
                    <Label>Preferred Unit Type
                        <select name="preferred_unit_type_id" value={requestData.preferred_unit_type_id} onChange={handleRequestChange} className="border rounded p-2 h-10 w-full mt-1">
                            <option value="">Select Unit Type</option>
                            {acUnitTypes.map(opt => <option key={opt.id} value={opt.id}>{opt.name}</option>)}
                        </select>
                    </Label>
                    <Label>Budget (₱)<Input name="budget_php" value={requestData.budget_php} onChange={handleRequestChange} type="number" /></Label>
                </div>
                <Label>Notes<textarea name="notes" value={requestData.notes} onChange={handleRequestChange} className="w-full border rounded p-2" rows={3} placeholder="Additional preferences or notes..."></textarea></Label>
            </section>

            <section className="border rounded p-4">
                <h2 className="font-bold mb-2">5) Preferred Schedule</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Label>Preferred Date<Input name="preferred_date" value={requestData.preferred_date} onChange={handleRequestChange} type="date" /></Label>
                    <Label>Preferred Time<Input name="preferred_time" value={requestData.preferred_time} onChange={handleRequestChange} type="time" /></Label>
                </div>
            </section>

            <section className="border rounded p-4">
                <h2 className="font-bold mb-2">6) Attachments (optional)</h2>
                <Label htmlFor="attachments">Photos of Room/Window/Outdoor Area</Label>
                <Input id="attachments" type="file" multiple onChange={handleAttachmentChange} />
                <div className="flex gap-2 mt-2 flex-wrap">
                    {attachments.map((file, index) => (<img key={index} src={URL.createObjectURL(file)} alt={`Preview ${index + 1}`} className="w-24 h-24 object-cover rounded" />))}
                </div>
            </section>

            <div className="flex gap-2 mt-4 justify-end">
                <Button type="submit" size="lg" disabled={isSubmitting}>
                    {isSubmitting ? 'Submitting...' : 'Submit Request'}
                </Button>
            </div>
        </form>
    );
}