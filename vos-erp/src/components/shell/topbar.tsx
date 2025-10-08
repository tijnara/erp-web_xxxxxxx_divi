// src/components/shell/topbar.tsx
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Sun, MoonStar, Menu, ChevronsUpDown, User, LogOut } from "lucide-react";
import { useSession } from "@/hooks/use-session";

export function Topbar() {
    const { theme, setTheme } = useTheme();
    const { session } = useSession();
    const [open, setOpen] = useState(false);

    const user = session?.user;

    const email = user?.email || "Account";

    const name = user?.name || [user?.first_name, user?.last_name].filter(Boolean).join(" ");

    const initials = useMemo(() => {
        const base = name || email;
        const parts = base.split(/[\s.@_]+/).filter(Boolean);
        return (parts[0]?.[0] || "A").toUpperCase() + (parts[1]?.[0]?.toUpperCase() || "");
    }, [name, email]);

    function toggleSidebar() {
        document.body.dispatchEvent(new CustomEvent("toggle-sidebar"));
    }

    return (
        <header className="sticky top-0 z-40 border-b border-border bg-background/80 px-4 py-3 backdrop-blur">
            <div className="mx-auto max-w-7xl flex items-center justify-between gap-3">
                {/* Left: mobile menu + title */}
                <div className="flex items-center gap-2">
                    <button
                        className="md:hidden rounded-md px-2 py-1 hover:bg-accent"
                        onClick={toggleSidebar}
                        aria-label="Toggle navigation"
                    >
                        <Menu className="h-5 w-5" />
                    </button>
                    <div className="font-medium">DV Appliance</div>
                </div>

                {/* Right: theme toggle + user dropdown */}
                <div className="flex items-center gap-2 relative">
                    <button
                        className="rounded-md px-2 py-1 hover:bg-accent"
                        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                        aria-label="Toggle theme"
                    >
                        <Sun className="h-5 w-5 dark:hidden" />
                        <MoonStar className="h-5 w-5 hidden dark:block" />
                    </button>

                    <button
                        onClick={() => setOpen((o) => !o)}
                        className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-accent"
                        aria-label="Account menu"
                    >
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
              {initials}
            </span>
                        <span className="hidden sm:block text-sm">{name || email}</span>
                        <ChevronsUpDown className="h-4 w-4 opacity-60" />
                    </button>

                    {open && (
                        <div
                            className="absolute right-0 top-10 w-56 rounded-lg border border-border bg-card shadow-md overflow-hidden"
                            onMouseLeave={() => setOpen(false)}
                        >
                            <div className="p-1">
                                <Link
                                    href="/profile"
                                    className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent"
                                >
                                    <User className="h-4 w-4" />
                                    Profile
                                </Link>
                                <Link
                                    href="/logout"
                                    className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent"
                                >
                                    <LogOut className="h-4 w-4" />
                                    Logout
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
