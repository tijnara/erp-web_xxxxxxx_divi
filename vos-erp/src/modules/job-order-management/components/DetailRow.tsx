"use client";

import React from 'react';
import { JobOrderDetail } from '../types';
import { Trash2 } from 'lucide-react';

interface DetailRowProps {
  detail: JobOrderDetail;
  index: number;
  onChange: (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onRemove: (index: number) => void;
}

const DetailRow: React.FC<DetailRowProps> = ({ detail, index, onChange, onRemove }) => {
  return (
    <div className="grid grid-cols-12 gap-x-4 gap-y-2 p-4 border border-gray-200 rounded-lg items-end bg-gray-50/50">
      <div className="col-span-12 sm:col-span-6 md:col-span-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">Line Type</label>
        <select name="line_type" value={detail.line_type} onChange={(e) => onChange(index, e)} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200">
          <option>Part</option>
          <option>Labor</option>
          <option>Product</option>
          <option>Fee</option>
          <option>Discount</option>
          <option>Other</option>
        </select>
      </div>

      <div className="col-span-12 sm:col-span-6 md:col-span-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">Part / Service Name</label>
        <input type="text" name="part_name" value={detail.part_name} onChange={(e) => onChange(index, e)} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200" placeholder="e.g., Compressor, Service Fee" />
      </div>

      <div className="col-span-4 sm:col-span-3 md:col-span-1">
        <label className="block text-sm font-medium text-gray-700 mb-1">Qty</label>
        <input type="number" name="quantity" min="1" value={detail.quantity} onChange={(e) => onChange(index, e)} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200" />
      </div>

      <div className="col-span-8 sm:col-span-4 md:col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price</label>
        <input type="number" name="unit_price" step="0.01" value={detail.unit_price} onChange={(e) => onChange(index, e)} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200" />
      </div>

      <div className="col-span-8 sm:col-span-4 md:col-span-2 text-left sm:text-right">
        <p className="block text-sm font-medium text-gray-700 mb-1">Line Total</p>
        <p className="font-semibold text-gray-800 mt-2 text-lg">₱{(detail.quantity * detail.unit_price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
      </div>

      <div className="col-span-4 sm:col-span-1 flex justify-end items-center">
        <button type="button" onClick={() => onRemove(index)} className="p-2 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-full transition-colors"><Trash2 size={20} /></button>
      </div>
    </div>
  );
};

export default DetailRow;

