// src/components/ui/AsyncSelect.tsx
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
                            }: {
    label: string;
    placeholder?: string;
    fetchUrl: string;                 // e.g. /api/lookup/brand
    initial?: Option | null;          // preselected (for edit)
    onChange: (opt: Option | null) => void;
    disabled?: boolean;
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
                const url = new URL(fetchUrl, window.location.origin);
                if (q.trim()) url.searchParams.set("q", q.trim());
                const res = await fetch(url.toString(), { credentials: "include" });
                const json = await res.json();
                const data = json.data || json;
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
    }, [q, open, fetchUrl]);

    const display = useMemo(() => sel?.name ?? "", [sel]);

    return (
        <div className="relative" ref={boxRef}>
            <label className="text-sm">{label}</label>
            <div className="mt-1 flex items-center gap-2">
                <input
                    className="w-full rounded-md border px-3 py-2 bg-white dark:bg-zinc-900"
                    value={open ? q : display}
                    onChange={(e) => setQ(e.target.value)}
                    onFocus={() => setOpen(true)}
                    placeholder={placeholder}
                    disabled={disabled}
                />
                {sel && (
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
                <div className="absolute z-50 mt-1 w-full rounded-md border bg-white dark:bg-zinc-900 shadow">
                    {loading && <div className="p-2 text-sm text-gray-500">Loading…</div>}
                    {!loading && opts.length === 0 && (
                        <div className="p-2 text-sm text-gray-500">No results</div>
                    )}
                    {!loading &&
                        opts.map((o) => (
                            <button
                                key={`${o.id}`}
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
