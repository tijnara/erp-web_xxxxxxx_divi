/**
 * Standardizes asset URLs.
 * If the URL is already a full http link (from Supabase), return it.
 * If it's a legacy Directus ID (UUID), construct the Directus URL (optional fallback).
 * If it's a local path, ensure it starts with /.
 */
export function assetUrl(fileIdOrUrl?: string | null, params?: Record<string, string>) {
    if (!fileIdOrUrl) return '';

    // 1. If it's already a full URL (e.g. from Supabase Storage), return it directly
    if (fileIdOrUrl.startsWith('http') || fileIdOrUrl.startsWith('/uploads/')) {
        return fileIdOrUrl;
    }

    // 2. Legacy Directus Support: If it looks like a UUID, assume it's an old Directus ID
    // (Matches standard UUID format: 8-4-4-4-12 hex digits)
    if (fileIdOrUrl.match(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/)) {
        const base = `${process.env.NEXT_PUBLIC_DIRECTUS_URL}/assets/${fileIdOrUrl}`;
        if (!params) return base;
        const q = new URLSearchParams(params);
        return `${base}?${q.toString()}`;
    }

    // 3. Fallback
    return fileIdOrUrl;
}
