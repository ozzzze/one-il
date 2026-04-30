import { redirect } from "@sveltejs/kit";
import type { Actions } from "./$types.js";

export const actions: Actions = {
	default: async ({ locals }) => {
		const { session } = await locals.safeGetSession();
		if (session) {
			await locals.supabase.auth.signOut();
			throw redirect(303, "/login");
		}
		throw redirect(303, "/login");
	},
};
