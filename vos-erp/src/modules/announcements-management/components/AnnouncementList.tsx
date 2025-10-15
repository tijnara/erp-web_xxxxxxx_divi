// modules/announcements-management/components/views/AnnouncementList.tsx
import { Announcement } from "../types";
import Link from "next/link";

interface Props {
    announcements: Announcement[];
    showEdit?: boolean;
}

export default function AnnouncementList({ announcements, showEdit = true }: Props) {

    const getTypeColor = (type: string) => {
        switch (type) {
            case "General":
                return "bg-sky-100 text-sky-800";
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
                return "bg-gray-100 text-gray-800";
        }
    };

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-300 rounded-lg shadow-sm">
                <thead className="bg-gray-100">
                <tr>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Title</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Created By</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Posting Date</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Hidden Date</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Type</th>
                    {showEdit && (
                        <th className="px-4 py-2 text-center text-sm font-semibold text-gray-700">Action</th>
                    )}
                </tr>
                </thead>
                <tbody>
                {announcements.length > 0 ? (
                    announcements.map((item) => (
                        <tr
                            key={item.id}
                            className="border-t hover:bg-gray-50 transition"
                        >
                            <td className="px-4 py-2 font-medium text-gray-900">{item.title}</td>
                            <td className="px-4 py-2 text-gray-700">{item.created_by}</td>
                            <td className="px-4 py-2 text-gray-700">{item.posting_date}</td>
                            <td className="px-4 py-2 text-gray-700">{item.hidden_date || "—"}</td>
                            <td className="px-4 py-2">
                  <span
                      className={`px-2 py-1 text-xs font-semibold rounded ${getTypeColor(item.type)}`}
                  >
                    {item.type}
                  </span>
                            </td>
                            {showEdit && (
                                <td className="px-4 py-2 text-center">
                                    <Link
                                        href={`/hr/edit-announcement/${item.id}`}
                                        className="text-blue-600 hover:underline"
                                    >
                                        Edit
                                    </Link>
                                </td>
                            )}
                        </tr>
                    ))
                ) : (
                    <tr>
                        <td
                            colSpan={showEdit ? 6 : 5}
                            className="text-center py-4 text-gray-500 italic"
                        >
                            No announcements found.
                        </td>
                    </tr>
                )}
                </tbody>
            </table>
        </div>
    );
}
