import { createServerClient } from "@supabase/ssr";
import type { Database } from "$lib/database.types.js";
import { redirect, type Handle } from "@sveltejs/kit";
import { sequence } from "@sveltejs/kit/hooks";
import { env as publicEnv } from "$env/dynamic/public";
import { loadSessionUser, sessionUserFromLeave } from "$lib/server/auth.js";
import { LOCALE_COOKIE, isLocale, resolveRequestLocale } from "$lib/i18n/locales.js";
import { isOneLeaveAppPath, sanitizePostLoginRedirect } from "$lib/server/one-leave/paths.js";
import { getLeaveSessionUser } from "$lib/server/one-leave/session.js";
import type { LeaveAuthUser } from "$lib/server/one-leave/types.js";

function supabasePublicConfig(): { url: string; key: string } | null {
	const url = publicEnv.PUBLIC_SUPABASE_URL?.trim() ?? "";
	const key =
		(publicEnv.PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? publicEnv.PUBLIC_SUPABASE_ANON_KEY)?.trim() ?? "";
	if (!url || !key) return null;
	return { url, key };
}

const supabaseHandle: Handle = async ({ event, resolve }) => {
	const config = supabasePublicConfig();
	if (config) {
		event.locals.supabase = createServerClient<Database>(config.url, config.key, {
			cookies: {
				getAll: () => event.cookies.getAll(),
				setAll: (cookiesToSet) => {
					cookiesToSet.forEach(({ name, value, options }) => {
						event.cookies.set(name, value, { ...options, path: "/" });
					});
				},
			},
		});
	} else {
		event.locals.supabase = null;
	}

	return resolve(event, {
		filterSerializedResponseHeaders(name) {
			return name === "content-range";
		},
	});
};

const authGuard: Handle = async ({ event, resolve }) => {
	event.locals.locale = resolveRequestLocale({
		cookieLocale: event.cookies.get(LOCALE_COOKIE),
		acceptLanguage: event.request.headers.get("accept-language"),
	});

	const lang = event.url.searchParams.get("lang");
	if (isLocale(lang)) {
		event.locals.locale = lang;
		event.cookies.set(LOCALE_COOKIE, lang, {
			path: "/",
			sameSite: "lax",
			maxAge: 60 * 60 * 24 * 365,
		});

		const next = new URL(event.url);
		next.searchParams.delete("lang");
		redirect(303, `${next.pathname}${next.search}`);
	}

	event.locals.session = null;
	event.locals.user = null;

	let leaveUser: LeaveAuthUser | null = null;
	try {
		leaveUser = await getLeaveSessionUser(event.cookies);
	} catch (err) {
		console.error("[auth] leave session", err);
	}
	if (leaveUser) {
		event.locals.user = sessionUserFromLeave(leaveUser);
	} else if (event.locals.supabase) {
		const {
			data: { user: authUser },
			error: userError,
		} = await event.locals.supabase.auth.getUser();

		if (!userError && authUser) {
			const {
				data: { session },
			} = await event.locals.supabase.auth.getSession();
			event.locals.session = session;
			event.locals.user = await loadSessionUser(authUser.id);
			if (!event.locals.user) {
				event.locals.session = null;
			}
		}
	}

	const path = event.url.pathname;

	const isPublicRoute =
		path.startsWith("/login") ||
		path.startsWith("/register") ||
		path.startsWith("/forgot-password") ||
		path.startsWith("/reset-password") ||
		path.startsWith("/auth/") ||
		path.startsWith("/pricing") ||
		path.startsWith("/docs") ||
		path.startsWith("/api") ||
		path.startsWith("/lock") ||
		path.startsWith("/logout") ||
		path === "/sitemap.xml";

	// /leave/* → one-leave (vite proxy / reverse proxy) — ห้าม redirect ซ้ำที่นี่
	if (!isPublicRoute && !event.locals.user && !isOneLeaveAppPath(path)) {
		const returnTo = sanitizePostLoginRedirect(`${path}${event.url.search}`);
		const login = `/login?redirectTo=${encodeURIComponent(returnTo)}`;
		redirect(303, login);
	}

	if ((path === "/login" || path === "/register") && event.locals.user) {
		redirect(303, "/");
	}

	return resolve(event);
};

export const handle = sequence(supabaseHandle, authGuard);
