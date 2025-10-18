// src/modules/customer-management/components/DetailRow.tsx
"use client";

import React from 'react';
import { JobOrderDetail } from '../types';
import { Trash2 } from 'lucide-react';

// Define the expected props for the DetailRow component
interface DetailRowProps {
    detail: JobOrderDetail; // The data for the current row
    index: number; // The index of the current row (for updates/removals)
    onChange: (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void; // Callback for changes
    onRemove: (index: number) => void; // Callback for removing the row
    consumableItems: { item_id: number; item_name: string }[]; // List of available consumable parts
    products: { product_id: number; product_name: string }[]; // List of available products
}

const DetailRow: React.FC<DetailRowProps> = ({
                                                 detail, index, onChange, onRemove, consumableItems, products
                                             }) => {
    // Common styling for input elements
    const inputClass = "w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200";

    return (
        <div className="grid grid-cols-12 gap-x-4 gap-y-2 p-4 border border-gray-200 rounded-lg items-end bg-gray-50/50">
            {/* Column 1: Line Type Selection */}
            <div className="col-span-12 sm:col-span-6 md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Line Type</label>
                <select
                    name="line_type" // Links to handleDetailChange logic
                    value={detail.line_type} // Controlled component value
                    onChange={(e) => onChange(index, e)} // Trigger update on change
                    className={inputClass}
                >
                    {/* Available line types */}
                    <option>Part</option>
                    <option>Product</option>
                    <option>Labor</option>
                    <option>Fee</option>
                    <option>Discount</option>
                    <option>Other</option>
                </select>
            </div>

            {/* Column 2: Item Selection (Conditional based on Line Type) */}
            <div className="col-span-12 sm:col-span-6 md:col-span-3">
                {/* Render Consumable Part Dropdown if Line Type is 'Part' */}
                {detail.line_type === 'Part' ? (
                    <>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Consumable Part</label>
                        <select
                            name="item_selector" // Generic name handled by handleDetailChange
                            value={detail.consumable_item_id || ''} // Bind to the specific ID field
                            onChange={(e) => onChange(index, e)}
                            className={inputClass}
                        >
                            <option value="">Select a part...</option>
                            {consumableItems.map(item => (
                                <option key={item.item_id} value={item.item_id}>{item.item_name}</option>
                            ))}
                        </select>
                    </>
                    /* Render Product Dropdown if Line Type is 'Product' */
                ) : detail.line_type === 'Product' ? (
                    <>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
                        <select
                            name="item_selector" // Generic name handled by handleDetailChange
                            value={detail.product_id || ''} // Bind to the specific ID field
                            onChange={(e) => onChange(index, e)}
                            className={inputClass}
                        >
                            <option value="">Select a product...</option>
                            {products.map(product => (
                                <option key={product.product_id} value={product.product_id}>{product.product_name}</option>
                            ))}
                        </select>
                    </>
                    /* Render Text Input for other Line Types (Labor, Fee, etc.) */
                ) : (
                    <>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Service / Item Name</label>
                        <input
                            type="text"
                            name="part_name" // Links to handleDetailChange logic
                            value={detail.part_name} // Bind to part_name for manual entry
                            onChange={(e) => onChange(index, e)}
                            className={inputClass}
                            placeholder="e.g., Service Fee, Labor Charge"
                        />
                    </>
                )}
            </div>

            {/* Column 3: Quantity Input */}
            <div className="col-span-4 sm:col-span-3 md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Qty</label>
                <input
                    type="number"
                    name="quantity"
                    min="1" // Minimum quantity allowed
                    value={detail.quantity}
                    onChange={(e) => onChange(index, e)}
                    className={inputClass}
                />
            </div>

            {/* Column 4: Unit Price Input */}
            <div className="col-span-8 sm:col-span-4 md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price</label>
                <input
                    type="number"
                    name="unit_price"
                    step="0.01" // Allow decimal values for currency
                    min="0" // Price cannot be negative
                    value={detail.unit_price}
                    onChange={(e) => onChange(index, e)}
                    className={inputClass}
                />
            </div>

            {/* Column 5: Line Total Display */}
            <div className="col-span-8 sm:col-span-4 md:col-span-2 text-left sm:text-right">
                <p className="block text-sm font-medium text-gray-700 mb-1">Line Total</p>
                {/* Calculate and format the line total */}
                <p className="font-semibold text-gray-800 mt-2 text-lg">
                    ₱{(detail.quantity * detail.unit_price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
            </div>

            {/* Column 6: Remove Button */}
            <div className="col-span-4 sm:col-span-1 flex justify-end items-center">
                <button
                    type="button"
                    onClick={() => onRemove(index)} // Trigger removal callback
                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-full transition-colors"
                    aria-label="Remove item" // Accessibility label
                >
                    <Trash2 size={20} />
                </button>
            </div>
        </div>
    );
};

export default DetailRow;