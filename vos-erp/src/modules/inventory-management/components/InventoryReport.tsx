"use client";

import { InventoryItem } from "../types";
import { useState, useMemo } from "react";
import * as XLSX from "xlsx";

interface InventoryReportProps {
    inventory: InventoryItem[];
    lowStockThreshold?: number; // default threshold
}

export default function InventoryReport({ inventory, lowStockThreshold = 50 }: InventoryReportProps) {
    const [searchTerm, setSearchTerm] = useState("");

    // Filtered and searched inventory
    const filteredInventory = useMemo(() => {
        return inventory.filter(item => {
            const productName = item.product_name ?? "";
            const productCode = item.product_code ?? "";
            const branchName = item.branch_name ?? "";
            const term = searchTerm.toLowerCase();
            return (
                productName.toLowerCase().includes(term) ||
                productCode.toLowerCase().includes(term) ||
                branchName.toLowerCase().includes(term)
            );
        });
    }, [inventory, searchTerm]);

    // Export to Excel
    const exportToExcel = () => {
        const ws = XLSX.utils.json_to_sheet(
            filteredInventory.map(item => ({
                Branch: item.branch_name,
                ProductCode: item.product_code,
                ProductName: item.product_name,
                Quantity: item.quantity,
                Reserved: item.reserved_quantity,
                Available: item.available_quantity,
                LastRestock: new Date(item.last_restock_date).toLocaleDateString(),
            }))
        );
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "InventoryReport");
        XLSX.writeFile(wb, "InventoryReport.xlsx");
    };

    return (
        <div className="p-4">
            <h1 className="text-xl font-bold mb-4">Inventory Report</h1>

            <div className="mb-4 flex flex-col md:flex-row md:justify-between gap-2">
                <input
                    type="text"
                    placeholder="Search product, code or branch..."
                    className="px-3 py-2 border rounded w-full md:w-1/2"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
                <button
                    onClick={exportToExcel}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    Export to Excel
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full border min-w-[600px]">
                    <thead className="bg-gray-100">
                    <tr>
                        <th className="p-2 text-left">Branch</th>
                        <th className="p-2 text-left">Product Code</th>
                        <th className="p-2 text-left">Product Name</th>
                        <th className="p-2 text-right">Quantity</th>
                        <th className="p-2 text-right">Reserved</th>
                        <th className="p-2 text-right">Available</th>
                        <th className="p-2 text-right">Last Restock</th>
                    </tr>
                    </thead>
                    <tbody>
                    {filteredInventory.map(item => (
                        <tr
                            key={`${item.branch_id}-${item.product_id}`}
                            className={`border-b ${item.quantity < lowStockThreshold ? "bg-red-100" : ""}`}
                        >
                            <td className="p-2">{item.branch_name}</td>
                            <td className="p-2">{item.product_code}</td>
                            <td className="p-2">{item.product_name}</td>
                            <td className="p-2 text-right">{item.quantity}</td>
                            <td className="p-2 text-right">{item.reserved_quantity}</td>
                            <td className="p-2 text-right">{item.available_quantity}</td>
                            <td className="p-2 text-right">{new Date(item.last_restock_date).toLocaleDateString()}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
