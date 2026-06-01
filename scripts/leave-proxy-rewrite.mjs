/**
 * Vite dev proxy: map browser URL under /leave → one-leave pathname.
 * Gateway uses one /leave prefix; app routes may be /leave/new, /org, …
 */
export function rewriteLeaveProxyPath(path) {
	if (path === '/leave' || path === '/leave/') return '/';
	if (!path.startsWith('/leave/')) return path;

	const inner = path.slice('/leave'.length);
	const trimmed = inner.replace(/^\//, '');

	const appRoots = [
		'leave/',
		'leave',
		'login',
		'logout',
		'org',
		'change-requests',
		'work-activity',
		'approvals',
		'admin',
		'reports',
		'account',
		'forgot-password',
		'reset-password',
		'update-logs',
		'api/'
	];

	for (const root of appRoots) {
		const bare = root.replace(/\/$/, '');
		if (trimmed === bare || trimmed.startsWith(root)) {
			return inner.startsWith('/') ? inner : `/${trimmed}`;
		}
	}

	const first = trimmed.split('/')[0] ?? '';
	const leaveShortcuts = ['new', 'quota', 'revoke', 'attachments'];
	if (leaveShortcuts.includes(first) || /^\d+$/.test(first)) {
		return `/leave/${trimmed}`;
	}

	return path.replace(/^\/leave/, '') || '/';
}
