import { useEffect, useState } from 'react';
import { API_BASE_URL } from '../../../config/api';
import type { JobOrder } from '../types';

export function useJobOrders(page = 1, limit = 50) {
    const [data, setData] = useState<JobOrder[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;
        const fetchList = async () => {
            setLoading(true);
            setError(null);
            try {
                const params = new URLSearchParams({
                    limit: String(limit),
                    page: String(page),
                    sort: '-order_date',
                    fields: 'id,jo_no,customer_id,status,order_date,scheduled_start,site_address,site_contact_name',
                });
                const res = await fetch(`${API_BASE_URL}/items/job_order?${params.toString()}`, {
                    headers: { 'Content-Type': 'application/json' },
                });
                if (!res.ok) throw new Error(`API ${res.status}`);
                const json = await res.json();
                const items: JobOrder[] = json?.data ?? [];
                if (mounted) setData(items);
            } catch (err: any) {
                if (mounted) setError(err.message || 'Failed to load job orders');
            } finally {
                if (mounted) setLoading(false);
            }
        };

        fetchList();
        return () => {
            mounted = false;
        };
    }, [page, limit]);

    return { data, loading, error };
}
