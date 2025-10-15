"use client";

import React, { useMemo } from 'react';
import { JobOrder } from '../types';

interface JobOrderListProps {
    jobOrders: JobOrder[];
    activeJobOrder: JobOrder | null;
    setActiveJobOrder: (jobOrder: JobOrder) => void;
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    getCustomerName: (customerId: number) => string;
}

const JobOrderList: React.FC<JobOrderListProps> = ({
    jobOrders,
    activeJobOrder,
    setActiveJobOrder,
    searchTerm,
    setSearchTerm,
    getCustomerName,
}) => {
    const filteredJobOrders = useMemo(() => {
        if (!searchTerm) return jobOrders;
        return jobOrders.filter(jo =>
            jo.jo_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
            getCustomerName(jo.customer_id).toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm, jobOrders, getCustomerName]);

    return (
        <aside className="w-full md:w-1/3 lg:w-1/4 bg-white border-r border-gray-200 flex flex-col">
            <div className="p-4 border-b">
                <h2 className="text-xl font-bold text-gray-800">Job Orders</h2>
                <input
                    type="text"
                    placeholder="Search by JO# or Customer..."
                    className="w-full mt-2 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <nav className="flex-1 overflow-y-auto">
                {filteredJobOrders.length > 0 ? filteredJobOrders.map(jo => (
                    <div
                        key={jo.id}
                        className={`p-4 border-b cursor-pointer transition-colors duration-200 ${activeJobOrder?.id === jo.id ? 'bg-blue-100 border-l-4 border-blue-600' : 'hover:bg-gray-50'}`}
                        onClick={() => setActiveJobOrder(jo)}
                    >
                        <div className="flex justify-between items-center">
                            <p className="font-bold text-gray-800">{jo.jo_no}</p>
                            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                                jo.status === 'Completed' ? 'bg-green-100 text-green-800' :
                                jo.status === 'Dispatched' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-200 text-gray-800'
                            }`}>{jo.status}</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{getCustomerName(jo.customer_id)}</p>
                        <p className="text-xs text-gray-400 mt-1">Date: {new Date(jo.order_date).toLocaleDateString()}</p>
                    </div>
                )) : (
                    <p className="text-center text-gray-500 p-6">No job orders found.</p>
                )}
            </nav>
        </aside>
    );
};

export default JobOrderList;
