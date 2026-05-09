import { createServerClient } from "@supabase/ssr";
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY } from "$env/static/public";
import { redirect, type Handle } from "@sveltejs/kit";
import { sequence } from "@sveltejs/kit/hooks";
import { loadSessionUser } from "$lib/server/auth.js";
import { LOCALE_COOKIE, isLocale, resolveRequestLocale } from "$lib/i18n/locales.js";

const supabaseHandle: Handle = async ({ event, resolve }) => {
	event.locals.supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
		cookies: {
			getAll: () => event.cookies.getAll(),
			setAll: (cookiesToSet) => {
				cookiesToSet.forEach(({ name, value, options }) => {
					event.cookies.set(name, value, { ...options, path: "/" });
				});
			},
		},
	});

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

	const supabase = event.locals.supabase;

	const {
		data: { user: authUser },
		error: userError,
	} = await supabase.auth.getUser();

	if (userError || !authUser) {
		event.locals.session = null;
		event.locals.user = null;
	} else {
		const {
			data: { session },
		} = await supabase.auth.getSession();
		event.locals.session = session;
		event.locals.user = await loadSessionUser(authUser.id);
		if (!event.locals.user) {
			event.locals.session = null;
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

	if (!isPublicRoute && !event.locals.user) {
		redirect(303, "/login");
	}

	if ((path === "/login" || path === "/register") && event.locals.user) {
		redirect(303, "/");
	}

	return resolve(event);
};

export const handle = sequence(supabaseHandle, authGuard);
