"use client";

import React, { useState } from 'react';
import { JobOrder } from './types';
import JobOrderList from './components/JobOrderList';
import JobOrderDetails from './components/JobOrderDetails';
import CreateJobOrderPage from './components/CreateJobOrderPage';

const JobOrderManagement = () => {
    const [activeJobOrder, setActiveJobOrder] = useState<JobOrder | null>(null);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [showCreate, setShowCreate] = useState<boolean>(false);

    const jobOrders: JobOrder[] = [
        { id: 1, jo_no: 'JO-2025-001', customer_id: 101, status: 'Pending', order_date: '2025-10-01', service_type: 'Installation', due_date: null, scheduled_start: null, assigned_user_id: null, remarks: null, site_address: null },
        { id: 2, jo_no: 'JO-2025-002', customer_id: 102, status: 'Completed', order_date: '2025-10-05', service_type: 'Repair', due_date: null, scheduled_start: null, assigned_user_id: null, remarks: null, site_address: null },
        { id: 3, jo_no: 'JO-2025-003', customer_id: 103, status: 'Dispatched', order_date: '2025-10-10', service_type: 'Maintenance', due_date: null, scheduled_start: null, assigned_user_id: null, remarks: null, site_address: null },
    ];

    const getCustomerName = (customerId: number) => {
        const customers = new Map<number, string>([
            [101, 'John Doe'],
            [102, 'Jane Smith'],
            [103, 'Alice Johnson'],
        ]);
        return customers.get(customerId) || 'Unknown';
    };

    const formatDate = (dateString: string | null): string => {
        if (!dateString) return 'N/A'; // Return 'N/A' for null or empty values
        return new Date(dateString).toLocaleDateString();
    };

    return (
        <div className="flex h-full">
            <JobOrderList
                jobOrders={jobOrders}
                activeJobOrder={activeJobOrder}
                setActiveJobOrder={(jo) => { setActiveJobOrder(jo); setShowCreate(false); }}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                getCustomerName={getCustomerName}
                onCreate={() => { setShowCreate(true); setActiveJobOrder(null); }}
            />
            <div className="flex-1 bg-gray-50">
                {showCreate ? (
                    <CreateJobOrderPage />
                ) : (
                    <JobOrderDetails
                        activeJobOrder={activeJobOrder}
                        getCustomerName={getCustomerName}
                        formatDate={formatDate}
                    />
                )}
            </div>
        </div>
    );
};

export { CreateJobOrderPage };

export default JobOrderManagement;
