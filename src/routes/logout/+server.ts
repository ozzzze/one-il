import { redirect } from "@sveltejs/kit";
import { LEAVE_SESSION_COOKIE } from "$lib/server/one-leave/session.js";
import type { RequestHandler } from "./$types.js";

async function clearAuthSession(cookies: import("@sveltejs/kit").Cookies, supabase: App.Locals["supabase"]) {
	cookies.delete(LEAVE_SESSION_COOKIE, { path: "/" });
	if (supabase) {
		await supabase.auth.signOut();
	}
}

export const GET: RequestHandler = async ({ cookies, locals }) => {
	await clearAuthSession(cookies, locals.supabase);
	redirect(303, "/login");
};

export const POST: RequestHandler = async ({ cookies, locals }) => {
	await clearAuthSession(cookies, locals.supabase);
	redirect(303, "/login");
};
