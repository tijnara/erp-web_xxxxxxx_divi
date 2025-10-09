"use client";

export function HeaderTabs({ tab, onChange }: { tab: string; onChange: (tab: string) => void }) {
    return (
        <div className="flex space-x-4 border-b border-gray-300 pb-2">
            <button
                className={`px-4 py-2 ${tab === "branches" ? "font-bold border-b-2 border-blue-500" : "text-gray-500"}`}
                onClick={() => onChange("branches")}
            >
                Branches
            </button>
        </div>
    );
}
