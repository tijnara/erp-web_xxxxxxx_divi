"use client";

import { useEffect, useState } from "react";

export function BrandDropdown({
  value,
  onChange,
}: {
  value: { id: string | number; name: string } | null;
  onChange: (value: { id: string | number; name: string } | null) => void;
}) {
  const [brands, setBrands] = useState<{ id: string | number; name: string }[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBrands() {
      try {
        const response = await fetch("http://100.119.3.44:8090/items/brand");
        if (!response.ok) {
          throw new Error("Failed to fetch brands");
        }
        const result = await response.json();
        const formattedBrands = result.data.map((brand: any) => ({
          id: brand.brand_id,
          name: brand.brand_name,
        }));
        setBrands(formattedBrands);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchBrands();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    const selectedBrand = brands.find(
      (brand) => brand.id.toString() === selectedId
    );
    onChange(selectedBrand || null);
  };

  return (
    <div>
      <label className="text-sm">Brand</label>
      {loading ? (
        <p>Loading brands...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <select
          className="mt-1 w-full rounded-md border px-3 py-2 bg-white dark:bg-zinc-900"
          value={value?.id || ""}
          onChange={handleChange}
        >
          <option value="">Select a brand</option>
          {brands.map((brand) => (
            <option key={brand.id} value={brand.id}>
              {brand.name}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

