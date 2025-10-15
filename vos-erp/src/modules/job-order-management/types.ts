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
}

