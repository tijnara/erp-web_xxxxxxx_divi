// modules/announcements-management/types.ts
export interface Announcement {
    id: number;
    title: string;
    content: string;
    image?: string;
    type: string;
    created_by: string;
    created_at: string;
    updated_at: string;
    posting_date: string;
    hidden_date: string;
}

// Optional: API response type
export interface AnnouncementApiResponse {
    data: Announcement[];
}
