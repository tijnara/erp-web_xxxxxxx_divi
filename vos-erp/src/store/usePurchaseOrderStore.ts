import { create } from "zustand";

interface PurchaseOrderState {
  purchaseOrders: any[];
  products: any[];
  receiving: any[];
  suppliers: any[];
  branches: any[];
  lineDiscounts: any[];
  taxRates: { VATRate: number; WithholdingRate: number };
  setPurchaseOrders: (data: any[]) => void;
  setProducts: (data: any[]) => void;
  setReceiving: (data: any[]) => void;
  setSuppliers: (data: any[]) => void;
  setBranches: (data: any[]) => void;
  setLineDiscounts: (data: any[]) => void;
  setTaxRates: (data: { VATRate: number; WithholdingRate: number }) => void;
}

export const usePurchaseOrderStore = create<PurchaseOrderState>((set: (state: Partial<PurchaseOrderState>) => void, get) => ({
  purchaseOrders: [],
  products: [],
  receiving: [],
  suppliers: [],
  branches: [],
  lineDiscounts: [],
  taxRates: { VATRate: 0, WithholdingRate: 0 },
  setPurchaseOrders: (data: any[]) => {
    const { WithholdingRate } = get().taxRates;
    const updatedData = data.map(order => ({
      ...order,
      withholding_amount: (order.unit_price * WithholdingRate).toFixed(2),
    }));
    set({ purchaseOrders: updatedData });
  },
  setProducts: (data: any[]) => set({ products: data }),
  setReceiving: (data: any[]) => set({ receiving: data }),
  setSuppliers: (data: any[]) => set({ suppliers: data }),
  setBranches: (data: any[]) => set({ branches: data }),
  setLineDiscounts: (data: any[]) => set({ lineDiscounts: data }),
  setTaxRates: (data: { VATRate: number; WithholdingRate: number }) => set({ taxRates: data }),
}));
