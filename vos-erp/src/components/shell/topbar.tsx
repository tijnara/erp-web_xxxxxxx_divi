// src/components/shell/topbar.tsx
"use client";
import { useTheme } from "next-themes";
import { Sun, MoonStar } from "lucide-react";

export function Topbar() {
    const { theme, setTheme } = useTheme();
    return (
        <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/80 px-4 py-3 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
            <div className="mx-auto max-w-7xl flex items-center justify-between">
                <div className="font-medium">Internal Operations</div>
                <button
                    className="rounded-md px-2 py-1 hover:bg-zinc-200 dark:hover:bg-zinc-800"
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    aria-label="Toggle theme"
                >
                    <Sun className="h-5 w-5 dark:hidden" />
                    <MoonStar className="h-5 w-5 hidden dark:block" />
                </button>
            </div>
        </header>
    );
}
