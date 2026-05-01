import { redirect } from "@sveltejs/kit";
import type { Actions } from "./$types.js";

export const actions: Actions = {
	default: async ({ locals }) => {
		await locals.supabase.auth.signOut();
		redirect(302, "/login");
	},
};
