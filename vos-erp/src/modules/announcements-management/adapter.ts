// modules/announcements-management/adapter.ts
import { Announcement } from "./types";

export function formatAnnouncements(data: Announcement[]): Announcement[] {
    return data
        .map(item => ({
            ...item,
            posting_date: new Date(item.posting_date).toLocaleDateString(),
            hidden_date: new Date(item.hidden_date).toLocaleDateString(),
        }))
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}
