import { redirect } from "@sveltejs/kit";
import { LEAVE_SESSION_COOKIE } from "$lib/server/one-leave/session.js";
import type { Actions } from "./$types.js";

export const actions: Actions = {
	default: async ({ locals, cookies }) => {
		cookies.delete(LEAVE_SESSION_COOKIE, { path: "/" });
		if (locals.supabase) {
			await locals.supabase.auth.signOut();
		}
		redirect(302, "/login");
	},
};
