import { BranchManagementModule } from "./BranchManagementModule";
export * from "./types";

export default function Page() {
    return (
        <div className="p-4 md:p-6">
            <BranchManagementModule />
        </div>
    );
}
