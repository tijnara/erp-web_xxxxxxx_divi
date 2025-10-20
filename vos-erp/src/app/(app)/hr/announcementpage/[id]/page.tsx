"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Announcement } from "@/modules/announcements-management/types";
import { fetchAnnouncements } from "@/modules/announcements-management/providers/HttpDataProvider";
import { formatAnnouncements } from "@/modules/announcements-management/adapter";

export default function AnnouncementDetailPage() {
    const params = useParams();
    const router = useRouter();
    const announcementId = params.id;

    const [announcement, setAnnouncement] = useState<Announcement | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadAnnouncement() {
            try {
                const data = await fetchAnnouncements();
                const formatted = formatAnnouncements(data);
                const found = formatted.find(a => a.id.toString() === announcementId);
                setAnnouncement(found ?? null);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        loadAnnouncement();
    }, [announcementId]);

    if (loading) return <p>Loading announcement...</p>;
    if (error) return <p>Error: {error}</p>;
    if (!announcement) return <p>Announcement not found</p>;

    return (
        <div className="container mx-auto p-6">
            <button
                onClick={() => router.push("/dashboard")}
                className="mb-4 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
            >
                ← Back to Dashboard
            </button>

            <h1 className="text-3xl font-bold mb-4">{announcement.title}</h1>
            {announcement.image && (
                <img
                    src={announcement.image}
                    alt={announcement.title}
                    className="w-full h-64 object-cover mb-4 rounded"
                />
            )}
            <p className="mb-4">{announcement.content}</p>
            <p className="text-sm text-gray-500">
                Posted by {announcement.created_by} on {announcement.posting_date}
            </p>

        </div>
    );
}
