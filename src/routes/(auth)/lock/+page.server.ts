import { fail, redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types.js";

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		redirect(302, "/login");
	}
	return {
		user: {
			name: locals.user.name,
			email: locals.user.email,
			username: locals.user.username,
		},
	};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		if (!locals.user) {
			redirect(302, "/login");
		}

		const formData = await request.formData();
		const password = formData.get("password");

		if (typeof password !== "string" || password.length < 1) {
			return fail(400, { message: "Password is required" });
		}

		const { error } = await locals.supabase.auth.signInWithPassword({
			email: locals.user.email,
			password,
		});

		if (error) {
			return fail(400, { message: "Incorrect password" });
		}

		redirect(302, "/");
	},
};
