// src/components/ui/Modal.tsx
"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";

export function Modal({
                          open,
                          onClose = () => console.warn("onClose is not provided or is not a function"),
                          title,
                          children,
                          width = "max-w-xl",
                          hideCloseButton = false,
                      }: {
    open: boolean;
    onClose?: () => void;
    title?: string;
    children: React.ReactNode;
    width?: string; // Tailwind width class (e.g. max-w-xl)
    hideCloseButton?: boolean;
}) {
    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if (e.key === "Escape") onClose();
        }
        if (open) document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    if (typeof document === "undefined") return null;
    if (!open) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center"
            aria-modal="true"
            role="dialog"
        >
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />
            <div
                className={`relative w-full ${width} mx-4 rounded-2xl border bg-white dark:bg-zinc-950 dark:border-zinc-800 shadow-xl`}
            >
                <div className="flex items-center justify-between px-4 py-3 border-b dark:border-zinc-800">
                    <h3 className="font-semibold">{title}</h3>
                    {!hideCloseButton && (
                        <button
                            className="rounded-md px-2 py-1 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-900"
                            onClick={onClose}
                            aria-label="Close"
                        >
                            ✕
                        </button>
                    )}
                </div>
                <div className="p-4">{children}</div>
            </div>
        </div>,
        document.body
    );
}
