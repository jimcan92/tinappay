import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
	login: async ({ locals, request }) => {
		const formData = await request.formData();
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;

		if (!email || !password) {
			return fail(400, { message: 'Email and password are required' });
		}

		try {
			await locals.pb.collection('users').authWithPassword(email, password);
		} catch (err: any) {
			console.error('Login error:', err);
			return fail(400, { message: err.message });
		}

		throw redirect(303, '/');
	},
	google: async ({ locals, url, cookies }) => {
		try {
			const authMethods = await locals.pb.collection('users').listAuthMethods();
			console.log('Auth Methods response:', JSON.stringify(authMethods));

			if (!authMethods || !authMethods.oauth2.providers) {
				return fail(400, { message: 'Google Init Error: No auth providers found in PocketBase response.' });
			}

			const googleProvider = authMethods.oauth2.providers.find((p) => p.name === 'google');

			if (!googleProvider) {
				return fail(400, { message: 'Google login is not enabled in PocketBase settings.' });
			}

			const redirectUrl = `${url.origin}/login/callback`;

			const authData = JSON.stringify({
				state: googleProvider.state,
				codeVerifier: googleProvider.codeVerifier,
				redirectUrl
			});

			// Use SvelteKit cookies API
			cookies.set('google_auth_data', btoa(authData), {
				path: '/',
				httpOnly: true,
				maxAge: 300,
				secure: url.protocol === 'https:'
			});

			throw redirect(302, googleProvider.authURL + redirectUrl);
		} catch (err: any) {
			if (err.status === 302) throw err; // Allow the redirect to happen
			console.error('Google OAuth initialization failed:', err);
			return fail(500, { message: `Google Init Error: ${err.message || 'Unknown error'}` });
		}
	}
};
