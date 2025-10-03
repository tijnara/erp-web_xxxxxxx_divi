// src/app/(app)/admin/customer/page.tsx
import { CustomerManagementModule } from "@/modules/customer-management";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <div className="p-4 md:p-6">
      <CustomerManagementModule />
    </div>
  );
}
