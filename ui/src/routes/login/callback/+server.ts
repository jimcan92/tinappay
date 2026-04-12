import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals, cookies }) => {
	const authDataCookie = cookies.get('google_auth_data');
	if (!authDataCookie) {
		console.error('No auth data cookie found');
		throw redirect(303, '/login?error=auth_data_missing');
	}

	let authData;
	try {
		authData = JSON.parse(atob(authDataCookie));
	} catch (e) {
		console.error('Failed to parse auth data', e);
		throw redirect(303, '/login?error=invalid_auth_data');
	}

	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');

	if (state !== authData.state) {
		console.error('State mismatch', state, authData.state);
		throw redirect(303, '/login?error=state_mismatch');
	}

	try {
		await locals.pb.collection('users').authWithOAuth2Code(
			'google',
			code || '',
			authData.codeVerifier,
			authData.redirectUrl
		);
	} catch (err) {
		console.error('OAuth2 authentication failed', err);
		throw redirect(303, '/login?error=auth_failed');
	}

	// Clean up cookie
	cookies.delete('google_auth_data', { path: '/' });

	throw redirect(303, '/');
};
