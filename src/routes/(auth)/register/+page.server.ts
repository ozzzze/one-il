import { fail, redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types.js";

export const load: PageServerLoad = async ({ locals }) => {
	const { session } = await locals.safeGetSession();
	if (session) throw redirect(302, "/");
	return {};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const formData = await request.formData();
		const name = formData.get("name") as string;
		const email = formData.get("email") as string;
		const username = formData.get("username") as string;
		const password = formData.get("password") as string;

		if (!name || name.length < 1 || name.length > 100) {
			return fail(400, { message: "Name is required (1-100 characters)" });
		}
		if (!email || !email.includes("@")) {
			return fail(400, { message: "Valid email is required" });
		}
		if (!username || username.length < 3) {
			return fail(400, { message: "Username must be at least 3 characters" });
		}
		if (!password || password.length < 6) {
			return fail(400, { message: "Password must be at least 6 characters" });
		}

		const { data, error } = await locals.supabase.auth.signUp({
			email: email.toLowerCase(),
			password,
			options: {
				data: {
					full_name: name,
					username: username.toLowerCase(),
					role: "admin", // Default role for local dev testing
				},
			},
		});

		if (error) {
			return fail(400, { message: error.message });
		}

		// If email confirmation is enabled, we might not have a session immediately.
		// For local development, it usually logs in immediately.
		if (data.session) {
			throw redirect(303, "/");
		} else {
			return { success: true, message: "Please check your email to confirm your registration." };
		}
	},
};
