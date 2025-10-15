"use client";

import { useEffect, useState } from "react";
import { Announcement } from "./types";
import { fetchAnnouncements } from "./providers/HttpDataProvider";
import { formatAnnouncements } from "./adapter";
import AnnouncementList from "./components/AnnouncementList";

export default function AnnouncementManagementModule() {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [departmentName, setDepartmentName] = useState<string>("");

    const [formData, setFormData] = useState({
        title: "",
        content: "",
        image: null as File | null,
        type: "",
        posting_date: "",
        hidden_date: "",
    });

    // ✅ Fetch announcements
    useEffect(() => {
        async function loadAnnouncements() {
            try {
                const data = await fetchAnnouncements();
                setAnnouncements(formatAnnouncements(data));
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        loadAnnouncements();
    }, []);

    // ✅ Fetch current user's department
    useEffect(() => {
        const userId = localStorage.getItem("user_id"); // make sure it matches your login storage key
        if (!userId) return;

        async function fetchUserAndDepartment() {
            try {
                // 1️⃣ Fetch user
                const userRes = await fetch(`http://100.119.3.44:8090/items/user/${userId}`);
                if (!userRes.ok) throw new Error("Failed to fetch user");
                const userData = await userRes.json();
                const departmentId = userData.data?.user_department;

                if (!departmentId) {
                    setDepartmentName("Unknown Department");
                    return;
                }

                // 2️⃣ Fetch department
                const deptRes = await fetch(`http://100.119.3.44:8090/items/department/${departmentId}`);
                if (!deptRes.ok) throw new Error("Failed to fetch department");
                const deptData = await deptRes.json();
                setDepartmentName(deptData.data?.department_name || "Unknown Department");

            } catch (err) {
                console.error("Failed to fetch department info:", err);
                setDepartmentName("Unknown Department");
            }
        }

        fetchUserAndDepartment();
    }, []);

    // ✅ Handle input changes
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, image: e.target.files?.[0] || null }));
    };

    // ✅ Submit new announcement
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const now = new Date().toISOString();

            let bodyData: any = {
                title: formData.title,
                content: formData.content,
                type: formData.type,
                created_by: departmentName, // 🏆 department name goes here
                posting_date: formData.posting_date,
                hidden_date: formData.hidden_date,
                created_at: now,
                updated_at: now,
            };

            let res;

            if (formData.image) {
                const formDataToSend = new FormData();
                for (const [key, value] of Object.entries(bodyData)) {
                    formDataToSend.append(key, value as string);
                }
                formDataToSend.append("image", formData.image);
                res = await fetch("http://100.119.3.44:8090/items/announcement", {
                    method: "POST",
                    body: formDataToSend,
                });
            } else {
                res = await fetch("http://100.119.3.44:8090/items/announcement", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(bodyData),
                });
            }

            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(`Failed to add announcement: ${errorText}`);
            }

            alert("✅ Announcement added successfully!");
            setShowForm(false);

            // Reset form and reload
            setFormData({
                title: "",
                content: "",
                image: null,
                type: "",
                posting_date: "",
                hidden_date: "",
            });

            const updated = await fetchAnnouncements();
            setAnnouncements(formatAnnouncements(updated));
        } catch (err: any) {
            console.error("Error adding announcement:", err);
            alert("❌ Error: " + err.message);
        }
    };

    if (loading) return <p>Loading announcements...</p>;
    if (error) return <p>Error: {error}</p>;

    return (
        <div className="container mx-auto p-6 relative">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Announcements</h1>
                <button
                    onClick={() => setShowForm(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition"
                >
                    + Add Announcement
                </button>
            </div>

            <AnnouncementList announcements={announcements} />

            {/* ✅ Modal */}
            {showForm && (
                <div className="fixed inset-0 flex items-center justify-center z-50">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowForm(false)} />
                    <div className="relative bg-white p-8 rounded-lg shadow-lg z-10 w-full max-w-lg">
                        <h2 className="text-2xl font-semibold mb-4">Add New Announcement</h2>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <input type="text" name="title" placeholder="Title" value={formData.title}
                                   onChange={handleChange} required className="w-full border p-2 rounded" />

                            <textarea name="content" placeholder="Content" value={formData.content}
                                      onChange={handleChange} required className="w-full border p-2 rounded" rows={4} />

                            <select name="type" value={formData.type} onChange={handleChange} required
                                    className="w-full border p-2 rounded">
                                <option value="">Select Type</option>
                                <option value="General">General</option>
                                <option value="Update">Update</option>
                                <option value="Urgent">Urgent</option>
                                <option value="Urgent">Event</option>
                                <option value="Urgent">Maintenance</option>
                                <option value="Urgent">Holiday</option>

                            </select>

                            <input type="file" name="image" onChange={handleFileChange} accept="image/*"
                                   className="w-full border p-2 rounded" />

                            <div className="grid grid-cols-2 gap-4">
                                <input type="date" name="posting_date" value={formData.posting_date}
                                       onChange={handleChange} required className="border p-2 rounded w-full" />
                                <input type="date" name="hidden_date" value={formData.hidden_date}
                                       onChange={handleChange} required className="border p-2 rounded w-full" />
                            </div>

                            <div className="flex justify-end gap-3">
                                <button type="button" onClick={() => setShowForm(false)}
                                        className="bg-gray-300 text-gray-700 px-4 py-2 rounded">Cancel</button>
                                <button type="submit"
                                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Submit</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
