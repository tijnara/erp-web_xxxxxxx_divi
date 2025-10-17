export interface JobOrder {
  id: number;
  jo_no: string;
  customer_id: number;
  status: 'Pending' | 'Dispatched' | 'Completed' | 'Cancelled';
  service_type: 'Installation' | 'Repair' | 'Maintenance' | 'DeliveryOnly';
  order_date: string;
  due_date: string | null;
  scheduled_start: string | null;
  assigned_user_id: number | null;
  remarks: string | null;
  site_address: string | null;
  site_contact_name?: string | null;
  site_contact_phone?: string | null;
  sales_order_id?: number; // Added for linking to sales order
  purchase_order_id?: number; // Optionally add for future-proofing
}

// --- Added for Create Job Order form ---
export interface JobOrderDetail {
  id?: number;
  line_type: 'Part' | 'Labor' | 'Other' | 'Product' | 'Fee' | 'Discount';
  product_id?: number;
  part_name: string;
  quantity: number;
  unit_price: number;
  remarks?: string | null;
}

export interface JobOrderAssignment {
  id?: number;
  user_id: number | string; // string allowed for temporary empty input
  role: string;
}

export type PartialJobOrder = Partial<JobOrder>;

export type SalesOrder = {
  order_id: number;
  order_no: string;
  // Add more fields as needed from the sample data if required
};
