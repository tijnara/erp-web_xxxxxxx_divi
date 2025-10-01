// src/app/(app)/admin/product/page.tsx
import { ProductManagementModule } from "@/modules/product-management";

export const dynamic = "force-dynamic";

export default function Page() {
    return (
        <div className="p-4 md:p-6">
            <ProductManagementModule />
        </div>
    );
}
