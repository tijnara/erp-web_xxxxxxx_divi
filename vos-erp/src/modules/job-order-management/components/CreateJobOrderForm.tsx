// src/modules/customer-management/components/CreateJobOrderForm.tsx
"use client";

import React, { useState, type FC, type FormEvent, useEffect } from 'react';
import { PlusCircle } from 'lucide-react';
import { JobOrderDetail, JobOrderAssignment, PartialJobOrder, InstallationRequest } from '../types'; // Adjusted import
import DetailRow from './DetailRow';
import AssignmentRow from './AssignmentRow';

const CreateJobOrderForm: FC = () => {
    // --- State Definitions ---
    const [jobOrder, setJobOrder] = useState<PartialJobOrder>({
        jo_no: `JO-${Date.now()}`, // Initial temporary JO number
        service_type: 'Installation',
        status: 'Pending', // Default status, ensure this exists in jo_status_types
        order_date: new Date().toISOString().slice(0, 16), // Default to now
        site_address: '',
        site_contact_name: '',
        site_contact_phone: '',
        remarks: '',
        sales_order_id: undefined, // Explicitly undefined initially
        customer_id: undefined, // Explicitly undefined initially
    });

    const [details, setDetails] = useState<JobOrderDetail[]>([]);
    const [assignments, setAssignments] = useState<JobOrderAssignment[]>([]);
    const [installationRequests, setInstallationRequests] = useState<InstallationRequest[]>([]);
    const [customerNameMap, setCustomerNameMap] = useState<Record<number, string>>({});
    const [consumableItems, setConsumableItems] = useState<{ item_id: number; item_name: string; unit_cost: string | number }[]>([]);
    const [products, setProducts] = useState<{ product_id: number; product_name: string; price_per_unit: string | number }[]>([]);
    // const [salesOrders, setSalesOrders] = useState<{ id: number; order_no: string }[]>([]); // Removed this, using installationRequests state

    // --- Effects ---

    // ✅ MODIFIED: Fetch Installation Requests AND Job Orders to filter the dropdown
    useEffect(() => {
        const fetchAndFilterRequests = async () => {
            try {
                // 1. Fetch all Installation Requests
                const requestRes = await fetch('http://100.119.3.44:8090/items/installation_requests?limit=-1&fields=id,ir_code'); // Fetch only needed fields
                if (!requestRes.ok) throw new Error('Failed to fetch Sales Order');
                const requestData = await requestRes.json();
                const allRequests: InstallationRequest[] = requestData.data || [];

                // 2. Fetch all Job Orders (just the linked sales_order_id)
                const jobOrderRes = await fetch('http://100.119.3.44:8090/items/job_order?limit=-1&fields=sales_order_id');
                if (!jobOrderRes.ok) throw new Error('Failed to fetch Job Orders');
                const jobOrderData = await jobOrderRes.json();

                // 3. Create a Set of Installation Request IDs that are already used in Job Orders
                const usedRequestIds = new Set(

                    (jobOrderData.data || [])
                        .map((jo: { sales_order_id: number | null }) => jo.sales_order_id)
                        .filter((id): id is number => id !== null) // Filter out null/undefined IDs and ensure type is number
                );

                // 4. Filter the Installation Requests list
                const availableRequests = allRequests.filter(req => !usedRequestIds.has(req.id));

                // 5. Set the state with the filtered list
                setInstallationRequests(availableRequests);

            } catch (error) {
                console.error('Error fetching data for dropdown filter:', error);
                // Optionally set all requests if filtering fails, or handle error appropriately
                // fetch('http://100.119.3.44:8090/items/installation_requests?limit=-1&fields=id,ir_code')
                //  .then(res => res.json()).then(data => setInstallationRequests(data.data || []));
            }
        };

        fetchAndFilterRequests();
    }, []); // Run only once on mount

    // Generate unique Job Order number based on year and sequence
    useEffect(() => {
        const currentYear = 2025; // Or dynamically get year: new Date().getFullYear()
        fetch(`http://100.119.3.44:8090/items/job_order?filter[jo_year][_eq]=${currentYear}&fields=jo_no&limit=-1`) // Fetch all for the year
            .then((res) => res.json())
            .then((data) => {
                const jobOrders = data.data || [];
                let maxSeq = 0;
                jobOrders.forEach((order: { jo_no: string }) => {
                    const match = order.jo_no?.match(/^JO-2025-(\d{4})$/);
                    if (match) {
                        const seq = parseInt(match[1], 10);
                        if (seq > maxSeq) maxSeq = seq;
                    }
                });
                const nextSeq = (maxSeq + 1).toString().padStart(4, '0');
                const nextJoNo = `JO-2025-${nextSeq}`;
                setJobOrder((prev) => ({ ...prev, jo_no: nextJoNo }));
            });
    }, []);

    // Fetch customer names for display purposes
    useEffect(() => {
        fetch('http://100.119.3.44:8090/items/customer?fields=id,customer_name&limit=-1') // Fetch only needed fields
            .then((res) => res.json())
            .then((data) => {
                const customers = data.data || [];
                const map: Record<number, string> = {};
                customers.forEach((customer: { id: number; customer_name: string }) => {
                    map[customer.id] = customer.customer_name;
                });
                setCustomerNameMap(map);
            })
            .catch((error) => {
                console.error('Error fetching customer data:', error);
            });
    }, []);

    // Fetch items for Job Details dropdowns
    useEffect(() => {
        // Fetch consumable items
        fetch('http://100.119.3.44:8090/items/consumable_item?fields=item_id,item_name,unit_cost&limit=-1')
            .then((res) => res.json())
            .then((data) => {
                setConsumableItems(data.data || []);
            })
            .catch((error) => {
                console.error('Error fetching consumable items:', error);
            });

        // Fetch products
        fetch('http://100.119.3.44:8090/items/products?fields=product_id,product_name,price_per_unit&limit=-1')
            .then((res) => res.json())
            .then((data) => {
                setProducts(data.data || []);
            })
            .catch((error) => {
                console.error('Error fetching products:', error);
            });
    }, []);

    // --- Event Handlers --- (Keep handleJobOrderChange, handleDetailChange, addDetail, removeDetail, handleAssignmentChange, addAssignment, removeAssignment, handleSubmit, handleInstallationRequestChange as they were in the previous correct version)
    // Handle changes in the main Job Order fields
    const handleJobOrderChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setJobOrder((prev) => ({
            ...prev,
            // Convert foreign key IDs to numbers or undefined if empty
            [name]: name === 'sales_order_id' || name === 'customer_id' ? (value ? Number(value) : undefined) : value,
        }));
    };

    // Handle changes within a Job Detail row
    const handleDetailChange = (
        index: number,
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setDetails((prev) => {
            const copy = [...prev];
            const item = { ...copy[index] }; // Create a mutable copy of the detail item

            if (name === 'quantity') {
                item.quantity = Number(value || 0);
            } else if (name === 'unit_price') {
                item.unit_price = Number(value || 0);
            } else if (name === 'line_type') {
                item.line_type = value as JobOrderDetail['line_type'];
                // Reset related fields when type changes
                item.product_id = null;
                item.consumable_item_id = null;
                item.part_name = '';
                item.unit_price = 0;
            } else if (name === 'item_selector') { // Generic name for the dropdown selector
                const selectedItemId = value ? Number(value) : undefined;
                let selectedName = '';
                let selectedPrice = 0;

                // Clear both IDs before setting the correct one
                item.product_id = null;
                item.consumable_item_id = null;

                if (item.line_type === 'Part' && selectedItemId) {
                    const selectedConsumable = consumableItems.find(c => c.item_id === selectedItemId);
                    if (selectedConsumable) {
                        item.consumable_item_id = selectedConsumable.item_id; // Set consumable ID
                        selectedName = selectedConsumable.item_name;
                        selectedPrice = Number(selectedConsumable.unit_cost);
                    }
                } else if (item.line_type === 'Product' && selectedItemId) {
                    const selectedProduct = products.find(p => p.product_id === selectedItemId);
                    if (selectedProduct) {
                        item.product_id = selectedProduct.product_id; // Set product ID
                        selectedName = selectedProduct.product_name;
                        selectedPrice = Number(selectedProduct.price_per_unit);
                    }
                }
                item.part_name = selectedName; // Store name for all types (useful for display)
                item.unit_price = selectedPrice; // Auto-set price
            } else {
                // Handle direct input fields like part_name (for non-dropdown types), remarks
                (item as any)[name] = value;
            }

            copy[index] = item; // Update the array with the modified item
            return copy;
        });
    };

    // Add a new empty detail row
    const addDetail = () => {
        setDetails((prev) => [
            ...prev,
            { line_type: 'Part', part_name: '', quantity: 1, unit_price: 0 }, // Default to 'Part'
        ]);
    };

    // Remove a detail row by index
    const removeDetail = (index: number) => {
        setDetails((prev) => prev.filter((_, i) => i !== index));
    };

    // Handle changes within an Assignment row
    const handleAssignmentChange = (
        index: number,
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setAssignments((prev) => {
            const copy = [...prev];
            const item = { ...copy[index] };
            if (name === 'user_id') {
                item.user_id = value === '' ? '' : Number(value); // Allow empty string for input, but convert
            } else {
                (item as any)[name] = value;
            }
            copy[index] = item;
            return copy;
        });
    };

    // Add a new empty assignment row
    const addAssignment = () => {
        setAssignments((prev) => [
            ...prev,
            { user_id: '', role: 'Technician' }, // Default role
        ]);
    };

    // Remove an assignment row by index
    const removeAssignment = (index: number) => {
        setAssignments((prev) => prev.filter((_, i) => i !== index));
    };

    // Handle form submission
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        try {
            console.log('Submitting job order:', jobOrder);

            // 1. Create the main Job Order
            const jobOrderResponse = await fetch('http://100.119.3.44:8090/items/job_order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(jobOrder),
            });

            if (!jobOrderResponse.ok) {
                const errorText = await jobOrderResponse.text();
                console.error('Failed to create job order. Server response:', errorText);
                let errorDetails = errorText;
                try { const errorJson = JSON.parse(errorText); errorDetails = errorJson?.errors?.[0]?.message || errorText; } catch (e) { /* Ignore */ }
                alert(`Failed to create job order: ${errorDetails}`);
                return;
            }

            const createdJobOrderResponse = await jobOrderResponse.json();
            const createdJobOrderId = createdJobOrderResponse?.data?.id;

            if (!createdJobOrderId) {
                console.error('Created job order response did not contain an ID:', createdJobOrderResponse);
                alert('Failed to get ID from created job order.');
                return;
            }
            console.log('Created job order ID:', createdJobOrderId);

            // 2. Create Job Order Details (one by one)
            for (const detail of details) {
                const detailPayload = {
                    job_order_id: createdJobOrderId,
                    line_type: detail.line_type,
                    part_name: detail.part_name,
                    quantity: detail.quantity,
                    unit_price: detail.unit_price,
                    remarks: detail.remarks,
                    product_id: detail.line_type === 'Product' ? (detail.product_id || null) : null,
                    consumable_item_id: detail.line_type === 'Part' ? (detail.consumable_item_id || null) : null
                };

                console.log('Submitting detail:', detailPayload);

                const detailResponse = await fetch('http://100.119.3.44:8090/items/job_order_details', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(detailPayload),
                });

                if (!detailResponse.ok) {
                    const errorText = await detailResponse.text();
                    console.error(`Failed to create job order detail (${detail.part_name}). Server response:`, errorText);
                    try { const errorJson = JSON.parse(errorText); alert(`Error saving detail "${detail.part_name}": ${errorJson?.errors?.[0]?.message || errorText}`); } catch(e){ alert(`Error saving detail "${detail.part_name}": ${errorText}`); }
                    // Consider whether to stop the entire process if one detail fails
                    // return;
                }
            }

            // 3. Create Job Order Assignments (one by one)
            for (const assignment of assignments) {
                const assignmentPayload = {
                    job_order_id: createdJobOrderId,
                    user_id: assignment.user_id ? Number(assignment.user_id) : null, // Ensure numeric or null
                    role: assignment.role
                };
                console.log('Submitting assignment:', assignmentPayload);

                const assignmentResponse = await fetch('http://100.119.3.44:8090/items/job_order_assignments', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(assignmentPayload),
                });

                if (!assignmentResponse.ok) {
                    const errorText = await assignmentResponse.text();
                    console.error(`Failed to create job order assignment (User ID: ${assignment.user_id}). Server response:`, errorText);
                    try { const errorJson = JSON.parse(errorText); alert(`Error saving assignment for User ID ${assignment.user_id}: ${errorJson?.errors?.[0]?.message || errorText}`); } catch(e) { alert(`Error saving assignment for User ID ${assignment.user_id}: ${errorText}`); }
                    // Consider stopping if an assignment fails
                    // return;
                }
            }

            alert('Job order created successfully!');
            window.location.reload(); // Refresh page on success

        } catch (error) {
            console.error('An error occurred during the submit process:', error);
            alert('An unexpected error occurred. Please check the console.');
        }
    };

    // Handle selection change in the Installation Request dropdown
    const handleInstallationRequestChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { value } = e.target;
        const installationRequestId = value ? Number(value) : undefined;

        if (!installationRequestId) {
            // Reset related fields if dropdown is cleared
            setJobOrder((prev) => ({
                ...prev, sales_order_id: undefined, customer_id: undefined,
                order_date: new Date().toISOString().slice(0, 16), scheduled_start: '',
                site_contact_name: '', site_contact_phone: '', site_address: '', remarks: '',
            }));
            return;
        }

        // Set the selected Installation Request ID (stored in sales_order_id field)
        setJobOrder((prev) => ({ ...prev, sales_order_id: installationRequestId }));

        try {
            // Fetch the selected Installation Request
            const requestResponse = await fetch(`http://100.119.3.44:8090/items/installation_requests/${installationRequestId}`);
            const requestData = await requestResponse.json();
            const request = requestData.data;

            if (request && request.client_id) {
                // Fetch the associated Customer details
                const customerResponse = await fetch(`http://100.119.3.44:8090/items/customer/${request.client_id}`);
                const customerData = await customerResponse.json();
                const customer = customerData.data;

                // Format data for form fields
                const formattedOrderDate = request.created_at ? request.created_at.slice(0, 16) : new Date().toISOString().slice(0, 16);
                const scheduledDateTime = (request.preferred_date && request.preferred_time) ? `${request.preferred_date}T${request.preferred_time.slice(0, 5)}` : request.preferred_date || '';
                const addressParts = [customer?.street_address, customer?.brgy, customer?.city, customer?.province];
                const fullAddress = addressParts.filter(Boolean).join(', ');

                // Update the Job Order state with auto-populated data
                setJobOrder((prev) => ({
                    ...prev,
                    customer_id: request.client_id,
                    order_date: formattedOrderDate,
                    scheduled_start: scheduledDateTime,
                    site_contact_name: customer?.customer_name || '',
                    site_contact_phone: customer?.contact_number || '',
                    site_address: fullAddress,
                    remarks: customer?.otherDetails || '', // Use otherDetails for remarks
                }));
            }
        } catch (error) {
            console.error('Error fetching installation/customer details:', error);
            alert('Failed to load customer details for this request.');
        }
    };

    // --- Styling Classes ---
    const inputClass = 'w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200';
    const labelClass = 'block text-sm font-medium text-gray-700 mb-1';
    const sectionClass = 'p-6 bg-white rounded-xl shadow-lg';
    const sectionTitleClass = 'text-xl font-semibold text-gray-800 border-b border-gray-200 pb-3 mb-6';

    // --- JSX ---
    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            {/* Installation Request Selection */}
            <section className={sectionClass}>
                <div className="mb-4">
                    {/* Changed label back to Installation Request */}
                    <label htmlFor="sales_order_id" className="block font-medium mb-1">Sales Order</label>
                    <select
                        id="sales_order_id" name="sales_order_id" // Name links to jobOrder state
                        value={jobOrder.sales_order_id || ''}
                        onChange={handleInstallationRequestChange}
                        className="border rounded px-2 py-1 w-full"
                    >
                        <option value="">Select an Sales Order</option>
                        {/* Iterate over the filtered installationRequests state */}
                        {installationRequests.map((request) => (
                            <option key={request.id} value={request.id}>
                                {request.ir_code || `Request ID: ${request.id}`} {/* Display IR code or fallback ID */}
                            </option>
                        ))}
                    </select>
                </div>
            </section>

            {/* Core Job Order Information */}
            <section className={sectionClass}>
                <div className="mb-6 p-6 bg-white rounded-xl shadow-lg"> {/* Inner padding removed if redundant */}
                    <h2 className={sectionTitleClass}>Core Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                        <div>
                            <label htmlFor="jo_no" className="block font-medium mb-1">Job Order No.</label>
                            <input type="text" id="jo_no" name="jo_no" value={jobOrder.jo_no} readOnly className={`${inputClass} bg-gray-100 cursor-not-allowed`} />
                        </div>
                        <div>
                            <label htmlFor="customer_display" className={labelClass}>Customer</label> {/* Changed id/name for display */}
                            <input type="text" id="customer_display" name="customer_display" value={jobOrder.customer_id ? `${customerNameMap[jobOrder.customer_id] || 'Loading...'}` : ''} readOnly className={`${inputClass} bg-gray-100 cursor-not-allowed`} placeholder="Auto-populates" />
                        </div>
                        <div>
                            <label htmlFor="service_type" className={labelClass}>Service Type</label>
                            <select id="service_type" name="service_type" value={jobOrder.service_type || 'Installation'} onChange={handleJobOrderChange} className={inputClass}>
                                <option>Installation</option> <option>Repair</option> <option>Maintenance</option> <option>DeliveryOnly</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="order_date" className={labelClass}>Order Date</label>
                            <input type="datetime-local" id="order_date" name="order_date" value={jobOrder.order_date || ''} onChange={handleJobOrderChange} className={inputClass} required />
                        </div>
                        <div>
                            <label htmlFor="scheduled_start" className={labelClass}>Scheduled Start</label>
                            <input type="datetime-local" id="scheduled_start" name="scheduled_start" value={jobOrder.scheduled_start || ''} onChange={handleJobOrderChange} className={inputClass} />
                        </div>
                        <div>
                            <label htmlFor="status" className={labelClass}>Status</label>
                            <input type="text" id="status" name="status" value={jobOrder.status || 'Pending'} onChange={handleJobOrderChange} className={`${inputClass} bg-gray-100 cursor-not-allowed`} readOnly />
                        </div>
                    </div>
                </div>
            </section>

            {/* Site & Contact Information */}
            <section className={sectionClass}>
                <h2 className={sectionTitleClass}>Site & Contact Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="site_contact_name" className={labelClass}>Site Contact Name</label>
                        <input type="text" id="site_contact_name" name="site_contact_name" value={jobOrder.site_contact_name || ''} onChange={handleJobOrderChange} className={inputClass} placeholder="e.g., Jane Doe" />
                    </div>
                    <div>
                        <label htmlFor="site_contact_phone" className={labelClass}>Site Contact Phone</label>
                        <input type="tel" id="site_contact_phone" name="site_contact_phone" value={jobOrder.site_contact_phone || ''} onChange={handleJobOrderChange} className={inputClass} placeholder="e.g., 09171234567" />
                    </div>
                    <div className="md:col-span-2">
                        <label htmlFor="site_address" className={labelClass}>Site Address</label>
                        <textarea id="site_address" name="site_address" rows={3} value={jobOrder.site_address || ''} onChange={handleJobOrderChange} className={inputClass} placeholder="Full address of the job site" required />
                    </div>
                    <div className="md:col-span-2">
                        <label htmlFor="remarks" className={labelClass}>Remarks / Notes</label>
                        <textarea id="remarks" name="remarks" rows={4} value={jobOrder.remarks || ''} onChange={handleJobOrderChange} className={inputClass} placeholder="Any special instructions, reported issues, or notes..." />
                    </div>
                </div>
            </section>

            {/* Job Details (Parts, Products, Labor) */}
            <section className={sectionClass}>
                <div className="flex flex-wrap justify-between items-center gap-4 mb-6 border-b border-gray-200 pb-3">
                    <h2 className={sectionTitleClass} style={{ marginBottom: 0, borderBottom: 'none' }}>Job Details (Parts & Labor)</h2>
                    <button type="button" onClick={addDetail} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition-transform transform hover:scale-105">
                        <PlusCircle size={20} /> Add Item
                    </button>
                </div>
                <div className="space-y-4">
                    {details.map((detail, index) => (
                        <DetailRow
                            key={index} detail={detail} index={index}
                            onChange={handleDetailChange} onRemove={removeDetail}
                            consumableItems={consumableItems} products={products}
                        />
                    ))}
                    {details.length === 0 && <p className="text-center text-gray-500 py-6">No parts or labor have been added.</p>}
                </div>
            </section>

            {/* Technician Assignments */}
            <section className={sectionClass}>
                <div className="flex flex-wrap justify-between items-center gap-4 mb-6 border-b border-gray-200 pb-3">
                    <h2 className={sectionTitleClass} style={{ marginBottom: 0, borderBottom: 'none' }}>Assign Technicians</h2>
                    <button type="button" onClick={addAssignment} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition-transform transform hover:scale-105">
                        <PlusCircle size={20} /> Assign Staff
                    </button>
                </div>
                <div className="space-y-4">
                    {assignments.map((assignment, index) => (
                        <AssignmentRow key={index} assignment={assignment} index={index} onChange={handleAssignmentChange} onRemove={removeAssignment} />
                    ))}
                    {assignments.length === 0 && <p className="text-center text-gray-500 py-6">No technicians have been assigned.</p>}
                </div>
            </section>

            {/* Submit Button */}
            <div className="flex justify-end pt-6 border-t border-gray-200">
                <button type="submit" className="px-10 py-4 bg-green-600 text-white font-bold text-lg rounded-lg shadow-lg hover:bg-green-700 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-300">
                    Create Job Order
                </button>
            </div>
        </form>
    );
};

export default CreateJobOrderForm;