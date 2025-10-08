'use client';
import React, { useState, useEffect, useMemo } from 'react';

interface PurchaseOrder {
    id: number;
    purchase_order_id?: number;
    purchase_order_no: string;
    date: string;
    supplier: { id: number; supplier_name: string; };
    total_amount: number;
    inventory_status: number;
    payment_status: number;
}

interface Supplier {
    id: number;
    supplier_name: string;
    payment_terms: string;
}

interface PaymentMethod {
    method_id: number;
    method_name: string;
}

interface ReceivingType {
    id: number;
    description: string;
}

// --- Helper Functions & Components ---

/**
 * Generates a unique purchase order number.
 * Format: PO-YYYYMMDD-XXX
 */
const generatePoNumber = (existingPOs: PurchaseOrder[]) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const todayPrefix = `PO-${year}${month}${day}`;
    const todayPOs = existingPOs.filter(po => po.purchase_order_no.startsWith(todayPrefix));
    const nextSeq = String(todayPOs.length + 1).padStart(3, '0');
    return `${todayPrefix}-${nextSeq}`;
};

const StatusBadge = ({ status, type }: { status: number, type: string }) => {
    let config = { text: '', class: '' };

    if (type === 'inventory') {
        if (status === 1) config = { text: 'Received', class: 'bg-green-100 text-green-800' };
        else if (status === 2) config = { text: 'Partial', class: 'bg-blue-100 text-blue-800' };
        else config = { text: 'Pending', class: 'bg-yellow-100 text-yellow-800' };
    } else if (type === 'payment') {
        if (status === 2) config = { text: 'Paid', class: 'bg-green-100 text-green-800' };
        else if (status === 3) config = { text: 'Partial', class: 'bg-blue-100 text-blue-800' };
        else config = { text: 'Unpaid', class: 'bg-red-100 text-red-800' };
    }

    return (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${config.class}`}>
            {config.text}
        </span>
    );
};


const PurchaseOrderForm = ({ onSave, onCancel, purchaseOrders }: { onSave: (data: any) => void, onCancel: () => void, purchaseOrders: PurchaseOrder[] }) => {
    const [poNumber, setPoNumber] = useState('');
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [receivingTypes, setReceivingTypes] = useState<ReceivingType[]>([]);
    const [selectedSupplierId, setSelectedSupplierId] = useState('');
    const [paymentTypeId, setPaymentTypeId] = useState('');

    useEffect(() => {
        setPoNumber(generatePoNumber(purchaseOrders));
    }, [purchaseOrders]);

    useEffect(() => {
        const fetchSuppliers = async () => {
            try {
                const response = await fetch('http://100.119.3.44:8090/items/suppliers');
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const result = await response.json();
                if (Array.isArray(result.data)) {
                    setSuppliers(result.data);
                } else {
                    console.error('Error: fetched suppliers data is not an array.', result);
                    setSuppliers([]);
                }
            } catch (error) {
                console.error('Error fetching suppliers:', error);
                setSuppliers([]);
            }
        };

        const fetchPaymentMethods = async () => {
            try {
                const response = await fetch('http://100.119.3.44:8090/items/payment_methods');
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const result = await response.json();
                if (Array.isArray(result.data)) {
                    setPaymentMethods(result.data);
                } else {
                    console.error('Error: fetched payment methods data is not an array.', result);
                    setPaymentMethods([]);
                }
            } catch (error) {
                console.error('Error fetching payment methods:', error);
                setPaymentMethods([]);
            }
        };

        const fetchReceivingTypes = async () => {
            try {
                const response = await fetch('http://100.119.3.44:8090/items/receiving_type');
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const result = await response.json();
                if (Array.isArray(result.data)) {
                    setReceivingTypes(result.data);
                } else {
                    console.error('Error: fetched receiving types data is not an array.', result);
                    setReceivingTypes([]);
                }
            } catch (error) {
                console.error('Error fetching receiving types:', error);
                setReceivingTypes([]);
            }
        };

        fetchSuppliers();
        fetchPaymentMethods();
        fetchReceivingTypes();
    }, []);

    useEffect(() => {
        if (selectedSupplierId) {
            const selectedSupplier = suppliers.find(s => s.id === parseInt(selectedSupplierId, 10));
            if (selectedSupplier && selectedSupplier.payment_terms) {
                const matchingPaymentMethod = paymentMethods.find(pm => pm.method_name === selectedSupplier.payment_terms);
                if (matchingPaymentMethod) {
                    setPaymentTypeId(matchingPaymentMethod.method_id.toString());
                } else {
                    setPaymentTypeId('');
                }
            } else {
                setPaymentTypeId('');
            }
        } else {
            setPaymentTypeId('');
        }
    }, [selectedSupplierId, suppliers, paymentMethods]);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const newPO = {
            purchase_order_no: poNumber,
            reference: formData.get('reference') as string,
            remark: formData.get('remark') as string,
            barcode: formData.get('barcode') as string,
            supplier: { id: parseInt(formData.get('supplier_id') as string, 10) },
            receiving_type: parseInt(formData.get('receiving_type') as string, 10),
            payment_type: parseInt(formData.get('payment_type') as string, 10),
            price_type: 'Standard', // Default value
            receipt_required: formData.get('receipt_required') === 'on',
            date: formData.get('date') as string,
            total_amount: parseFloat(formData.get('total_amount') as string),
            inventory_status: 0, // Default to Pending
            payment_status: 1,   // Default to Unpaid
        };
        onSave(newPO);
    };

    // @ts-ignore
    return (
        <form onSubmit={handleSubmit} className="border-t border-gray-200 pt-6">
            <h2 className="text-2xl font-semibold mb-6 text-gray-800">New Purchase Order Details</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                <div>
                    <label htmlFor="purchase_order_no" className="block text-sm font-medium text-gray-700">Purchase Order #</label>
                    <input type="text" id="purchase_order_no" name="purchase_order_no" value={poNumber} className="mt-1 block w-full bg-gray-100 border-gray-300 rounded-md shadow-sm" readOnly />
                </div>
                <div>
                    <label htmlFor="supplier_id" className="block text-sm font-medium text-gray-700">Supplier*</label>
                    <select
                        id="supplier_id"
                        name="supplier_id"
                        required
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        value={selectedSupplierId}
                        onChange={e => setSelectedSupplierId(e.target.value)}
                    >
                        <option value="">Select a supplier</option>
                        {suppliers.map(supplier => (
                            <option key={supplier.id} value={supplier.id}>
                                {supplier.supplier_name}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label htmlFor="date" className="block text-sm font-medium text-gray-700">PO Date*</label>
                    <input type="date" id="date" name="date" defaultValue={new Date().toISOString().slice(0, 10)} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div>
                    <label htmlFor="reference" className="block text-sm font-medium text-gray-700">Reference</label>
                    <input type="text" id="reference" name="reference" placeholder="e.g., Quote #123" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div>
                    <label htmlFor="barcode" className="block text-sm font-medium text-gray-700">Barcode</label>
                    <input type="text" id="barcode" name="barcode" placeholder="Optional barcode" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div>
                    <label htmlFor="lead_time_receiving" className="block text-sm font-medium text-gray-700">Expected Receiving Date</label>
                    <input type="date" id="lead_time_receiving" name="lead_time_receiving" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                </div>
            </div>

            <h3 className="text-xl font-semibold mb-4 text-gray-700 border-t pt-4">Financials & Types</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <div>
                    <label htmlFor="total_amount" className="block text-sm font-medium text-gray-700">Total Amount*</label>
                    <input type="number" step="0.01" id="total_amount" name="total_amount" placeholder="e.g., 1500.50" required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div>
                    <label htmlFor="payment_type" className="block text-sm font-medium text-gray-700">Payment Type*</label>
                    <select
                        id="payment_type"
                        name="payment_type"
                        required
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        value={paymentTypeId}
                        onChange={e => setPaymentTypeId(e.target.value)}
                    >
                        <option value="">Select a payment type</option>
                        {paymentMethods.map((method, index) => (
                            <option key={`${method.method_id}-${index}`} value={method.method_id}>
                                {method.method_name}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label htmlFor="receiving_type" className="block text-sm font-medium text-gray-700">Receiving Type*</label>
                    <select id="receiving_type" name="receiving_type" required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                        <option value="">Select a receiving type</option>
                        {receivingTypes.map(type => (
                            <option key={type.id} value={type.id}>
                                {type.description}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="flex items-center pt-6">
                    <input type="checkbox" id="receipt_required" name="receipt_required" className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                    <label htmlFor="receipt_required" className="ml-2 block text-sm font-medium text-gray-700">Official Receipt Required</label>
                </div>
            </div>

            <div className="mb-6">
                <label htmlFor="remark" className="block text-sm font-medium text-gray-700">Remarks</label>
                <textarea id="remark" name="remark" rows="3" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" placeholder="Add any notes or special instructions..."></textarea>
            </div>

            <div className="flex justify-end gap-4 border-t pt-6">
                <button type="button" onClick={onCancel} className="bg-gray-200 text-gray-700 font-semibold py-2 px-6 rounded-lg hover:bg-gray-300 transition duration-300">Cancel</button>
                <button type="submit" className="bg-green-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-green-700 transition duration-300 shadow-sm">Save Purchase Order</button>
            </div>
        </form>
    );
};


// --- Main App Component ---
export default function PurchaseOrderPage() {
    const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchPurchaseOrders = async () => {
            try {
                const response = await fetch('http://100.119.3.44:8090/items/purchase_order');
                const result = await response.json();
                setPurchaseOrders(result.data);
            } catch (error) {
                console.error('Error fetching purchase orders:', error);
            }
        };

        fetchPurchaseOrders();
    }, []);

    const filteredPOs = useMemo(() => {
        if (!Array.isArray(purchaseOrders)) return [];
        const sorted = [...purchaseOrders].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        if (!searchTerm) {
            return sorted;
        }
        return sorted.filter(po =>
            po.purchase_order_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
            po.supplier.supplier_name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [purchaseOrders, searchTerm]);

    const handleSavePO = async (newPO: Omit<PurchaseOrder, 'id'>) => {
        try {
            const response = await fetch('http://100.119.3.44:8090/items/purchase_order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newPO),
            });
            const savedPO = await response.json();
            setPurchaseOrders(prevPOs => [...prevPOs, savedPO.data]);
            setIsFormOpen(false);
        } catch (error) {
            console.error('Error saving purchase order:', error);
        }
    };

    return (
        <>
            <style jsx global>{`
                body {
                    font-family: 'Inter', sans-serif;
                }
                ::-webkit-scrollbar { width: 8px; height: 8px; }
                ::-webkit-scrollbar-track { background: #f1f1f1; }
                ::-webkit-scrollbar-thumb { background: #888; border-radius: 4px; }
                ::-webkit-scrollbar-thumb:hover { background: #555; }
                .form-section {
                    max-height: 0;
                    overflow: hidden;
                    transition: max-height 0.5s ease-in-out, padding 0.5s ease-in-out, visibility 0.5s;
                    padding: 0;
                    visibility: hidden;
                }
                .form-section.open {
                    max-height: 1500px; /* Adjust as needed for form height */
                    padding-top: 1.5rem;
                    padding-bottom: 1.5rem;
                    visibility: visible;
                }
            `}</style>
            <div className="bg-gray-100 text-gray-800 min-h-screen">
                <div className="container mx-auto p-4 md:p-8">
                    <header className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">Purchase Order System</h1>
                        <p className="text-gray-600 mt-1">Manage, create, and track all your company's purchase orders.</p>
                    </header>

                    <main className="bg-white rounded-xl shadow-md p-6">
                        <div className="flex flex-col md:flex-row justify-between items-center mb-6">
                            <div className="relative w-full md:w-1/3 mb-4 md:mb-0">
                                <input
                                    type="text"
                                    placeholder="Search by PO # or Supplier..."
                                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <button onClick={() => setIsFormOpen(!isFormOpen)} className="w-full md:w-auto bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-blue-700 transition duration-300 shadow-sm">
                                {isFormOpen ? 'Close Form' : 'Create New PO'}
                            </button>
                        </div>

                        <div className={`form-section ${isFormOpen ? 'open' : ''}`}>
                             {isFormOpen && <PurchaseOrderForm onSave={handleSavePO} onCancel={() => setIsFormOpen(false)} purchaseOrders={purchaseOrders} />}
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PO #</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</th>
                                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Inventory Status</th>
                                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Status</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredPOs.length > 0 && filteredPOs.map((po: PurchaseOrder) => (
                                        <tr key={po.purchase_order_id || po.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{po.purchase_order_no}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{po.date}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{po.supplier?.supplier_name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(po.total_amount)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <StatusBadge status={po.inventory_status} type="inventory" />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <StatusBadge status={po.payment_status} type="payment" />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {filteredPOs.length === 0 && (
                                <div className="text-center py-12">
                                    <p className="text-gray-500 text-lg">No purchase orders found.</p>
                                </div>
                            )}
                        </div>
                    </main>
                </div>
            </div>
        </>
    );
}
