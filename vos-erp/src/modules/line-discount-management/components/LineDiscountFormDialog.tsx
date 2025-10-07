"use client";

import { useEffect, useState } from "react";
import type { LineDiscount } from "../types";

export function LineDiscountFormDialog({
  open,
  setOpen,
  mode,
  current,
  provider,
  onSuccess,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  mode: "create" | "edit";
  current: LineDiscount | null;
  provider: ReturnType<typeof import("../providers/fetchProvider.ts").fetchProvider>;
  onSuccess: () => void;
}) {
  const [line_discount, setLineDiscount] = useState("");
  const [percentage, setPercentage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (current) {
      setLineDiscount(current.line_discount);
      setPercentage(current.percentage);
    } else {
      setLineDiscount("");
      setPercentage("");
    }
  }, [current]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const data = { line_discount, percentage };
      if (mode === "create") {
        await provider.createLineDiscount(data);
      } else if (current) {
        await provider.updateLineDiscount(current.id, data);
      }
      onSuccess();
      setOpen(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">
          {mode === "create" ? "Add" : "Edit"} Line Discount
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Line Discount
              </label>
              <input
                type="text"
                value={line_discount}
                onChange={(e) => setLineDiscount(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Percentage
              </label>
              <input
                type="text"
                value={percentage}
                onChange={(e) => setPercentage(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-4 py-2 rounded-lg border"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
