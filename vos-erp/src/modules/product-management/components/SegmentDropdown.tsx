"use client";

import { useEffect, useState } from "react";

export function SegmentDropdown({
  value,
  onChange,
}: {
  value: { id: string | number; name: string } | null;
  onChange: (value: { id: string | number; name: string } | null) => void;
}) {
  const [segments, setSegments] = useState<{ id: string | number; name: string }[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSegments() {
      try {
        const response = await fetch("http://100.119.3.44:8090/items/segment");
        if (!response.ok) {
          throw new Error("Failed to fetch segments");
        }
        const result = await response.json();
        const formattedSegments = result.data.map((segment: any) => ({
          id: segment.segment_id,
          name: segment.segment_name,
        }));
        setSegments(formattedSegments);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchSegments();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    const selectedSegment = segments.find(
      (segment) => segment.id.toString() === selectedId
    );
    onChange(selectedSegment || null);
  };

  return (
    <div>
      <label className="text-sm">Segment</label>
      {loading ? (
        <p>Loading segments...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <select
          className="mt-1 w-full rounded-md border px-3 py-2 bg-white dark:bg-zinc-900"
          value={value?.id || ""}
          onChange={handleChange}
        >
          <option value="">Select a segment</option>
          {segments.map((segment) => (
            <option key={segment.id} value={segment.id}>
              {segment.name}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

