"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";
import { nav, type NavItem } from "@/config/nav";

// --- type guards ------------------------------------------------------------
function isLeaf(item: NavItem): item is { label: string; href: string } {
    return "href" in item && typeof (item as any).href === "string";
}
function hasChildren(item: NavItem): item is { label: string; children: NavItem[] } {
    return "children" in item && Array.isArray((item as any).children);
}

// --- helpers ----------------------------------------------------------------
function isActive(pathname: string, href: string) {
    return pathname === href || pathname.startsWith(href + "/");
}
function anyChildMatches(pathname: string, item: NavItem): boolean {
    if (isLeaf(item)) return isActive(pathname, item.href);
    if (hasChildren(item)) return item.children.some((c) => anyChildMatches(pathname, c));
    return false;
}

// --- leaf -------------------------------------------------------------------
function Leaf({ href, label }: { href: string; label: string }) {
    const pathname = usePathname();
    const active = isActive(pathname, href);
    return (
        <Link
            href={href}
            className={[
                "block rounded-md px-3 py-2 text-sm",
                active
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "hover:bg-zinc-200 dark:hover:bg-zinc-800",
            ].join(" ")}
        >
            {label}
        </Link>
    );
}

// --- node (collapsible) -----------------------------------------------------
function Node({ item, depth = 0 }: { item: NavItem; depth?: number }) {
    const pathname = usePathname();
    const defaultOpen = useMemo(() => anyChildMatches(pathname, item), [pathname, item]);
    const [open, setOpen] = useState(defaultOpen);

    if (hasChildren(item)) {
        return (
            <div className={depth ? "ml-1" : ""}>
                <button
                    onClick={() => setOpen((v) => !v)}
                    className="group w-full flex items-center justify-between rounded-md px-3 py-2 text-left hover:bg-zinc-200 dark:hover:bg-zinc-800"
                >
                    <span className="text-sm font-medium">{item.label}</span>
                    <ChevronRight
                        className={`h-4 w-4 transition-transform ${open ? "rotate-90" : ""} opacity-60`}
                    />
                </button>
                <div className={`${open ? "block" : "hidden"} pl-2 space-y-1`}>
                    {item.children.map((child) =>
                        hasChildren(child) ? (
                            <Node key={child.label} item={child} depth={depth + 1} />
                        ) : isLeaf(child) ? (
                            <Leaf key={child.href} href={child.href} label={child.label} />
                        ) : null
                    )}
                </div>
            </div>
        );
    }

    // top-level leaf (only render if it truly is a leaf)
    return isLeaf(item) ? <Leaf href={item.href} label={item.label} /> : null;
}

// --- sidebar shell ----------------------------------------------------------
export function Sidebar() {
    return (
        <aside className="flex w-72 shrink-0 border-r border-zinc-200 bg-zinc-50/80 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/80">
            <div className="w-full p-3">
                <div className="px-2 pb-2 text-sm font-semibold tracking-tight">VOS ERP</div>
                <div className="h-[calc(100vh-64px)] overflow-auto pr-1">
                    <nav className="space-y-1">
                        {nav.map((i) => (
                            <Node key={i.label} item={i} />
                        ))}
                    </nav>
                </div>
            </div>
        </aside>
    );
}
