import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

// Strict server-side route guards based on ACTUAL user role
const roleAccess: Record<string, string[]> = {
	admin: ['/', '/pos', '/inventory', '/restock', '/finance', '/reports', '/management', '/baker', '/profile', '/settings'],
	staff: ['/', '/pos', '/inventory', '/restock', '/profile', '/settings'],
	cashier: ['/', '/pos', '/profile', '/settings'],
	baker: ['/', '/baker', '/profile', '/settings']
};

export const load: LayoutServerLoad = async ({ locals, url }) => {
	if (!locals.user) throw redirect(302, '/login');
	if (!locals.user.role) throw redirect(302, '/pending');

	const role = locals.user.role as string;
	const path = url.pathname;

	// Simple check: does the current path start with any of the allowed base paths?
	// Special case for dashboard ('/') which is a substring of everything
	const allowedPaths = roleAccess[role] || ['/'];
	const isAllowed = path === '/' || allowedPaths.some(p => p !== '/' && path.startsWith(p));

	if (!isAllowed) {
		throw redirect(302, '/');
	}

	return { user: locals.user };
};
