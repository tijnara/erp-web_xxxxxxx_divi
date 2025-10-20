// src/modules/customer-management/components/JobOrderDetails.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { JobOrder, JobOrderDetail, JobOrderAssignment, InstallationRequest } from '../types'; // <-- Import InstallationRequest

interface JobOrderDetailsProps {
    activeJobOrder: JobOrder | null;
    getCustomerName: (customerId: number) => string;
    formatDate: (dateString: string | null) => string;
}

const JobOrderDetails: React.FC<JobOrderDetailsProps> = ({
                                                             activeJobOrder,
                                                             getCustomerName,
                                                             formatDate,
                                                         }) => {
    const [details, setDetails] = useState<JobOrderDetail[]>([]);
    const [assignments, setAssignments] = useState<JobOrderAssignment[]>([]);
    // ✅ MODIFIED: State to hold InstallationRequest
    const [installationRequest, setInstallationRequest] = useState<InstallationRequest | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isRequestLoading, setIsRequestLoading] = useState<boolean>(false);

    useEffect(() => {
        if (!activeJobOrder) {
            setDetails([]);
            setAssignments([]);
            setInstallationRequest(null); // <-- Reset
            return;
        }

        const fetchDetails = async () => {
            setIsLoading(true);
            try {
                const [detailsRes, assignmentsRes] = await Promise.all([
                    fetch(`http://100.119.3.44:8090/items/job_order_details?filter[job_order_id][_eq]=${activeJobOrder.id}`),
                    fetch(`http://100.119.3.44:8090/items/job_order_assignments?filter[job_order_id][_eq]=${activeJobOrder.id}`)
                ]);

                if (!detailsRes.ok || !assignmentsRes.ok) {
                    throw new Error('Failed to fetch job order details or assignments');
                }

                const detailsData = await detailsRes.json();
                const assignmentsData = await assignmentsRes.json();

                setDetails(detailsData.data || []);
                setAssignments(assignmentsData.data || []);

            } catch (error) {
                console.error("Error fetching job order details:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDetails();
    }, [activeJobOrder]);

    useEffect(() => {
        // ✅ MODIFIED: This entire block is updated to fetch an Installation Request
        if (activeJobOrder && activeJobOrder.sales_order_id) {
            const fetchInstallationRequest = async () => {
                setIsRequestLoading(true);
                try {
                    // Fetch from the correct installation_requests endpoint
                    const res = await fetch(`http://100.119.3.44:8090/items/installation_requests/${activeJobOrder.sales_order_id}`);
                    if (!res.ok) throw new Error('Failed to fetch installation request');
                    const data = await res.json();
                    setInstallationRequest(data.data || null);
                } catch (error) {
                    console.error('Error fetching installation request:', error);
                    setInstallationRequest(null);
                } finally {
                    setIsRequestLoading(false);
                }
            };
            fetchInstallationRequest();
        } else {
            setInstallationRequest(null);
        }
    }, [activeJobOrder]);

    if (!activeJobOrder) {
        // ... (rest of the component is the same)
        return (
            <div className="flex items-center justify-center h-full text-center p-6">
                <div className="text-gray-500">
                    <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    <h3 className="mt-2 text-lg font-medium">No Job Order Selected</h3>
                    <p className="mt-1 text-sm">Select a job order from the list to view its details.</p>
                </div>
            </div>
        );
    }

    const subtotal = details.reduce((acc, item) => acc + (item.quantity * item.unit_price), 0);

    return (
        <div className="p-6 bg-gray-50 h-full overflow-y-auto font-sans">
            <header className="pb-4 border-b border-gray-200 mb-6">
                <h1 className="text-3xl font-bold text-gray-900">{activeJobOrder.jo_no}</h1>
                <p className="text-md text-gray-500 mt-1">
                    Customer: <span className="font-semibold text-gray-800">{getCustomerName(activeJobOrder.customer_id)}</span>
                </p>
            </header>

            {isLoading ? (
                <div className="text-center py-10">
                    <p className="text-gray-600">Loading details...</p>
                </div>
            ) : (
                <div className="space-y-8">
                    {/* ✅ MODIFIED: This section now displays Installation Request data */}
                    {activeJobOrder?.sales_order_id && (
                        <section className="p-6 bg-white rounded-xl shadow-lg">
                            <h2 className="text-xl font-semibold text-gray-800 border-b border-gray-200 pb-3 mb-6">Related Sales Order</h2>
                            {isRequestLoading ? (
                                <p className="text-gray-600">Loading installation request...</p>
                            ) : installationRequest ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                                    <div><strong className="text-gray-600 block">Code:</strong> {installationRequest.ir_code || 'N/A'}</div>
                                    <div><strong className="text-gray-600 block">Request Date:</strong> {formatDate(installationRequest.created_at)}</div>
                                    <div><strong className="text-gray-600 block">Preferred Date:</strong> {formatDate(installationRequest.preferred_date)}</div>
                                    <div><strong className="text-gray-600 block">Budget:</strong> ₱{Number(installationRequest.budget_php).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                                    <div className="md:col-span-2"><strong className="text-gray-600 block">Notes:</strong> {installationRequest.notes || 'No notes provided.'}</div>
                                </div>
                            ) : (
                                <p className="text-gray-500">No related installation request found.</p>
                            )}
                        </section>
                    )}

                    {/* Core Information Section (remains the same) */}
                    <section className="p-6 bg-white rounded-xl shadow-lg">
                        <h2 className="text-xl font-semibold text-gray-800 border-b border-gray-200 pb-3 mb-6">Core Information</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 text-sm">
                            <div><strong className="text-gray-600 block">Status:</strong> {activeJobOrder.status}</div>
                            <div><strong className="text-gray-600 block">Service Type:</strong> {activeJobOrder.service_type}</div>
                            <div><strong className="text-gray-600 block">Order Date:</strong> {formatDate(activeJobOrder.order_date)}</div>
                            <div><strong className="text-gray-600 block">Scheduled Start:</strong> {formatDate(activeJobOrder.scheduled_start)}</div>
                            <div><strong className="text-gray-600 block">Due Date:</strong> {formatDate(activeJobOrder.due_date)}</div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-100">
                            <strong className="text-gray-600 block">Site Address:</strong>
                            <p className="text-gray-800">{activeJobOrder.site_address || 'N/A'}</p>
                        </div>
                    </section>

                    {/* Job Details Section (remains the same) */}
                    <section className="p-6 bg-white rounded-xl shadow-lg">
                        <h2 className="text-xl font-semibold text-gray-800 border-b border-gray-200 pb-3 mb-6">Job Details (Parts & Labor)</h2>
                        <div className="space-y-3">
                            {details.map((item, index) => (
                                <div key={item.id || index} className="grid grid-cols-12 gap-4 items-center p-3 rounded-md bg-gray-50/70 border border-gray-200">
                                    <div className="col-span-6 font-medium text-gray-800">{item.part_name} <span className="text-xs text-gray-500 ml-2">({item.line_type})</span></div>
                                    <div className="col-span-2 text-center text-gray-600">{item.quantity} x</div>
                                    <div className="col-span-2 text-right text-gray-600">₱{item.unit_price.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                                    <div className="col-span-2 text-right font-semibold text-gray-900">₱{(item.quantity * item.unit_price).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                                </div>
                            ))}
                            {details.length === 0 && <p className="text-center text-gray-500 py-4">No parts or services listed.</p>}
                        </div>
                        <div className="mt-6 pt-4 border-t-2 border-gray-200 flex justify-end">
                            <div className="text-right">
                                <p className="text-gray-600">Subtotal</p>
                                <p className="text-2xl font-bold text-gray-900">₱{subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                            </div>
                        </div>
                    </section>

                    {/* Assigned Technicians Section (remains the same) */}
                    <section className="p-6 bg-white rounded-xl shadow-lg">
                        <h2 className="text-xl font-semibold text-gray-800 border-b border-gray-200 pb-3 mb-6">Assigned Technicians</h2>
                        <div className="space-y-3">
                            {assignments.map((assign, index) => (
                                <div key={assign.id || index} className="flex justify-between items-center p-3 rounded-md bg-gray-50/70 border border-gray-200">
                                    <p className="font-medium text-gray-800">User ID: {assign.user_id}</p>
                                    <p className="text-sm text-gray-600">{assign.role}</p>
                                </div>
                            ))}
                            {assignments.length === 0 && <p className="text-center text-gray-500 py-4">No technicians assigned.</p>}
                        </div>
                    </section>

                    {/* Remarks Section (remains the same) */}
                    <section className="p-6 bg-white rounded-xl shadow-lg">
                        <h2 className="text-xl font-semibold text-gray-800 border-b border-gray-200 pb-3 mb-6">Remarks</h2>
                        <p className="text-gray-700 whitespace-pre-wrap">{activeJobOrder.remarks || 'No remarks provided.'}</p>
                    </section>
                </div>
            )}
        </div>
    );
};

export default JobOrderDetails;