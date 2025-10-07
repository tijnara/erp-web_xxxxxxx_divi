"use client";

import { useEffect, useState } from "react";
import type { DiscountType } from "../types";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function DiscountTypeFormDialog({
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
  current: DiscountType | null;
  provider: ReturnType<typeof import("../providers/fetchProvider").fetchProvider>;
  onSuccess: () => void;
}) {
  const [discount_type, setDiscountType] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (current) {
      setDiscountType(current.discount_type);
    } else {
      setDiscountType("");
    }
  }, [current]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const data = { discount_type };
      if (mode === "create") {
        await provider.createDiscountType(data);
      } else if (current) {
        await provider.updateDiscountType(current.id, data);
      }
      onSuccess();
      setOpen(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => setOpen(false)}
      title={`${mode === "create" ? "Add" : "Edit"} Discount Type`}
    >
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Discount Type
            </label>
            <Input
              type="text"
              value={discount_type}
              onChange={(e) => setDiscountType(e.target.value)}
              required
              placeholder="Discount Type"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Submit"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
