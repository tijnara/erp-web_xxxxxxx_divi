"use client";

import React, { useState } from 'react';
import JobOrderList from './components/JobOrderList';
import JobOrderDetails from './components/JobOrderDetails';

const JobOrderManagement = () => {
    const [activeJobOrder, setActiveJobOrder] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const jobOrders = [
        { id: 1, jo_no: 'JO-2025-001', customer_id: 101, status: 'Pending', order_date: '2025-10-01' },
        { id: 2, jo_no: 'JO-2025-002', customer_id: 102, status: 'Completed', order_date: '2025-10-05' },
        { id: 3, jo_no: 'JO-2025-003', customer_id: 103, status: 'Dispatched', order_date: '2025-10-10' },
    ];

const getCustomerName = (customerId: number) => {
        const customers = { 101: 'John Doe', 102: 'Jane Smith', 103: 'Alice Johnson' };
        return customers[customerId] || 'Unknown';
    };

const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString();
    };

return (
    <div className="flex h-full">
        <JobOrderList
jobOrders={jobOrders as JobOrder[]}
            activeJobOrder={activeJobOrder}
            setActiveJobOrder={setActiveJobOrder as (jobOrder: JobOrder) => void}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            getCustomerName={getCustomerName}
        />
        <div className="flex-1 bg-gray-50">
            <JobOrderDetails
                activeJobOrder={activeJobOrder}
                getCustomerName={getCustomerName}
                formatDate={formatDate as (dateString: string | null) => string}
            />
        </div>
    </div>
);
};

export default JobOrderManagement;
