"use client";

import { useEffect, useState } from "react";

export function SectionDropdown({
  value,
  onChange,
}: {
  value: { id: string | number; name: string } | null;
  onChange: (value: { id: string | number; name: string } | null) => void;
}) {
  const [sections, setSections] = useState<{ id: string | number; name: string }[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSections() {
      try {
        const response = await fetch("http://100.119.3.44:8090/items/sections");
        if (!response.ok) {
          throw new Error("Failed to fetch sections");
        }
        const result = await response.json();
        const formattedSections = result.data.map((section: any) => ({
          id: section.section_id,
          name: section.section_name,
        }));
        setSections(formattedSections);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchSections();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    const selectedSection = sections.find(
      (section) => section.id.toString() === selectedId
    );
    onChange(selectedSection || null);
  };

  return (
    <div>
      <label className="text-sm">Section</label>
      {loading ? (
        <p>Loading sections...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <select
          className="mt-1 w-full rounded-md border px-3 py-2 bg-white dark:bg-zinc-900"
          value={value?.id || ""}
          onChange={handleChange}
        >
          <option value="">Select a section</option>
          {sections.map((section) => (
            <option key={section.id} value={section.id}>
              {section.name}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

