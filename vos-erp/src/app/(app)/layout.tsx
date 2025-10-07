// src/app/(app)/layout.tsx
'use client';

import { Sidebar } from "@/components/shell/sidebar";
import { Topbar } from "@/components/shell/topbar";
import { useEffect } from "react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        const handleBeforeUnload = () => {
            navigator.sendBeacon('/api/auth/logout', new Blob());
        };

        window.addEventListener('unload', handleBeforeUnload);

        return () => {
            window.removeEventListener('unload', handleBeforeUnload);
        };
    }, []);

    return (
        <div className="flex min-h-screen">
            <Sidebar />
            <div className="flex-1 min-w-0">
                <Topbar />
                <main className="p-6">
                    <div className="mx-auto max-w-7xl">{children}</div>
                </main>
            </div>
        </div>
    );
}
