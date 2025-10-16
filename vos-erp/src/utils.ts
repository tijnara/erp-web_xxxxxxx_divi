import { Supplier } from "@/types";

export function getSupplierName(id: number, suppliers: Supplier[]): string {
  const supplier = suppliers.find((s) => s.id === id);
  return supplier ? supplier.supplier_name : "Unknown Supplier";
}

export function getBranchName(id: number, branches: any[]): string {
  const branch = branches.find((b) => b.id === id);
  return branch ? branch.branch_name : "Unknown Branch";
}

export function calculateValues({
  unitPrice,
  selectedProduct,
  lineDiscounts,
  taxRates,
  setDiscountedPrice,
  setVatAmount,
  setWithholdingAmount,
}: {
  unitPrice: string;
  selectedProduct: any;
  lineDiscounts: any[];
  taxRates: { VATRate: number; WithholdingRate: number };
  setDiscountedPrice: (v: string) => void;
  setVatAmount: (v: string) => void;
  setWithholdingAmount: (v: string) => void;
}) {
  const price = parseFloat(unitPrice);
  if (isNaN(price)) {
    setDiscountedPrice("");
    setVatAmount("");
    setWithholdingAmount("");
    return;
  }
  const discount = lineDiscounts.find(ld => ld.id === selectedProduct?.meta?.line_discount_id);
  const discountPercentage = discount ? parseFloat(discount.percentage) / 100 : 0;
  const finalDiscountedPrice = price * (1 - discountPercentage);
  setDiscountedPrice(finalDiscountedPrice.toFixed(2));
  const calculatedVat = price * taxRates.VATRate;
  setVatAmount(calculatedVat.toFixed(2));
  const calculatedWithholding = price * taxRates.WithholdingRate;
  setWithholdingAmount(calculatedWithholding.toFixed(2));
}
export const API_BASE = "http://100.119.3.44:8090/items";

export const INVENTORY_STATUS: { [key: number]: string } = { 0: "Pending", 1: "Partial", 2: "Received" };
export const INVENTORY_STATUS_COLOR: { [key: number]: string } = { 0: "status-pending", 1: "status-partial", 2: "status-received" };
export const PAYMENT_STATUS: { [key: number]: string } = { 1: "Unpaid", 2: "Paid" };
export const PAYMENT_STATUS_COLOR: { [key: number]: string } = { 1: "status-unpaid", 2: "status-paid" };
