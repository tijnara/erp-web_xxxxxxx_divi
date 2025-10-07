"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { fetchProvider } from "./fetchProvider";
import type { DiscountType } from "../types";

type DiscountTypeManagementContext = {
  discountTypes: DiscountType[];
  total: number;
  loading: boolean;
  fetchDiscountTypes: (q?: string) => void;
  search: (q: string) => void;
  provider: ReturnType<typeof fetchProvider>;
};

const DiscountTypeManagementContext =
  createContext<DiscountTypeManagementContext | null>(null);

export const useDiscountTypeManagement = () => {
  const context = useContext(DiscountTypeManagementContext);
  if (!context) {
    throw new Error(
      "useDiscountTypeManagement must be used within a DiscountTypeManagementProvider"
    );
  }
  return context;
};

export function DiscountTypeManagementProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [discountTypes, setDiscountTypes] = useState<DiscountType[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");

  const provider = useMemo(() => fetchProvider(), []);

  const fetchDiscountTypes = useCallback(
    async (q?: string) => {
      setLoading(true);
      try {
        const { items, total } = await provider.listDiscountTypes({ q });
        setDiscountTypes(items);
        setTotal(total);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    },
    [provider]
  );

  useEffect(() => {
    fetchDiscountTypes(query);
  }, [fetchDiscountTypes, query]);

  const search = (q: string) => {
    setQuery(q);
  };

  return (
    <DiscountTypeManagementContext.Provider
      value={{
        discountTypes,
        total,
        loading,
        fetchDiscountTypes,
        search,
        provider,
      }}
    >
      {children}
    </DiscountTypeManagementContext.Provider>
  );
}

