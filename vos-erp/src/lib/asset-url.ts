export function assetUrl(fileId?: string | null, params?: Record<string,string>) {
    if (!fileId) return '';
    const base = `${process.env.NEXT_PUBLIC_DIRECTUS_URL}/assets/${fileId}`;
    if (!params) return base;
    const q = new URLSearchParams(params);
    return `${base}?${q.toString()}`;
}
