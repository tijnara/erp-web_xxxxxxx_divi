"use client";

import { useEffect, useState } from "react";

export function ReplicatedView({ provider }: { provider: { fetchReplicated: (page: number) => Promise<any>; registerReplicated: (data: any) => Promise<void> } }) {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [newData, setNewData] = useState({
        description: "",
        name: "",
        code: "",
        city: "",
        state: "",
        phone: "",
    });

    useEffect(() => {
        async function loadData() {
            setLoading(true);
            try {
                const result = await provider.fetchReplicated(page);
                setData(result.data);
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, [provider, page]);
"use client";
    const handleRegister = async () => {
        try {
            await provider.registerReplicated(newData);
            alert("Data registered successfully!");
            setNewData({ description: "", name: "", code: "", city: "", state: "", phone: "" });
        } catch (error) {
            console.error("Error registering data:", error);
            alert("Failed to register data.");
        }
    };

    if (loading) {
        return <p>Loading data...</p>;
    }

    return (
        <div>
            <table className="table-auto w-full border-collapse border border-gray-300">
                <thead>
                    <tr>
                        <th className="border border-gray-300 px-4 py-2">Name</th>
                        <th className="border border-gray-300 px-4 py-2">Code</th>
                        <th className="border border-gray-300 px-4 py-2">City</th>
                        <th className="border border-gray-300 px-4 py-2">State</th>
                        <th className="border border-gray-300 px-4 py-2">Phone</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((item) => (
                        <tr key={item.id}>
                            <td className="border border-gray-300 px-4 py-2">{item.name}</td>
                            <td className="border border-gray-300 px-4 py-2">{item.code}</td>
                            <td className="border border-gray-300 px-4 py-2">{item.city}</td>
                            <td className="border border-gray-300 px-4 py-2">{item.state}</td>
                            <td className="border border-gray-300 px-4 py-2">{item.phone}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <div className="flex justify-between mt-4">
                <button
                    className="px-4 py-2 bg-gray-200 rounded-md"
                    disabled={page === 1}
                    onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                >
                    Previous
                </button>
                <button
                    className="px-4 py-2 bg-gray-200 rounded-md"
                    onClick={() => setPage((prev) => prev + 1)}
                >
                    Next
                </button>
            </div>
            <div className="mt-6">
                <h2 className="text-xl font-bold">Register New Data</h2>
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleRegister();
                    }}
                    className="space-y-4"
                >
                    <input
                        type="text"
                        placeholder="Description"
                        value={newData.description}
                        onChange={(e) => setNewData({ ...newData, description: e.target.value })}
                        className="block w-full border border-gray-300 rounded-md px-4 py-2"
                    />
                    <input
                        type="text"
                        placeholder="Name"
                        value={newData.name}
                        onChange={(e) => setNewData({ ...newData, name: e.target.value })}
                        className="block w-full border border-gray-300 rounded-md px-4 py-2"
                    />
                    <input
                        type="text"
                        placeholder="Code"
                        value={newData.code}
                        onChange={(e) => setNewData({ ...newData, code: e.target.value })}
                        className="block w-full border border-gray-300 rounded-md px-4 py-2"
                    />
                    <input
                        type="text"
                        placeholder="City"
                        value={newData.city}
                        onChange={(e) => setNewData({ ...newData, city: e.target.value })}
                        className="block w-full border border-gray-300 rounded-md px-4 py-2"
                    />
                    <input
                        type="text"
                        placeholder="State"
                        value={newData.state}
                        onChange={(e) => setNewData({ ...newData, state: e.target.value })}
                        className="block w-full border border-gray-300 rounded-md px-4 py-2"
                    />
                    <input
                        type="text"
                        placeholder="Phone"
                        value={newData.phone}
                        onChange={(e) => setNewData({ ...newData, phone: e.target.value })}
                        className="block w-full border border-gray-300 rounded-md px-4 py-2"
                    />
                    <button
                        type="submit"
                        className="px-4 py-2 bg-blue-500 text-white rounded-md"
                    >
                        Register Data
                    </button>
                </form>
            </div>
        </div>
    );
}

import { useState } from "react";
import { HeaderTabs } from "./components/HeaderTabs";
import { ReplicatedView } from "./components/ReplicatedView";
import { fetchProvider } from "./providers/fetchProvider";

export function ReplicatedManagementModule() {
    const provider = fetchProvider();
    const [tab, setTab] = useState<"replicated">("replicated");

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-2xl font-bold">Replicated Management</h1>
                <p className="text-base text-muted-foreground">
                    Manage your replicated relationships and track performance
                </p>
            </div>
            <HeaderTabs tab={tab} onChange={setTab} />
            <div className="mt-4">
                {tab === "replicated" && <ReplicatedView provider={provider} />}
            </div>
        </div>
    );
}
