"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";
import { nav, type NavItem, type NavLeaf } from "@/config/nav";

// --- type guards ------------------------------------------------------------
function isLeaf(item: NavItem): item is NavLeaf {
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
function Leaf({ href, label, icon: Icon }: NavLeaf) {
    const pathname = usePathname();
    const active = isActive(pathname, href);
    return (
        <Link
            href={href}
            className={[
                "flex items-center gap-3 rounded-md px-3 py-2 text-base",
                active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            ].join(" ")}
        >
            {Icon && <Icon className="h-4 w-4" />}
            {label}
        </Link>
    );
}

// --- node (collapsible) -----------------------------------------------------
function Node({ item, depth = 0 }: { item: NavItem; depth?: number }) {
    const pathname = usePathname();
    const defaultOpen = useMemo(() => anyChildMatches(pathname, item), [pathname, item]);
    const [open, setOpen] = useState(defaultOpen);
    const Icon = item.icon;

    if (hasChildren(item)) {
        return (
            <div className={depth ? "ml-1" : ""}>
                <button
                    onClick={() => setOpen((v) => !v)}
                    className="group w-full flex items-center justify-between rounded-md px-3 py-2 text-left hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                >
                    <span className="text-base font-medium flex items-center gap-3">
                        {Icon && <Icon className="h-4 w-4" />}
                        {item.label}
                    </span>
                    <ChevronRight
                        className={`h-4 w-4 transition-transform ${open ? "rotate-90" : ""} opacity-60`}
                    />
                </button>
                <div className={`${open ? "block" : "hidden"} pl-2 space-y-1`}>
                    {item.children.map((child) =>
                        hasChildren(child) ? (
                            <Node key={child.label} item={child} depth={depth + 1} />
                        ) : isLeaf(child) ? (
                            <Leaf
                                key={child.href}
                                href={child.href}
                                label={child.label}
                                icon={child.icon}
                            />
                        ) : null
                    )}
                </div>
            </div>
        );
    }

    // top-level leaf (only render if it truly is a leaf)
    return isLeaf(item) ? (
        <Leaf href={item.href} label={item.label} icon={item.icon} />
    ) : null;
}

// --- sidebar shell ----------------------------------------------------------
export function Sidebar() {
    return (
        <aside className="flex w-72 shrink-0 border-r border-sidebar-border bg-sidebar backdrop-blur-sm">
            <div className="w-full p-3">
                <div className="flex items-center gap-2 px-2 pb-2 text-lg font-semibold tracking-tight">
                    <img
                        src="/vos.ico"
                        alt="VOS ERP logo"
                        width={24}
                        height={24}
                        className="bg-transparent"
                    />
                    <span>VOS ERP</span>
                </div>
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
