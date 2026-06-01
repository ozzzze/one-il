/** one-leave อยู่หลัง prefix `/leave` (reverse proxy / vite dev proxy). */

/** Sub-paths ที่ส่งต่อให้ one-leave — ไม่ใช่หน้า gateway เอง */
export function isOneLeaveAppPath(pathname: string): boolean {
	return pathname.startsWith("/leave/");
}

const LOGIN_PATHS = new Set(["/leave/login", "/login", "/register"]);

/** กัน redirect loop เมื่อ redirectTo ซ้อน /leave/login */
export function sanitizePostLoginRedirect(target: string): string {
	if (!target || target === "/") return "/";

	let pathname: string;
	let search = "";
	try {
		const u = new URL(target, "http://local");
		pathname = u.pathname;
		search = u.search;
	} catch {
		return "/";
	}

	if (LOGIN_PATHS.has(pathname) || pathname.startsWith("/leave/login")) {
		return "/";
	}
	if (pathname.startsWith("/register") || pathname.startsWith("/forgot-password")) {
		return "/";
	}

	const full = `${pathname}${search}`;
	if (full.length > 512 || full.includes("/leave/login")) {
		return "/";
	}
	return full;
}
