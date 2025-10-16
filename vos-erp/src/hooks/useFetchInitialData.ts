import { usePurchaseOrderStore } from "@/store/usePurchaseOrderStore";
import { API_BASE } from "@/constants";

export const useFetchInitialData = () => {
  const {
    setPurchaseOrders,
    setProducts,
    setReceiving,
    setSuppliers,
    setBranches,
    setLineDiscounts,
    setTaxRates,
  } = usePurchaseOrderStore();

  const fetchInitialData = async () => {
    try {
      const [poData, productData, receivingData, suppliersData, branchesData, lineDiscountsData, taxRatesData] = await Promise.all([
        fetch(`${API_BASE}/purchase_order`).then(res => res.json()),
        fetch(`${API_BASE}/purchase_order_products`).then(res => res.json()),
        fetch(`${API_BASE}/purchase_order_receiving`).then(res => res.json()),
        fetch(`${API_BASE}/suppliers`).then(res => res.json()),
        fetch(`${API_BASE}/branches`).then(res => res.json()),
        fetch(`${API_BASE}/line_discount?limit=-1`).then(res => res.json()),
        fetch(`${API_BASE}/tax_rates`).then(res => res.json()),
      ]);
      setPurchaseOrders(poData.data || []);
      setProducts(productData.data || []);
      setReceiving(receivingData.data || []);
      setSuppliers(suppliersData.data || []);
      setBranches(branchesData.data || []);
      setLineDiscounts(lineDiscountsData.data || []);
      if (taxRatesData.data && taxRatesData.data.length > 0) {
        setTaxRates({
          VATRate: parseFloat(taxRatesData.data[0].VATRate) || 0,
          WithholdingRate: parseFloat(taxRatesData.data[0].WithholdingRate) || 0,
        });
      }
    } catch (error) {
      // You can add error handling here
      console.error("Error fetching initial data:", error);
    }
  };

  return { fetchInitialData };
};
