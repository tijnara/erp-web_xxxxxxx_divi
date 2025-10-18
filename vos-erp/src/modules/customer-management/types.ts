// src/modules/customer-management/types.ts
// Customer schema aligned with items/customer
export type Customer = {
  id: number | string;
  customer_code: string;
  customer_name: string;
  customer_image?: string | null;
  store_name: string;
  store_signage: string;
  brgy?: string | null;
  city?: string | null;
  province?: string | null;
  contact_number: string;
  customer_email?: string | null;
  tel_number?: string | null;
  bank_details?: string | null;
  customer_tin?: string | null;
  payment_term?: number | null; // tinyint
  store_type: number; // FK -> store_type.id
  price_type?: string | null;
  encoder_id: number;
  credit_type?: number | null;
  company_code?: number | null;
  date_entered?: string | null; // datetime
  isActive: number; // 0/1
  isVAT: number; // 0/1
  isEWT: number; // 0/1
  discount_type?: number | null; // FK -> discount_type.id
  customer_classification?: number | null;
  otherDetails?: string | null;
  classification?: number | null;
  location: string | null;
  street_address?: string | null;
};

export type CustomerDiscountProduct = {
  id: number;
  customer_id: number;
  product_id: number;
  line_discount_id: number;
  created_at: string;
  updated_at: string;
  created_by: number;
};

export type CustomerDiscountBrand = {
  id: number;
  customer_id: number;
  brand_id: number;
  line_discount_id: number;
  created_at: string;
  updated_at: string;
  created_by: number | null;
};

export type CustomerDiscountCategory = {
  id: number;
  customer_id: number;
  category_id: number;
  line_discount_id: number;
  created_at: string;
  updated_at: string;
  created_by: number | null;
};

export type UpsertCustomerDTO = Partial<Omit<Customer, "id">>;
