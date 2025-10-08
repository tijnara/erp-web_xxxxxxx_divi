export interface Asset {
  id: number;
  item_image: string;
  item_id: number;
  quantity: number;
  rfid_code: string | null;
  barcode: string | null;
  department: number;
  employee: number;
  cost_per_item: number;
  total: number;
  condition: string;
  life_span: number;
  encoder: number;
  date_acquired: string;
  date_created: string;
  itemName?: string;
  itemTypeName?: string;
  itemClassificationName?: string;
  departmentName?: string;
  employeeName?: string;
  encoderName?: string;
}

