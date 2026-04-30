import { createServerClient } from "@supabase/ssr";
import { type Handle, redirect } from "@sveltejs/kit";
import { sequence } from "@sveltejs/kit/hooks";
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from "$env/static/public";

const supabase: Handle = async ({ event, resolve }) => {
	/**
	 * Creates a Supabase client specific to this event's context.
	 *
	 * The cookie methods are used for read/write access to cookies from the browser.
	 */
	event.locals.supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
		cookies: {
			getAll: () => event.cookies.getAll(),
			/**
			 * SvelteKit's `cookies.set` will e.g. set `path: '/'` by default
			 * ถ้าไม่ระบุ path จะทำให้ session หายเวลาเปลี่ยน route
			 */
			setAll: (cookiesToSet) => {
				cookiesToSet.forEach(({ name, value, options }) => {
					event.cookies.set(name, value, { ...options, path: "/" });
				});
			},
		},
	});

	/**
	 * a helper function to safely get the session from the server-side
	 */
	event.locals.safeGetSession = async () => {
		const {
			data: { session },
		} = await event.locals.supabase.auth.getSession();
		if (!session) {
			return { session: null, user: null };
		}

		const {
			data: { user },
			error,
		} = await event.locals.supabase.auth.getUser();
		if (error) {
			// JWT validation has failed
			return { session: null, user: null };
		}

		return { session, user };
	};

	return resolve(event, {
		filterSerializedResponseHeaders(name) {
			/**
			 * Supabase auth needs the content-range header
			 */
			return name === "content-range";
		},
	});
};

const authGuard: Handle = async ({ event, resolve }) => {
	const { session, user } = await event.locals.safeGetSession();
	event.locals.session = session;
	event.locals.user = user;

	const path = event.url.pathname;

	// Define public routes
	const isPublicRoute = 
		path.startsWith("/login") || 
		path.startsWith("/register") || 
		path.startsWith("/forgot-password") || 
		path.startsWith("/reset-password") || 
		path.startsWith("/pricing") || 
		path.startsWith("/docs") || 
		path.startsWith("/api") || 
		path.startsWith("/lock") ||
		path.startsWith("/logout");

	// If it's NOT a public route and NOT logged in, redirect to login
	if (!isPublicRoute && !session) {
		redirect(303, "/login");
	}

	// If it's an auth route (login/register) and ALREADY logged in, redirect to dashboard
	if ((path === "/login" || path === "/register") && session) {
		redirect(303, "/");
	}

	return resolve(event);
};

export const handle = sequence(supabase, authGuard);
