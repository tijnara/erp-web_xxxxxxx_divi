"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Option = { id: string | number; name: string; meta?: any };

export function AsyncSelect({
                                label,
                                placeholder,
                                fetchUrl,
                                initial,
                                onChange,
                                disabled,
                                mapOption,
                            }: {
    label: string;
    placeholder?: string;
    fetchUrl: string;                 // e.g. /api/lookup/brand
    initial?: Option | null;          // preselected (for edit)
    onChange: (opt: Option | null) => void;
    disabled?: boolean;
    mapOption?: (item: any) => Option;
}) {
    const [q, setQ] = useState("");
    const [open, setOpen] = useState(false);
    const [opts, setOpts] = useState<Option[]>([]);
    const [loading, setLoading] = useState(false);
    const [sel, setSel] = useState<Option | null>(initial ?? null);
    const timer = useRef<number | null>(null);
    const boxRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        setSel(initial ?? null);
        setQ("");
    }, [initial]);

    useEffect(() => {
        function onDocClick(e: MouseEvent) {
            if (!boxRef.current) return;
            if (!boxRef.current.contains(e.target as Node)) setOpen(false);
        }
        document.addEventListener("click", onDocClick);
        return () => document.removeEventListener("click", onDocClick);
    }, []);

    // debounce search
    useEffect(() => {
        if (!open) return;
        if (timer.current) window.clearTimeout(timer.current);
        timer.current = window.setTimeout(async () => {
            setLoading(true);
            try {
                // Use a base URL if fetchUrl is relative, otherwise use it as is.
                const url = new URL(fetchUrl.startsWith('http') ? fetchUrl : `${window.location.origin}${fetchUrl}`);
                if (q.trim()) {
                    // *** FIXED: Changed query parameter from "q" to "search" ***
                    url.searchParams.set("search", q.trim());
                }

                // Removed "credentials: 'include'" unless you specifically need it for cookies
                const res = await fetch(url.toString());
                const json = await res.json();

                let data = json.data || json;
                if (Array.isArray(data) && mapOption) {
                    data = data.map(mapOption);
                }
                setOpts(Array.isArray(data) ? data : []);
            } catch {
                setOpts([]);
            } finally {
                setLoading(false);
            }
        }, 200) as unknown as number;
        return () => {
            if (timer.current) window.clearTimeout(timer.current);
        };
    }, [q, open, fetchUrl, mapOption]);

    const display = useMemo(() => sel?.name ?? "", [sel]);

    return (
        <div className="relative" ref={boxRef}>
            <label className="text-sm">{label}</label>
            <div className="mt-1 flex items-center gap-2">
                <input
                    className="w-full rounded-md border px-3 py-2 bg-white dark:bg-zinc-900"
                    value={open ? q : display}
                    onChange={(e) => setQ(e.target.value)}
                    onFocus={() => {
                        setOpen(true);
                        // Start with the current selection name as the query
                        if(sel) setQ(sel.name);
                    }}
                    placeholder={placeholder}
                    disabled={disabled}
                />
                {sel && !disabled && (
                    <button
                        type="button"
                        className="text-xs rounded border px-2 py-1"
                        onClick={() => {
                            setSel(null);
                            onChange(null);
                            setQ("");
                        }}
                    >
                        Clear
                    </button>
                )}
            </div>

            {open && (
                <div className="absolute z-50 mt-1 w-full rounded-md border bg-white dark:bg-zinc-900 shadow max-h-60 overflow-y-auto">
                    {loading && <div className="p-2 text-sm text-gray-500">Loading…</div>}
                    {!loading && opts.length === 0 && (
                        <div className="p-2 text-sm text-gray-500">{q ? "No results found" : "Type to search"}</div>
                    )}
                    {!loading &&
                        opts.map((o, idx) => (
                            <button
                                key={o.id !== undefined && o.id !== null ? `${o.id}` : `option-${idx}`}
                                type="button"
                                className="block w-full text-left px-3 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                onClick={() => {
                                    setSel(o);
                                    onChange(o);
                                    setOpen(false);
                                }}
                            >
                                {o.name}
                                {o.meta?.subtitle && (
                                    <div className="text-xs text-gray-500">{o.meta.subtitle}</div>
                                )}
                            </button>
                        ))}
                </div>
            )}
        </div>
    );
}