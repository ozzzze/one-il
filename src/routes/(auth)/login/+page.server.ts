import { fail, redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types.js";

export const load: PageServerLoad = async ({ locals }) => {
	const { session } = await locals.safeGetSession();
	if (session) throw redirect(302, "/");
	return {
		// Enabled providers would come from your Supabase project settings
		enabledProviders: [], 
	};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const formData = await request.formData();
		const email = formData.get("username") as string; // Reusing the username field as email
		const password = formData.get("password") as string;

		if (!email || !password) {
			return fail(400, { message: "Email and password are required" });
		}

		const { error } = await locals.supabase.auth.signInWithPassword({
			email,
			password,
		});

		if (error) {
			return fail(400, { message: error.message });
		}

		throw redirect(303, "/");
	},
};
