"use client";

import React from 'react';
import CreateJobOrderForm from './CreateJobOrderForm.tsx';

const CreateJobOrderPage: React.FC = () => {
  return (
    <div className="bg-gray-50 min-h-screen font-sans">
      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Create New Job Order</h1>
          <p className="mt-2 text-lg text-gray-600">Fill in the details below to schedule a new job.</p>
        </header>

        <CreateJobOrderForm />
      </main>
    </div>
  );
};

export default CreateJobOrderPage;
