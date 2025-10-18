// src/modules/customer-management/components/CreateJobOrderForm.tsx
"use client";

import React, { useState, type FC, type FormEvent, useEffect } from 'react';
import { PlusCircle } from 'lucide-react';
import { JobOrderDetail, JobOrderAssignment, PartialJobOrder, SalesOrder } from '../types';
import DetailRow from './DetailRow';
import AssignmentRow from './AssignmentRow';

const CreateJobOrderForm: FC = () => {
    const [jobOrder, setJobOrder] = useState<PartialJobOrder>({
        jo_no: `JO-${Date.now()}`,
        service_type: 'Installation',
        status: 'Pending',
        order_date: new Date().toISOString().slice(0, 16),
        site_address: '',
        site_contact_name: '',
        site_contact_phone: '',
        remarks: '',
    });

    const [details, setDetails] = useState<JobOrderDetail[]>([]);
    const [assignments, setAssignments] = useState<JobOrderAssignment[]>([]);
    const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
    const [installationRequests, setInstallationRequests] = useState<{ id: number }[]>([]);
    const [loadingSalesOrders, setLoadingSalesOrders] = useState(true);
    const [loadingInstallationRequests, setLoadingInstallationRequests] = useState(true);
    const [usedSalesOrderIds, setUsedSalesOrderIds] = useState<number[]>([]);

    useEffect(() => {
        fetch('http://100.119.3.44:8090/items/sales_order')
            .then((res) => res.json())
            .then((data) => {
                setSalesOrders(data.data || []);
                setLoadingSalesOrders(false);
            })
            .catch((error) => {
                console.error('Error fetching sales orders:', error);
                setLoadingSalesOrders(false);
            });
    }, []);

    useEffect(() => {
        // Fetch Installation Requests
        fetch('http://100.119.3.44:8090/items/installation_requests')
            .then((res) => res.json())
            .then((data) => {
                setInstallationRequests(data.data || []);
                setLoadingInstallationRequests(false);
            })
            .catch((error) => {
                console.error('Error fetching installation requests:', error);
                setLoadingInstallationRequests(false);
            });
    }, []);

    useEffect(() => {
        // Fetch all job orders for the current year to generate unique jo_no
        const currentYear = 2025; // Use context or new Date().getFullYear() if dynamic
        fetch(`http://100.119.3.44:8090/items/job_order?filter[jo_year][_eq]=${currentYear}&fields=jo_no,sales_order_id`)
            .then((res) => res.json())
            .then((data) => {
                const jobOrders = data.data || [];
                // Find the highest sequence number for the year
                let maxSeq = 0;
                const usedIds: number[] = [];
                jobOrders.forEach((order: { jo_no: string, sales_order_id?: number }) => {
                    const match = order.jo_no?.match(/^JO-2025-(\d{4})$/);
                    if (match) {
                        const seq = parseInt(match[1], 10);
                        if (seq > maxSeq) maxSeq = seq;
                    }
                    if (order.sales_order_id) {
                        usedIds.push(order.sales_order_id);
                    }
                });
                setUsedSalesOrderIds(usedIds);
                const nextSeq = (maxSeq + 1).toString().padStart(4, '0');
                const nextJoNo = `JO-2025-${nextSeq}`;
                setJobOrder((prev) => ({
                    ...prev,
                    jo_no: nextJoNo,
                }));
            });
    }, []);

    const handleJobOrderChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        // Ensure sales_order_id and installation_request_id are stored as numbers
        setJobOrder((prev) => ({
            ...prev,
            [name]: name === 'sales_order_id' || name === 'installation_request_id' ? (value ? Number(value) : undefined) : value,
        }));
    };

    const handleDetailChange = (
        index: number,
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setDetails((prev) => {
            const copy = [...prev];
            const item = { ...copy[index] };
            if (name === 'quantity') {
                item.quantity = Number(value || 0);
            } else if (name === 'unit_price') {
                item.unit_price = Number(value || 0);
            } else if (name === 'product_id') {
                item.product_id = value === '' ? undefined : Number(value);
            } else {
                // line_type or part_name or remarks
                (item as any)[name] = value;
            }
            copy[index] = item;
            return copy;
        });
    };

    const addDetail = () => {
        setDetails((prev) => [
            ...prev,
            {
                line_type: 'Part',
                part_name: '',
                quantity: 1,
                unit_price: 0,
            },
        ]);
    };

    const removeDetail = (index: number) => {
        setDetails((prev) => prev.filter((_, i) => i !== index));
    };

    const handleAssignmentChange = (
        index: number,
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setAssignments((prev) => {
            const copy = [...prev];
            const item = { ...copy[index] };
            if (name === 'user_id') {
                // allow empty string or numeric
                item.user_id = value === '' ? '' : Number(value);
            } else {
                (item as any)[name] = value;
            }
            copy[index] = item;
            return copy;
        });
    };

    const addAssignment = () => {
        setAssignments((prev) => [
            ...prev,
            {
                user_id: '',
                role: 'Technician',
            },
        ]);
    };

    const removeAssignment = (index: number) => {
        setAssignments((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        try {
            // Create Job Order
            const jobOrderResponse = await fetch('http://100.119.3.44:8090/items/job_order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(jobOrder),
            });

            if (!jobOrderResponse.ok) {
                throw new Error('Failed to create job order');
            }

            const createdJobOrder = await jobOrderResponse.json();

            // Create Job Order Details
            for (const detail of details) {
                const detailPayload = { ...detail, job_order_id: createdJobOrder.id };
                const detailResponse = await fetch('http://100.119.3.44:8090/items/job_order_details', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(detailPayload),
                });

                if (!detailResponse.ok) {
                    throw new Error('Failed to create job order detail');
                }
            }

            // Create Job Order Assignments
            for (const assignment of assignments) {
                const assignmentPayload = { ...assignment, job_order_id: createdJobOrder.id };
                const assignmentResponse = await fetch('http://100.119.3.44:8090/items/job_order_assignments', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(assignmentPayload),
                });

                if (!assignmentResponse.ok) {
                    throw new Error('Failed to create job order assignment');
                }
            }

            alert('Job order created successfully!');
        } catch (error) {
            console.error(error);
            alert('An error occurred while creating the job order.');
        }
    };

    const handleInstallationRequestChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { value } = e.target;
        const installationRequestId = value ? Number(value) : undefined;

        setJobOrder((prev) => ({
            ...prev,
            installation_request_id: installationRequestId,
        }));

        if (installationRequestId) {
            try {
                const response = await fetch(`http://100.119.3.44:8090/items/installation_requests/${installationRequestId}`);
                const data = await response.json();
                const request = data.data;

                if (request) {
                    // ✅ FIX: Combine preferred_date and preferred_time for the datetime-local input
                    const scheduledDateTime = (request.preferred_date && request.preferred_time)
                        ? `${request.preferred_date}T${request.preferred_time.slice(0, 5)}` // Creates YYYY-MM-DDTHH:MM
                        : request.preferred_date || ''; // Fallback to just date if time is missing

                    // ✅ FIX: Format the full ISO string from created_at for the datetime-local input
                    const formattedOrderDate = request.created_at
                        ? new Date(request.created_at).toISOString().slice(0, 16)
                        : new Date().toISOString().slice(0, 16); // Fallback to now

                    setJobOrder((prev) => ({
                        ...prev,
                        customer_id: request.client_id,
                        order_date: formattedOrderDate,
                        scheduled_start: scheduledDateTime,
                    }));
                }
            } catch (error) {
                console.error('Error fetching installation request details:', error);
            }
        }
    };

    const inputClass = 'w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200';
    const labelClass = 'block text-sm font-medium text-gray-700 mb-1';
    const sectionClass = 'p-6 bg-white rounded-xl shadow-lg';
    const sectionTitleClass = 'text-xl font-semibold text-gray-800 border-b border-gray-200 pb-3 mb-6';

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            {/* Sales Order - moved above Core Info */}
            <section className={sectionClass}>
                <div className="mb-4">
                    <label htmlFor="sales_order_id" className="block font-medium mb-1">Sales Order</label>
                    <select
                        id="sales_order_id"
                        name="sales_order_id"
                        value={jobOrder.sales_order_id || ''}
                        onChange={handleJobOrderChange}
                        className="border rounded px-2 py-1 w-full"
                    >
                        <option value="">Select Sales Order</option>
                        {salesOrders.filter(so => !usedSalesOrderIds.includes(so.order_id)).map((so) => (
                            <option key={so.order_id} value={so.order_id}>
                                {so.order_no}
                            </option>
                        ))}
                    </select>
                </div>
            </section>

            {/* Installation Requests Dropdown */}
            <section className={sectionClass}>
                <div className="mb-4">
                    <label htmlFor="installation_request_id" className="block font-medium mb-1">Installation Request</label>
                    <select
                        id="installation_request_id"
                        name="installation_request_id"
                        value={jobOrder.installation_request_id || ''}
                        onChange={handleInstallationRequestChange}
                        className="border rounded px-2 py-1 w-full"
                    >
                        <option value="">Select Installation Request</option>
                        {installationRequests.map((request) => (
                            <option key={request.id} value={request.id}>
                                {`Request ID: ${request.id}`}
                            </option>
                        ))}
                    </select>
                </div>
            </section>

            {/* Core Info */}
            <section className={sectionClass}>
                <div className="mb-6 p-6 bg-white rounded-xl shadow-lg">
                    <h2 className="text-xl font-semibold text-gray-800 border-b border-gray-200 pb-3 mb-6">Core Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                        <div>
                            <label htmlFor="jo_no" className="block font-medium mb-1">Job Order No.</label>
                            <input
                                type="text"
                                id="jo_no"
                                name="jo_no"
                                value={jobOrder.jo_no}
                                readOnly
                                className="w-full border-gray-300 rounded-md px-3 py-2 bg-gray-100 cursor-not-allowed"
                            />
                        </div>
                        <div>
                            <label htmlFor="customer_id" className={labelClass}>
                                Customer ID
                            </label>
                            <input type="number" id="customer_id" name="customer_id" value={jobOrder.customer_id as any || ''} onChange={handleJobOrderChange} className={inputClass} placeholder="Enter Customer ID" required />
                        </div>
                        <div>
                            <label htmlFor="service_type" className={labelClass}>
                                Service Type
                            </label>
                            <select id="service_type" name="service_type" value={jobOrder.service_type || 'Installation'} onChange={handleJobOrderChange} className={inputClass}>
                                <option>Installation</option>
                                <option>Repair</option>
                                <option>Maintenance</option>
                                <option>DeliveryOnly</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="order_date" className={labelClass}>
                                Order Date
                            </label>
                            <input type="datetime-local" id="order_date" name="order_date" value={jobOrder.order_date || ''} onChange={handleJobOrderChange} className={inputClass} required />
                        </div>
                        <div>
                            <label htmlFor="scheduled_start" className={labelClass}>
                                Scheduled Start
                            </label>
                            <input type="datetime-local" id="scheduled_start" name="scheduled_start" value={jobOrder.scheduled_start || ''} onChange={handleJobOrderChange} className={inputClass} />
                        </div>
                        <div>
                            <label htmlFor="status" className={labelClass}>
                                Status
                            </label>
                            <input type="text" id="status" name="status" value={jobOrder.status || 'Pending'} onChange={handleJobOrderChange} className={`${inputClass} bg-gray-100`} readOnly />
                        </div>
                    </div>
                </div>
            </section>

            {/* Site & Contact */}
            <section className={sectionClass}>
                <h2 className={sectionTitleClass}>Site & Contact Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="site_contact_name" className={labelClass}>
                            Site Contact Name
                        </label>
                        <input type="text" id="site_contact_name" name="site_contact_name" value={jobOrder.site_contact_name || ''} onChange={handleJobOrderChange} className={inputClass} placeholder="e.g., Jane Doe" />
                    </div>
                    <div>
                        <label htmlFor="site_contact_phone" className={labelClass}>
                            Site Contact Phone
                        </label>
                        <input type="tel" id="site_contact_phone" name="site_contact_phone" value={jobOrder.site_contact_phone || ''} onChange={handleJobOrderChange} className={inputClass} placeholder="e.g., 09171234567" />
                    </div>
                    <div className="md:col-span-2">
                        <label htmlFor="site_address" className={labelClass}>
                            Site Address
                        </label>
                        <textarea id="site_address" name="site_address" rows={3} value={jobOrder.site_address || ''} onChange={handleJobOrderChange} className={inputClass} placeholder="Full address of the job site" required />
                    </div>
                    <div className="md:col-span-2">
                        <label htmlFor="remarks" className={labelClass}>
                            Remarks / Notes
                        </label>
                        <textarea id="remarks" name="remarks" rows={4} value={jobOrder.remarks || ''} onChange={handleJobOrderChange} className={inputClass} placeholder="Any special instructions, reported issues, or notes for the technician..." />
                    </div>
                </div>
            </section>

            {/* Job Details */}
            <section className={sectionClass}>
                <div className="flex flex-wrap justify-between items-center gap-4 mb-6 border-b border-gray-200 pb-3">
                    <h2 className="text-xl font-semibold text-gray-800">Job Details (Parts & Labor)</h2>
                    <button type="button" onClick={addDetail} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition-transform transform hover:scale-105">
                        <PlusCircle size={20} /> Add Item
                    </button>
                </div>
                <div className="space-y-4">
                    {details.map((detail, index) => (
                        <DetailRow key={index} detail={detail} index={index} onChange={handleDetailChange} onRemove={removeDetail} />
                    ))}
                    {details.length === 0 && <p className="text-center text-gray-500 py-6">No parts or labor have been added.</p>}
                </div>
            </section>

            {/* Assignments */}
            <section className={sectionClass}>
                <div className="flex flex-wrap justify-between items-center gap-4 mb-6 border-b border-gray-200 pb-3">
                    <h2 className="text-xl font-semibold text-gray-800">Assign Technicians</h2>
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

            <div className="flex justify-end pt-6 border-t border-gray-200">
                <button type="submit" className="px-10 py-4 bg-green-600 text-white font-bold text-lg rounded-lg shadow-lg hover:bg-green-700 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-300">
                    Create Job Order
                </button>
            </div>
        </form>
    );
};

export default CreateJobOrderForm;