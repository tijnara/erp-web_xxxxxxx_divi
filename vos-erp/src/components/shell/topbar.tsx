// src/components/shell/topbar.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Sun, MoonStar, Menu, ChevronsUpDown } from "lucide-react";

type MeResponse = {
    user: {
        directus?: { email?: string; first_name?: string; last_name?: string } | null;
        profile?: { user_email?: string; user_fname?: string; user_lname?: string } | null;
    } | null;
};

export function Topbar() {
    const { theme, setTheme } = useTheme();
    const [me, setMe] = useState<MeResponse["user"]>(null);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const res = await fetch("/api/auth/me", { cache: "no-store" });
                const json: MeResponse = await res.json();
                if (mounted) setMe(json?.user ?? null);
            } catch {
                // ignore
            }
        })();
        return () => { mounted = false; };
    }, []);

    const email =
        me?.directus?.email ||
        me?.profile?.user_email ||
        "Account";

    const name =
        [me?.directus?.first_name || me?.profile?.user_fname, me?.directus?.last_name || me?.profile?.user_lname]
            .filter(Boolean)
            .join(" ");

    const initials = useMemo(() => {
        const base = name || email;
        const parts = base.split(/[\s.@_]+/).filter(Boolean);
        return (parts[0]?.[0] || "A").toUpperCase() + (parts[1]?.[0]?.toUpperCase() || "");
    }, [name, email]);

    function toggleSidebar() {
        document.body.dispatchEvent(new CustomEvent("toggle-sidebar"));
    }

    return (
        <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/80 px-4 py-3 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
            <div className="mx-auto max-w-7xl flex items-center justify-between gap-3">
                {/* Left: mobile menu + title */}
                <div className="flex items-center gap-2">
                    <button
                        className="md:hidden rounded-md px-2 py-1 hover:bg-zinc-200 dark:hover:bg-zinc-800"
                        onClick={toggleSidebar}
                        aria-label="Toggle navigation"
                    >
                        <Menu className="h-5 w-5" />
                    </button>
                    <div className="font-medium">DIVI Appliances</div>
                </div>

                {/* Right: theme toggle + user dropdown */}
                <div className="flex items-center gap-2 relative">
                    <button
                        className="rounded-md px-2 py-1 hover:bg-zinc-200 dark:hover:bg-zinc-800"
                        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                        aria-label="Toggle theme"
                    >
                        <Sun className="h-5 w-5 dark:hidden" />
                        <MoonStar className="h-5 w-5 hidden dark:block" />
                    </button>

                    <button
                        onClick={() => setOpen((o) => !o)}
                        className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-zinc-200 dark:hover:bg-zinc-800"
                        aria-label="Account menu"
                    >
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-zinc-200 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
              {initials}
            </span>
                        <span className="hidden sm:block text-sm">{name || email}</span>
                        <ChevronsUpDown className="h-4 w-4 opacity-60" />
                    </button>

                    {open && (
                        <div
                            className="absolute right-0 top-10 w-56 rounded-lg border border-zinc-200 bg-white shadow-md dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden"
                            onMouseLeave={() => setOpen(false)}
                        >
                            <Link
                                href="/account/profile"
                                className="block px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
                            >
                                Profile
                            </Link>
                            <Link
                                href="/settings"
                                className="block px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
                            >
                                Settings
                            </Link>
                            <div className="my-1 border-t border-zinc-200 dark:border-zinc-800" />
                            <button
                                className="block w-full text-left px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                onClick={async () => {
                                    await fetch("/api/auth/logout", { method: "POST" });
                                    location.href = "/login";
                                }}
                            >
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
