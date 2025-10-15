import { Announcement } from "../types";
import Link from "next/link";

interface Props {
    announcements: Announcement[];
    limit?: number;
}

export default function AnnouncementWidget({ announcements, limit }: Props) {
    const today = new Date();

    // Helper: Assign colors based on type
    const getTypeColor = (type: string) => {
        switch (type) {
            case "General":
                return "bg-gray-200 text-gray-900"; // improved contrast on gray background
            case "Update":
                return "bg-blue-100 text-blue-800";
            case "Urgent":
                return "bg-red-100 text-red-800";
            case "Event":
                return "bg-purple-100 text-purple-800";
            case "Maintenance":
                return "bg-amber-100 text-amber-800";
            case "Holiday":
                return "bg-green-100 text-green-800";
            default:
                return "bg-gray-200 text-gray-900";
        }
    };

    // Filter out expired announcements
    const visibleAnnouncements = announcements.filter(item => {
        if (!item.hidden_date) return true; // always show if no hidden date
        return new Date(item.hidden_date) >= today;
    });

    // Apply optional limit after filtering
    const displayList = limit ? visibleAnnouncements.slice(0, limit) : visibleAnnouncements;

    return (
        <div className="grid gap-4">
            {displayList.map(item => (
                <Link
                    key={item.id}
                    href={`/hr/announcementpage/${item.id}`} // dynamic route
                    className="block border rounded-lg p-3 shadow hover:shadow-md transition hover:bg-gray-50"
                >
                    <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>

                    <p className="text-sm text-gray-600">
                        {item.content.length > 60 ? item.content.slice(0, 60) + "..." : item.content}
                    </p>

                    <p className="text-xs text-gray-400 mt-1">
                        Posted by {item.created_by} on {item.posting_date}
                    </p>

                    <span
                        className={`inline-block mt-2 px-2 py-1 text-xs font-semibold rounded ${getTypeColor(item.type)}`}
                    >
            {item.type}
          </span>
                </Link>
            ))}

            {/* Optional message if there are no visible announcements */}
            {displayList.length === 0 && (
                <p className="text-sm text-gray-500 italic text-center">
                    No current announcements to display.
                </p>
            )}
        </div>
    );
}
