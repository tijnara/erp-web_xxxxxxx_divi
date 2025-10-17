"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

interface AsyncSelectProps<T> {
  label?: string;
  placeholder?: string;
  fetchUrl: string;
  initial?: T | null;
  // mapOption is optional. If not provided, a default mapper will try to
  // read common shapes (id/name, value/label) or treat the item as already-mapped.
  mapOption?: (item: T) => { id: string | number; name: string; meta?: any };
  onChange: (option: T | null) => void;
  disabled?: boolean;
}

export function AsyncSelect<T>({
  label,
  placeholder,
  fetchUrl,
  initial,
  mapOption,
  onChange,
  disabled,
}: AsyncSelectProps<T>) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [opts, setOpts] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [sel, setSel] = useState<T | null>(initial ?? null);
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
          // use 'q' param to match the server-side lookup API
          url.searchParams.set("q", q.trim());
        }

        // Removed "credentials: 'include'" unless you specifically need it for cookies
        const res = await fetch(url.toString());
        const json = await res.json();

        const data = json.data || json;
        // Keep fetched options as the original items. We'll map them only when
        // rendering/filtering so callers who pass `initial` already-mapped objects
        // continue to work.
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

  // Create a safe mapper that will be used everywhere in this component. It
  // accepts both raw fetched items and already-mapped items (with id/name).
  const mapOpt = React.useMemo(() => {
     return (
      (item: unknown) => {
        // If the item already has an {id, name} shape, return that first. This
        // is important when callers pass an already-mapped `initial` value but
        // also provide a `mapOption` function for raw server items.
        if (item !== null && typeof item === "object") {
          const it = item as Record<string, unknown>;
          if (it.id !== undefined && it.name !== undefined) {
            return { id: it.id as string | number, name: String(it.name), meta: it.meta };
          }
        }

        // If a custom mapper is provided, use it for raw items.
        if (typeof mapOption === "function") return (mapOption as (it: T) => { id: string | number; name: string; meta?: any })(item as T);

        // For other shapes, try to normalize common alternatives.
        if (item !== null && typeof item === "object") {
          const it = item as Record<string, unknown>;
          // common alternative shapes
          if (it.value !== undefined && it.label !== undefined) {
            return { id: it.value as string | number, name: String(it.label), meta: it.meta };
          }
          // fallback: try to derive a name and id
          return {
            id: (it.id ?? it.value ?? it.key ?? JSON.stringify(it)) as string | number,
            name: String(it.name ?? it.label ?? it.id ?? it.value ?? ""),
            meta: it.meta,
          };
        }

        // primitive
        return { id: item as string | number, name: String(item) };
       }
     );
   }, [mapOption]);

  const display = useMemo(() => (sel ? mapOpt(sel).name : ""), [sel, mapOpt]);

  const filteredOptions = opts.filter((item) => {
    const { name } = mapOpt(item as unknown);
    return name && q ? name.toLowerCase().includes(q.toLowerCase()) : false;
  });

  return (
    <div className="relative" ref={boxRef}>
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <div className="mt-1 flex items-center gap-2">
        <input
          type="text"
          aria-label={label || placeholder || "Search"}
          className="w-full rounded-md border px-3 py-2 bg-white dark:bg-zinc-900"
          value={open ? q : display || ""} // Ensure value is always a string
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => {
            setOpen(true);
            if (sel) setQ(mapOpt(sel).name);
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
            filteredOptions.map((item) => {
              const { id, name, meta } = mapOpt(item);
               return (
                 <button
                   key={id !== undefined && id !== null ? `${id}` : `option-${id}`}
                   type="button"
                   className="block w-full text-left px-3 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                   onClick={() => {
                    // store the original item so callers receive the raw object
                    // they expect. If consumers passed in an already-mapped value
                    // as `initial`, it will still work because mapOpt handles it.
                    setSel(item);
                    onChange(item);
                     setOpen(false);
                   }}
                   aria-label={`Select ${name}`}
                 >
                   {name}
                   {meta?.subtitle && (
                     <div className="text-xs text-gray-500">{meta.subtitle}</div>
                   )}
                 </button>
               );
             })}
        </div>
      )}
    </div>
  );
}