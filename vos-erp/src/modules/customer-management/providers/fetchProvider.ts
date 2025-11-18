// src/modules/customer-management/providers/fetchProvider.ts
import { supabase } from "../../../lib/supabase";
import type { Customer, UpsertCustomerDTO } from "../types";

function toUI(row: any): Customer {
  return {
    id: row.id,
    customer_code: row.customer_code ?? "",
    customer_name: row.customer_name ?? "",
    customer_image: row.customer_image ?? null,
    store_name: row.store_name ?? "",
    store_signage: row.store_signage ?? "",
    brgy: row.brgy ?? null,
    city: row.city ?? null,
    province: row.province ?? null,
    contact_number: row.contact_number ?? "",
    customer_email: row.customer_email ?? null,
    tel_number: row.tel_number ?? null,
    bank_details: row.bank_details ?? null,
    customer_tin: row.customer_tin ?? null,
    payment_term: row.payment_term ?? null,
    store_type: row.store_type ?? 0,
    price_type: row.price_type ?? null,
    encoder_id: row.encoder_id ?? 0,
    credit_type: row.credit_type ?? 0,
    company_code: row.company_code ?? -1,
    date_entered: row.date_entered ?? row.dateEntered ?? null,
    isActive: row.isActive ?? 0,
    isVAT: row.isVAT ?? 0,
    isEWT: row.isEWT ?? 0,
    discount_type: row.discount_type ?? null,
    otherDetails: row.otherDetails ?? null,
    classification: row.classification ?? null,
    location: row.location ?? null,
    street_address: row.street_address ?? null,
  } as Customer;
}

function toAPI(dto: UpsertCustomerDTO): any {
  return {
    customer_code: dto.customer_code,
    customer_name: dto.customer_name,
    customer_image: dto.customer_image,
    store_name: dto.store_name,
    store_signage: dto.store_signage,
    brgy: dto.brgy,
    city: dto.city,
    province: dto.province,
    contact_number: dto.contact_number,
    customer_email: dto.customer_email,
    tel_number: dto.tel_number,
    bank_details: dto.bank_details,
    customer_tin: dto.customer_tin,
    payment_term: dto.payment_term,
    store_type: dto.store_type,
    price_type: dto.price_type,
    encoder_id: dto.encoder_id,
    credit_type: dto.credit_type,
    company_code: dto.company_code,
    date_entered: dto.date_entered,
    isActive: dto.isActive,
    isVAT: dto.isVAT,
    isEWT: dto.isEWT,
    discount_type: dto.discount_type,
    otherDetails: dto.otherDetails,
    classification: dto.classification,
    location: dto.location,
    street_address: dto.street_address,
  };
}

export const fetchProvider = () => ({
  async listCustomers({ q, limit = 20, offset = 0 }: { q?: string; limit?: number; offset?: number }) {
    let query = supabase
      .from("customer")
      .select("*", { count: "exact" })
      .range(offset, offset + limit - 1);

    if (q && q.trim().length > 0) {
      query = query.or(`customer_name.ilike.%${q}%,customer_code.ilike.%${q}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("Failed to list customers:", error);
      return { items: [], total: 0 };
    }

    return {
      items: (data ?? []).map(toUI),
      total: count ?? 0,
    };
  },

  async getCustomer(id: string | number) {
    const { data, error } = await supabase
      .from("customer")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return toUI(data);
  },

  async createCustomer(dto: UpsertCustomerDTO) {
    const payload = toAPI(dto);
    const { data, error } = await supabase
      .from("customer")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return toUI(data);
  },

  async updateCustomer(id: string | number, dto: UpsertCustomerDTO) {
    const payload = toAPI(dto);
    const { data, error } = await supabase
      .from("customer")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return toUI(data);
  },

  async deleteCustomer(id: string | number) {
    const { error } = await supabase
      .from("customer")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },

  async listStoreTypes() {
    const { data } = await supabase.from("store_type").select("*");
    return data || [];
  },

  async listDiscountTypes() {
    const { data, error } = await supabase.from("discount_type").select("id,discount_type");
    if (error) throw error;
    return data || [];
  },

  async listUsers() {
    const { data, error } = await supabase.from("user").select("user_id,user_fname,user_lname");
    if (error) throw error;
    return data || [];
  },

  async listProducts(productIds: number[]) {
    let query = supabase.from("products").select("product_id,product_name");
    if (productIds.length > 0) {
      query = query.in("product_id", productIds);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async listLineDiscounts(lineDiscountIds: number[]) {
    let query = supabase.from("line_discount").select("id,line_discount");
    if (lineDiscountIds.length > 0) {
      query = query.in("id", lineDiscountIds);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async listBrands(brandIds: number[]) {
    let query = supabase.from("brand").select("brand_id,brand_name");
    if (brandIds.length > 0) {
      query = query.in("brand_id", brandIds);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async listCategories(categoryIds: number[]) {
    let query = supabase.from("categories").select("category_id,category_name");
    if (categoryIds.length > 0) {
      query = query.in("category_id", categoryIds);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async createCustomerDiscountProduct(data: { customer_id: number; product_id: number; line_discount_id: number; }) {
    const { error } = await supabase.from("customer_discount_product").insert(data);
    if (error) throw error;
  },

  async createCustomerDiscountBrand(data: { customer_id: number; brand_id: number; line_discount_id: number; }) {
    const { error } = await supabase.from("customer_discount_brand").insert(data);
    if (error) throw error;
  },

  async createCustomerDiscountCategory(data: { customer_id: number; category_id: number; line_discount_id: number; }) {
    const { error } = await supabase.from("customer_discount_category").insert(data);
    if (error) throw error;
  },

  async listCustomerDiscountCategories(customerId: number) {
    const { data, error } = await supabase.from("customer_discount_category").select("*").eq("customer_id", customerId);
    if (error) throw error;
    return (data || []).map((row: any) => ({
      id: row.id,
      customer_id: row.customer_id,
      category_id: row.category_id,
      line_discount_id: row.line_discount_id,
      created_at: row.created_at,
      updated_at: row.updated_at,
      created_by: row.created_by,
    }));
  },

  async listCustomerDiscountBrands(customerId: number) {
    const { data, error } = await supabase.from("customer_discount_brand").select("*").eq("customer_id", customerId);
    if (error) throw error;
    return (data || []).map((row: any) => ({
      id: row.id,
      customer_id: row.customer_id,
      brand_id: row.brand_id,
      line_discount_id: row.line_discount_id,
      created_at: row.created_at,
      updated_at: row.updated_at,
      created_by: row.created_by,
    }));
  },

  async listCustomerDiscountProducts(customerId: number) {
    const { data, error } = await supabase.from("customer_discount_product").select("*").eq("customer_id", customerId);
    if (error) throw error;
    return (data || []).map((row: any) => ({
      id: row.id,
      customer_id: row.customer_id,
      product_id: row.product_id,
      line_discount_id: row.line_discount_id,
      created_at: row.created_at,
      updated_at: row.updated_at,
      created_by: row.created_by,
    }));
  },
});
