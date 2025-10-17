"use client";

import React from 'react';
import { JobOrderAssignment } from '../types';
import { Trash2 } from 'lucide-react';

interface AssignmentRowProps {
  assignment: JobOrderAssignment;
  index: number;
  onChange: (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onRemove: (index: number) => void;
}

const AssignmentRow: React.FC<AssignmentRowProps> = ({ assignment, index, onChange, onRemove }) => {
  return (
    <div className="grid grid-cols-12 gap-4 p-4 border border-gray-200 rounded-lg items-center bg-gray-50/50">
      <div className="col-span-12 sm:col-span-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">Technician / User ID</label>
        <input type="number" name="user_id" value={assignment.user_id as any} onChange={(e) => onChange(index, e)} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200" placeholder="Enter User ID" />
      </div>
      <div className="col-span-12 sm:col-span-5">
        <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
        <input type="text" name="role" value={assignment.role} onChange={(e) => onChange(index, e)} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200" placeholder="e.g., Lead, Assistant" />
      </div>
      <div className="col-span-12 sm:col-span-1 flex justify-end">
        <button type="button" onClick={() => onRemove(index)} className="p-2 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-full transition-colors"><Trash2 size={20} /></button>
      </div>
    </div>
  );
};

export default AssignmentRow;

