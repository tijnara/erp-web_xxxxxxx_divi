"use client";
import {
  useDiscountTypeManagement,
} from "@/modules/discount-type-management/providers/DiscountTypeManagementProvider";

export default function StatBar() {
  const { total } = useDiscountTypeManagement();
  return (
    <div className="flex items-center text-sm text-muted-foreground">
      {total} Total Discount Types
    </div>
  );
}

