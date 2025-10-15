// modules/announcements-management/providers/HttpDataProvider.ts
import { Announcement, AnnouncementApiResponse } from "../types";

export async function fetchAnnouncements(): Promise<Announcement[]> {
    const res = await fetch("http://100.119.3.44:8090/items/announcement");
    if (!res.ok) throw new Error("Failed to fetch announcements");

    const result: AnnouncementApiResponse = await res.json();
    return result.data ?? [];
}

export async function addAnnouncement(newAnnouncement: Partial<Announcement>): Promise<Announcement> {
    const res = await fetch("http://100.119.3.44:8090/items/announcement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAnnouncement),
    });

    if (!res.ok) throw new Error("Failed to add announcement");

    const result = await res.json();
    return result.data;
}

export async function fetchUserById(id: number): Promise<{ id: number; name: string }> {
    const res = await fetch(`http://100.119.3.44:8090/items/user/${id}`);
    if (!res.ok) throw new Error("Failed to fetch user info");
    const result = await res.json();
    return result.data;
}


