"use client";

import { useState, useMemo } from "react";
import { InventoryItem } from "../types";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import CreatePOModal from "./CreatePOModal";


interface InventoryListViewProps {
    initialData: InventoryItem[];
    currentPage: number;
    pageSize: number;
    totalItems: number;
}

type SortKey = keyof InventoryItem;
type SortDirection = "asc" | "desc";

export default function InventoryListView({
                                              initialData,
                                              currentPage,
                                              pageSize,
                                              totalItems,
                                          }: InventoryListViewProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [showCreatePOModal, setShowCreatePOModal] = useState(false);
    const [selectedItems, setSelectedItems] = useState<InventoryItem[]>([]);
    const [selectAllAcrossPages, setSelectAllAcrossPages] = useState(false);
    const [sortKey, setSortKey] = useState<SortKey>("product_name");
    const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
    const [page, setPage] = useState(currentPage);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [branchFilter, setBranchFilter] = useState<string>("all");
    const [categoryFilter, setCategoryFilter] = useState<string>("all");
    const [summaryFilter, setSummaryFilter] = useState<string | null>(null);
    const [showExportModal, setShowExportModal] = useState(false);
// Track "Ordered Quantity" for each product
    const [orderedQuantities, setOrderedQuantities] = useState<{ [productId: number]: number }>({});
    const [selectedFields, setSelectedFields] = useState<string[]>([
        "branch_name",
        "product_code",
        "product_name",
        "product_category",
        "quantity",
        "available_quantity",
        "last_restock_date",
    ]);

    const LEAD_TIME_DAYS = 7; // average supplier lead time
    const SAFETY_STOCK = 100; // minimum safety buffer

    function calculateReorderPoint(avgDailyUsage: number) {
        return avgDailyUsage * LEAD_TIME_DAYS + SAFETY_STOCK;
    }

    function calculateSuggestedQty(unitsSold: number) {
        return unitsSold + SAFETY_STOCK;
    }

// Function to close the modal
    const closeModal = () => setIsModalOpen(false);

// Function to handle PO creation result
    const handlePOCreated = (result: any) => {
        console.log("PO created result:", result);
        // You can refresh your inventory list or do other things here
    };
    const selectedQuantities = selectedItems.reduce((acc, item) => {
        acc[item.product_id] = orderedQuantities[item.product_id] ?? 0;
        return acc;
    }, {} as { [productId: number]: number });

    const branches = useMemo(
        () => Array.from(new Set(initialData.map((i) => i.branch_name))),
        [initialData]
    );
    const handleOrderedQuantityChange = (productId: number, value: number) => {
        setOrderedQuantities((prev) => ({ ...prev, [productId]: value }));
    };
    const categories = useMemo(
        () =>
            Array.from(new Set(initialData.map((i) => i.product_category))).filter(
                (c) => c
            ),
        [initialData]
    );



    // ✅ Filtering logic
    const filteredData = useMemo(() => {
        const term = searchTerm.toLowerCase();
        return initialData.filter((item) => {
            const productName = item.product_name ?? "";
            const productCode = item.product_code ?? "";
            const branchName = item.branch_name ?? "";
            const category = item.product_category ?? "";
            const availableQty = item.available_quantity ?? 0;

            const matchesBasicFilters =
                (productName.toLowerCase().includes(term) ||
                    productCode.toLowerCase().includes(term) ||
                    branchName.toLowerCase().includes(term)) &&
                (branchFilter === "all" || branchName === branchFilter) &&
                (categoryFilter === "all" ||
                    Number(category) === Number(categoryFilter));

            if (!matchesBasicFilters) return false;

            if (summaryFilter === "low") return availableQty < 10;
            if (summaryFilter === "all") return true;

            return true;
        });
    }, [initialData, searchTerm, branchFilter, categoryFilter, summaryFilter]);

    // ✅ Sorting
    const sortedData = useMemo(() => {
        return [...filteredData].sort((a, b) => {
            const aValue = a[sortKey];
            const bValue = b[sortKey];
            if (aValue == null && bValue == null) return 0;
            if (aValue == null) return sortDirection === "asc" ? 1 : -1;
            if (bValue == null) return sortDirection === "asc" ? -1 : 1;

            if (sortKey === "last_restock_date") {
                const aDate = new Date(aValue as string).getTime();
                const bDate = new Date(bValue as string).getTime();
                return sortDirection === "asc" ? aDate - bDate : bDate - aDate;
            }

            if (typeof aValue === "number" && typeof bValue === "number") {
                return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
            }

            return sortDirection === "asc"
                ? String(aValue).localeCompare(String(bValue))
                : String(bValue).localeCompare(String(aValue));
        });
    }, [filteredData, sortKey, sortDirection]);

    const totalPages = Math.ceil(sortedData.length / pageSize);

    const paginatedData = useMemo(() => {
        const start = (page - 1) * pageSize;
        return sortedData.slice(start, start + pageSize);
    }, [sortedData, page, pageSize]);

    // ✅ Handlers
    const handleSort = (key: SortKey) => {
        if (key === sortKey)
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        else {
            setSortKey(key);
            setSortDirection("asc");
        }
    };

    const handleExport = (itemsToExport?: InventoryItem[]) => {
        const exportData = (itemsToExport || (selectAllAcrossPages ? filteredData : selectedItems)).map((item) => {
            const obj: Record<string, any> = {};
            selectedFields.forEach((field) => {
                obj[field] = item[field as keyof InventoryItem] ?? "";
            });
            return obj;
        });

        const doc = new jsPDF({ orientation: "landscape" });

        const columns = selectedFields.map((f) =>
            f.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
        );
        const rows = exportData.map((row) => selectedFields.map((f) => row[f]));

        doc.setFontSize(16);
        doc.text("Inventory Report", 14, 15);

        autoTable(doc, {
            startY: 25,
            head: [columns],
            body: rows,
            theme: "grid",
            styles: { fontSize: 9, cellPadding: 2 },
            headStyles: { fillColor: [41, 128, 185], textColor: 255 },
        });

        const date = new Date().toLocaleString();
        doc.setFontSize(10);
        doc.text(`Generated on: ${date}`, 14, doc.lastAutoTable.finalY + 10);

        doc.save("InventoryReport.pdf");
    };

    const toggleField = (field: string) => {
        setSelectedFields((prev) =>
            prev.includes(field)
                ? prev.filter((f) => f !== field)
                : [...prev, field]
        );
    };

    const resetFilters = () => {
        setSearchTerm("");
        setBranchFilter("all");
        setCategoryFilter("all");
        setSummaryFilter(null);
        setPage(1);
    };

    // ✅ Pagination
    const goToPage = (pageNumber: number) => {
        if (pageNumber >= 1 && pageNumber <= totalPages) {
            setPage(pageNumber);
        }
    };
    const nextPage = () => goToPage(page + 1);
    const prevPage = () => goToPage(page - 1);

    return (
        <div className="p-2 md:p-4">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-lg md:text-xl font-semibold">Inventory Listing</h1>
            </div>

            {/* ✅ Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                <div
                    onClick={() =>
                        setSummaryFilter(summaryFilter === "all" ? null : "all")
                    }
                    className={`p-4 border rounded-xl shadow-sm cursor-pointer transition ${
                        summaryFilter === "all"
                            ? "bg-blue-600 text-white border-blue-700"
                            : "bg-blue-50 border-blue-200 hover:bg-blue-100"
                    }`}
                >
                    <h3 className="text-xs font-semibold uppercase">Total Products</h3>
                    <p className="text-xl font-bold mt-1">{filteredData.length}</p>
                </div>

                <div className="p-4 bg-green-50 border border-green-200 rounded-xl shadow-sm">
                    <h3 className="text-xs font-semibold text-green-600 uppercase">
                        Total Available Quantity
                    </h3>
                    <p className="text-xl font-bold text-gray-800 mt-1">
                        {filteredData.reduce(
                            (sum, item) => sum + (item.available_quantity || 0),
                            0
                        )}
                    </p>
                </div>

                <div
                    onClick={() =>
                        setSummaryFilter(summaryFilter === "low" ? null : "low")
                    }
                    className={`p-4 border rounded-xl shadow-sm cursor-pointer transition ${
                        summaryFilter === "low"
                            ? "bg-red-600 text-white border-red-700"
                            : "bg-red-50 border-red-200 hover:bg-red-100"
                    }`}
                >
                    <h3 className="text-xs font-semibold uppercase">Low Stock Items</h3>
                    <p className="text-xl font-bold mt-1">
                        {filteredData.filter((item) => item.available_quantity < 10).length}
                    </p>
                </div>
            </div>

            {/* ✅ Filters */}
            <div className="mb-3 md:mb-4 flex flex-col md:flex-row gap-2 text-sm md:text-base">
                <input
                    type="text"
                    placeholder="Search..."
                    className="w-full md:w-1/3 px-2 py-1 md:px-3 md:py-2 border rounded text-sm md:text-base"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />

                <select
                    className="w-full md:w-1/4 px-2 py-1 md:px-3 md:py-2 border rounded text-sm md:text-base"
                    value={branchFilter}
                    onChange={(e) => {
                        setBranchFilter(e.target.value);
                        setPage(1);
                    }}
                >
                    <option value="all">All Branches</option>
                    {branches.map((branch) => (
                        <option key={branch} value={branch}>
                            {branch}
                        </option>
                    ))}
                </select>

                <select
                    className="w-full md:w-1/4 px-2 py-1 md:px-3 md:py-2 border rounded text-sm md:text-base"
                    value={categoryFilter}
                    onChange={(e) => {
                        setCategoryFilter(e.target.value);
                        setPage(1);
                    }}
                >
                    <option value="all">All Categories</option>
                    {categories.map((cat) => (
                        <option key={cat} value={cat}>
                            {cat}
                        </option>
                    ))}
                </select>

                <button
                    onClick={resetFilters}
                    className="px-3 py-1 md:px-4 md:py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded text-sm md:text-base"
                >
                    Reset Filters
                </button>


            </div>
            {/* ================= Top Selection Bar ================= */}
            <div className="flex flex-col gap-1 mb-2">
                {/* Top checkbox + Action buttons */}
                <div className="flex items-center justify-between p-2 bg-gray-50 border rounded">
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={
                                paginatedData.length > 0 &&
                                paginatedData.every((item) => selectedItems.includes(item))
                            }
                            ref={(el) => {
                                if (el) {
                                    el.indeterminate =
                                        selectedItems.length > 0 &&
                                        selectedItems.length < paginatedData.length;
                                }
                            }}
                            onChange={(e) => {
                                if (e.target.checked) {
                                    setSelectedItems((prev) => [
                                        ...prev,
                                        ...paginatedData.filter((i) => !prev.includes(i)),
                                    ]);
                                } else {
                                    setSelectedItems((prev) =>
                                        prev.filter((i) => !paginatedData.includes(i))
                                    );
                                    setSelectAllAcrossPages(false);
                                }
                            }}
                            className="cursor-pointer"
                        />
                        <span className="text-sm text-gray-700">
        {selectedItems.length > 0
            ? `${selectedItems.length} item${selectedItems.length > 1 ? "s" : ""} selected`
            : "Select all"}
      </span>
                    </div>

                    {selectedItems.length > 0 && (
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleExport()}
                                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                            >
                                Export
                            </button>

                            <button
                                onClick={() => setShowCreatePOModal(true)}
                                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                            >
                                Create PO
                            </button>



                        </div>
                    )}
                </div>

                {/* Select all across pages message */}
                {!selectAllAcrossPages &&
                    selectedItems.length > 0 &&
                    selectedItems.length < filteredData.length && (
                        <div className="flex items-center gap-2 p-2 text-sm text-gray-700 bg-gray-100 rounded">
                            All {selectedItems.length} items on this page are selected.
                            <button
                                className="underline text-blue-600 hover:text-blue-800 ml-2"
                                onClick={() => {
                                    setSelectedItems([...filteredData]);
                                    setSelectAllAcrossPages(true);
                                }}
                            >
                                Select all {filteredData.length} items
                            </button>
                        </div>
                    )}
            </div>

            {/* ================= Table ================= */}
            <div className="overflow-x-auto border rounded-lg">
                <table className="w-full border-collapse text-xs md:text-sm">
                    <thead className="bg-gray-100">
                    <tr>
                        <th className="p-2 text-center"></th> {/* Checkbox column */}
                        <th className="p-2 text-left">Branch</th>
                        <th className="p-2 text-left">Product Code</th>
                        <th className="p-2 text-left">Product Name</th>
                        <th className="p-2 text-left">Category</th>
                        <th className="p-2 text-right">Qty</th>
                        <th className="p-2 text-right">Reserved</th>
                        <th className="p-2 text-right">Available</th>
                        <th className="p-2 text-right">Last Restock</th>
                        <th className="p-2 text-right">Suggested Qty</th>
                        <th className="p-2 text-center">Status</th>
                        <th className="p-2 text-right">Ordered Qty</th> {/* New column */}
                    </tr>
                    </thead>
                    <tbody>
                    {paginatedData.map((item) => {
                        const isSelected = selectedItems.includes(item);
                        const totalQty = item.quantity ?? 0;
                        const reservedQty = item.reserved_quantity ?? 0;
                        const availableQty = item.available_quantity ?? 0;

                        // 🧮 Simplified reorder logic based only on your data
                        const suggestedQty = totalQty - availableQty;
                        const needsReorder = availableQty < totalQty * 0.2;

                        return (
                            <tr
                                key={`${item.branch_id}-${item.product_id}`}
                                className={`border-t hover:bg-gray-50 cursor-pointer ${isSelected ? "bg-blue-100" : ""}`}
                            >
                                {/* Row Checkbox */}
                                <td className="p-2 text-center">
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => {
                                            setSelectedItems((prev) =>
                                                prev.includes(item)
                                                    ? prev.filter((i) => i !== item)
                                                    : [...prev, item]
                                            );
                                            if (selectAllAcrossPages) setSelectAllAcrossPages(false);
                                        }}
                                    />
                                </td>

                                <td className="p-2">{item.branch_name}</td>
                                <td className="p-2">{item.product_code}</td>
                                <td className="p-2">{item.product_name}</td>
                                <td className="p-2">{item.product_category}</td>
                                <td className="p-2 text-right">{item.quantity}</td>
                                <td className="p-2 text-right">{item.reserved_quantity}</td>
                                <td className="p-2 text-right">{item.available_quantity}</td>
                                <td className="p-2 text-right">
                                    {item.last_restock_date ? item.last_restock_date : "—"}
                                </td>

                                {/* 🔢 Reorder calculations */}
                                <td className="p-2 text-right">{suggestedQty}</td>
                                <td className={`p-2 text-center font-semibold ${needsReorder ? "text-red-600" : "text-green-600"}`}>
                                    {needsReorder ? "Reorder Needed" : "OK"}
                                </td>

                                {/* Ordered Quantity Input */}
                                <td className="p-2 text-right">
                                    <input
                                        type="number"
                                        min="0"
                                        value={orderedQuantities[item.product_id] ?? ""}
                                        onChange={(e) =>
                                            handleOrderedQuantityChange(item.product_id, Number(e.target.value))
                                        }
                                        className="border rounded p-1 w-20 text-right"
                                    />
                                </td>


                            </tr>
                        );
                    })}
                    </tbody>
                </table>
            </div>


            {/* ✅ Pagination */}
            <div className="flex justify-between items-center mt-4 text-sm">
        <span>
          Showing {Math.min((page - 1) * pageSize + 1, totalItems)}–
            {Math.min(page * pageSize, totalItems)} of {totalItems} items
        </span>
                <div className="flex items-center gap-2">
                    <button
                        disabled={page === 1}
                        onClick={prevPage}
                        className="px-2 py-1 border rounded disabled:opacity-50 hover:bg-gray-100"
                    >
                        Prev
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                        <button
                            key={p}
                            onClick={() => goToPage(p)}
                            className={`px-3 py-1 border rounded ${
                                page === p ? "bg-blue-600 text-white" : "hover:bg-gray-100"
                            }`}
                        >
                            {p}
                        </button>
                    ))}
                    <button
                        disabled={page === totalPages}
                        onClick={nextPage}
                        className="px-2 py-1 border rounded disabled:opacity-50 hover:bg-gray-100"
                    >
                        Next
                    </button>
                </div>
            </div>
            {/* ✅ Create PO Modal */}
            {showCreatePOModal && (
                <CreatePOModal
                    items={selectedItems}
                    onClose={() => setShowCreatePOModal(false)} // ✅ correct state handler
                    onSubmit={handlePOCreated}
                    initialQuantities={selectedQuantities}
                />
            )}





            {/* ✅ Export Modal */}
            {showExportModal && (
                <div className="fixed inset-0 flex justify-center items-center z-50 backdrop-blur-sm bg-transparent/10">
                    <div className="bg-white/90 backdrop-blur-md p-6 rounded-xl shadow-2xl w-96 border border-gray-200 flex flex-col">
                        <h2 className="text-lg font-semibold mb-3 text-gray-800 text-center">
                            Select Fields to Export
                        </h2>

                        <div className="max-h-60 overflow-y-auto border border-gray-200 p-3 rounded-lg mb-5 bg-white/70">
                            {Object.keys(initialData[0] || {}).map((field) => (
                                <label key={field} className="flex items-center space-x-2 mb-2">
                                    <input
                                        type="checkbox"
                                        checked={selectedFields.includes(field)}
                                        onChange={() => toggleField(field)}
                                        className="cursor-pointer"
                                    />
                                    <span className="capitalize text-sm text-gray-700">
                    {field.replace(/_/g, " ")}
                  </span>
                                </label>
                            ))}


                        </div>
                        {selectedItems.length > 0 && (

                            <div className="flex justify-end space-x-3 mt-auto pt-2 border-t border-gray-200">
                            <button
                                className="px-4 py-2 text-sm font-medium border rounded-lg hover:bg-gray-100 text-gray-700 transition"
                                onClick={() => setShowExportModal(false)}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleExport(selectedItems)}
                                className="px-3 py-1 md:px-4 md:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm md:text-base"
                            >
                                Export Selected ({selectedItems.length})
                            </button>
                        </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
