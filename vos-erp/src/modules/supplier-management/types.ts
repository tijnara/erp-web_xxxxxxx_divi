export type Supplier = {
  id: number;
  supplier_name: string;
  supplier_shortcut: string;
  contact_person: string;
  email_address: string;
  phone_number: string;
  address: string;
  city: string;
  brgy: string;
  state_province: string;
  postal_code: string;
  country: string;
  supplier_type: string;
  tin_number: string;
  bank_details: string;
  payment_terms: string;
  delivery_terms: string | null;
  agreement_or_contract: string;
  preferred_communication_method: string;
  notes_or_comments: string;
  date_added: string;
  supplier_image: string;
  isActive: number;
  nonBuy: {
    type: "Buffer";
    data: number[];
  };
};

export type UpsertSupplierDTO = Partial<Omit<Supplier, "id">>;

