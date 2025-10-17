import React, { useEffect, useState, useCallback } from 'react';
import JobOrderList from './components/JobOrderList';
import JobOrderDetails from './components/JobOrderDetails';
import { JobOrder } from './types';
import { Customer } from '../customer-management/types';

const JobOrderManagementModule: React.FC = () => {
  const [activeJobOrder, setActiveJobOrder] = useState<JobOrder | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);

  useEffect(() => {
    fetch('http://100.119.3.44:8090/items/customer')
      .then((res) => res.json())
      .then((data) => {
        setCustomers(data.data || []);
        setLoadingCustomers(false);
      })
      .catch((error) => {
        console.error('Error fetching customers:', error);
        setLoadingCustomers(false);
      });
  }, []);

    const getCustomerName = useCallback(
        (customerId: number) => {
            const customer = customers.find((c) => c.id === customerId); // Corrected line
            return customer ? customer.customer_name : 'Unknown';
        },
        [customers]
    );

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  if (loadingCustomers) {
    return <div>Loading customers...</div>;
  }

  return (
    <div className="flex h-full">
      <JobOrderList
        activeJobOrder={activeJobOrder}
        setActiveJobOrder={setActiveJobOrder}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        getCustomerName={getCustomerName}
      />
      <JobOrderDetails
        activeJobOrder={activeJobOrder}
        getCustomerName={getCustomerName}
        formatDate={formatDate}
      />
    </div>
  );
};

export default JobOrderManagementModule;
