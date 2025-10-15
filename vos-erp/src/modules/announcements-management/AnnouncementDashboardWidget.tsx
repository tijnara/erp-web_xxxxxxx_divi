"use client";

import { useEffect, useState } from "react";
import { Announcement } from "./types";
import { fetchAnnouncements } from "./providers/HttpDataProvider";
import { formatAnnouncements } from "./adapter";
import AnnouncementWidget from "./components/AnnouncementWidget";

export default function AnnouncementDashboardWidget() {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showAll, setShowAll] = useState(false); // toggle state

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

    if (loading) return <p>Loading announcements...</p>;
    if (error) return <p>Error: {error}</p>;

    // ✅ Apply visibility filter (same as in AnnouncementWidget)
    const today = new Date();
    const visibleAnnouncements = announcements.filter(item => {
        if (!item.hidden_date) return true;
        return new Date(item.hidden_date) >= today;
    });

    const hasMoreThanThree = visibleAnnouncements.length > 3;
    const toggleShowAll = () => setShowAll(prev => !prev);

    return (
        <div className="p-4 bg-white rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">Announcements</h2>

            {/* ✅ Pass limit only if not showing all */}
            <AnnouncementWidget
                announcements={visibleAnnouncements}
                limit={showAll ? undefined : 3}
            />

            {/* ✅ Only show the toggle button if there are more than 3 announcements */}
            {hasMoreThanThree && (
                <div className="mt-4 text-right">
                    <button
                        onClick={toggleShowAll}
                        className="px-4 py-2 text-gray-700 hover:text-blue-600 transition"
                    >
                        {showAll ? "Show Less" : "View All Announcements"}
                    </button>
                </div>
            )}
        </div>
    );
}
