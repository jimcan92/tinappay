import PocketBase from 'pocketbase';

// Server-side: direct loopback for reliable API calls
// Client-side: public URL
const PB_URL = typeof window === 'undefined'
    ? (process.env.POCKETBASE_URL ?? 'http://127.0.0.1:8091')
    : (import.meta.env.VITE_POCKETBASE_URL ?? 'http://127.0.0.1:8091');

export function createPocketBase() {
    return new PocketBase(PB_URL);
}

export const pb = createPocketBase();

// Always resolves to the public URL so file URLs work in the browser,
// even when called during SSR.
const PUBLIC_URL = (import.meta.env.VITE_POCKETBASE_URL ?? 'http://127.0.0.1:8091').replace(/\/$/, '');

export function fileUrl(
    record: { collectionId?: string; collectionName?: string; id: string },
    filename: string
): string {
    const collection = record.collectionId ?? record.collectionName ?? '';
    return `${PUBLIC_URL}/api/files/${collection}/${record.id}/${encodeURIComponent(filename)}`;
}
