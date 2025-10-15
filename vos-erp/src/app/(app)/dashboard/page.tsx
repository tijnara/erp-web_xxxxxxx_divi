import { AnnouncementDashboardWidget } from "@/modules/announcements-management";

export default function Page() {
    return (
        <div className="grid gap-6">
            <AnnouncementDashboardWidget />
            {/* Other dashboard widgets here */}
        </div>
    );
}
