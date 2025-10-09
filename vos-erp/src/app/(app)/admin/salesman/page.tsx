// src/app/(app)/admin/salesman/page.tsx
import { SalesmanManagementModule } from "@/modules/salesman-management";

export const dynamic = "force-dynamic";

export default function SalesmanPage() {
    return (
        <div className="p-4 md:p-6">
            <SalesmanManagementModule />
        </div>
    );
}
