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

/**
 * Shared logout logic with automatic clock-out if an attendance session is open.
 */
export async function performLogout() {
	const userId = pb.authStore.record?.id;
	if (userId) {
		try {
			const today = new Date();
			today.setHours(0, 0, 0, 0);
			const todayStr = today.toISOString().replace('T', ' ').split('.')[0];
			const open = await pb.collection('attendance').getFirstListItem(
				`user = '${userId}' && clock_in >= '${todayStr}' && clock_out = ''`,
                { requestKey: 'logout-attendance-check' }
			).catch(() => null);
			
			if (open) {
				const now = new Date().toISOString().replace('T', ' ').split('.')[0];
				await pb.collection('attendance').update(open.id, { clock_out: now });
			}
		} catch (e) {
			console.error('Clock-out during logout failed:', e);
		}
	}
	
	pb.authStore.clear();
	if (typeof document !== 'undefined') {
		document.cookie = 'pb_auth=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
	}
}
