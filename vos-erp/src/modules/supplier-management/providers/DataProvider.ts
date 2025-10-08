import type { UpsertSupplierDTO, Supplier } from "../types";

export interface ListParams {
  q?: string;
  limit?: number;
  offset?: number;
}

export interface DataProvider {
  listSuppliers(params: ListParams): Promise<{ items: Supplier[]; total: number }>;
  getSupplier(id: number): Promise<Supplier>;
  createSupplier(data: UpsertSupplierDTO): Promise<Supplier>;
  updateSupplier(id: number, data: UpsertSupplierDTO): Promise<Supplier>;
  deleteSupplier(id: number): Promise<void>;
  listProducts(productIds: number[]): Promise<{ product_id: number; product_name: string }[]>;
  listLineDiscounts(lineDiscountIds: number[]): Promise<{ id: number; line_discount: string }[]>;
  createSupplierDiscountProduct(data: { supplier_id: number; product_id: number; line_discount_id: number; }): Promise<void>;
  listSupplierDiscountProducts(supplierId: number): Promise<any[]>;
  listBrands(brandIds: number[]): Promise<{ brand_id: number; brand_name: string }[]>;
  createSupplierDiscountBrand(data: { supplier_id: number; brand_id: number; line_discount_id: number; }): Promise<void>;
  listSupplierDiscountBrands(supplierId: number): Promise<any[]>;
  listCategories(categoryIds: number[]): Promise<{ category_id: number; category_name: string }[]>;
  createSupplierDiscountCategory(data: { supplier_id: number; category_id: number; line_discount_id: number; }): Promise<void>;
  listSupplierDiscountCategories(supplierId: number): Promise<any[]>;
}
