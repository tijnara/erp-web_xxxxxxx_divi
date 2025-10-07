"use client";
import { useEffect, useState } from "react";
import { Product } from "../types";
import { DataProvider } from "../providers/DataProvider";
import { Modal } from "@/components/ui/Modal";

export function ProductView({
  provider,
  productId,
  open,
  onClose,
}: {
  provider: DataProvider;
  productId: number | null;
  open: boolean;
  onClose: () => void;
}) {
  const [product, setProduct] = useState<Product | null>(null);
  const [createdByUser, setCreatedByUser] = useState<string | null>(null);

  useEffect(() => {
    if (open && productId) {
      let alive = true;
      setProduct(null);
      setCreatedByUser(null);
      provider.getProduct(productId).then((product) => {
        if (alive && product) {
          setProduct(product);
          if (product.created_by) {
            provider.getUser(product.created_by).then((user) => {
              if (alive && user) {
                setCreatedByUser(`${user.first_name} ${user.last_name}`);
              }
            });
          }
        }
      });
      return () => {
        alive = false;
      };
    }
  }, [open, productId, provider]);

  return (
    <Modal open={open} onClose={onClose} title="Product Details">
      {product ? (
        <div className="space-y-4">
          <p>
            <strong>Name:</strong> {product.name}
          </p>
          <p>
            <strong>Code:</strong> {product.code}
          </p>
          <p>
            <strong>Barcode:</strong> {product.barcode}
          </p>
          <p>
            <strong>Brand:</strong> {product.brand?.name}
          </p>
          <p>
            <strong>Unit:</strong> {product.unit?.name ?? "N/A"}
          </p>
          <p>
            <strong>Category:</strong> {product.category?.name}
          </p>
          <p>
            <strong>Price:</strong> {product.base_price ?? "N/A"}
          </p>
          <p>
            <strong>Maintaining Quantity:</strong>{" "}
            {product.maintaining_quantity ?? "N/A"}
          </p>
          <p>
            <strong>Status:</strong> {product.isActive ? "Active" : "Inactive"}
          </p>
          <p>
            <strong>Created At:</strong>{" "}
            {product.created_at
              ? new Date(product.created_at).toLocaleString()
              : "N/A"}
          </p>
          <p>
            <strong>Last Updated:</strong>{" "}
            {product.last_updated
              ? new Date(product.last_updated).toLocaleString()
              : "N/A"}
          </p>
          <p>
            <strong>Created By:</strong>{" "}
            {createdByUser ?? product.created_by ?? "N/A"}
          </p>
        </div>
      ) : (
        <p>Loading...</p>
      )}
    </Modal>
  );
}
