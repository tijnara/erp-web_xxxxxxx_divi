import { LineDiscountManagementModule } from "@/modules/line-discount-management";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <div className="p-4 md:p-6">
      <LineDiscountManagementModule />
    </div>
  );
}

