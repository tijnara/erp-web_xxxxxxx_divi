"use client";

import React from 'react';
import { JobOrder } from '../types';

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
    if (!activeJobOrder) {
        return (
            <div className="flex items-center justify-center h-full text-center">
                <div className="text-gray-500">
                    <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    <h3 className="mt-2 text-lg font-medium">No Job Order Selected</h3>
                    <p className="mt-1 text-sm">Select a job order from the list on the left to view its details.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900">{activeJobOrder.jo_no}</h1>
            <p className="text-gray-500 mt-1">Customer: <span className="font-semibold text-gray-800">{getCustomerName(activeJobOrder.customer_id)}</span></p>
            <div className="mt-4">
                <h2 className="text-lg font-semibold text-gray-700">Details</h2>
                <p className="text-sm text-gray-600">Status: {activeJobOrder.status}</p>
                <p className="text-sm text-gray-600">Order Date: {formatDate(activeJobOrder.order_date)}</p>
            </div>
        </div>
    );
};

export default JobOrderDetails;
