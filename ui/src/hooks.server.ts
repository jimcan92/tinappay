import { createPocketBase } from '$lib/pocketbase';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	const pb = createPocketBase();

	// Load the store from the request cookie
	pb.authStore.loadFromCookie(event.request.headers.get('cookie') || '');

	try {
		if (pb.authStore.isValid) {
			await pb.collection('users').authRefresh();
		}
	} catch (_) {
		pb.authStore.clear();
	}

	event.locals.pb = pb;
	event.locals.user = pb.authStore.record;

	const response = await resolve(event);

	// Send the store back to the client via cookie
	// I-set ang Secure: true kung production para sa mas lig-on nga session
	const isProd = event.url.hostname === 'tinappay.store';
	response.headers.append('set-cookie', pb.authStore.exportToCookie({
		httpOnly: false,
		secure: isProd,
		sameSite: 'Lax',
		path: '/'
	}));

	return response;
};
