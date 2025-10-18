// src/modules/customer-management/types.ts
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
    // ✅ MODIFIED: This ID points to the installation_requests table
    sales_order_id?: number; // This is semantically `installation_request_id`
    purchase_order_id?: number;
}

export interface JobOrderDetail {
    id?: number;
    line_type: 'Part' | 'Labor' | 'Other' | 'Product' | 'Fee' | 'Discount';
    product_id?: number | null; // For Products
    consumable_item_id?: number | null; // <-- ADD THIS LINE (For Parts)
    part_name: string; // Still useful for display and non-product/part types
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

// ✅ MODIFIED: Renamed to reflect what it actually is
export interface InstallationRequest {
    id: number;
    ir_code: string | null;
    client_id: number;
    created_at: string;
    preferred_date: string | null;
    preferred_time: string | null;
    budget_php: string | number;
    notes: string | null;
    // ... add any other fields you need from installation_requests
}

// ❌ DEPRECATED: This type was incorrect for your form
// export type SalesOrder = {
//   order_id: number;
//   order_no: string;
// };