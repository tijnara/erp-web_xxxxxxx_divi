export type { UpsertSupplierDTO, Supplier } from "../types";

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
}

