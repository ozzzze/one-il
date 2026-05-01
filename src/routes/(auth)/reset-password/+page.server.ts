import { fail, redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types.js";

export const load: PageServerLoad = async ({ locals }) => {
	const {
		data: { session },
	} = await locals.supabase.auth.getSession();
	return { canReset: !!session };
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const formData = await request.formData();
		const password = formData.get("password");
		const confirmPassword = formData.get("confirmPassword");

		if (typeof password !== "string" || password.length < 6 || password.length > 255) {
			return fail(400, { message: "Password must be 6-255 characters" });
		}
		if (password !== confirmPassword) {
			return fail(400, { message: "Passwords do not match" });
		}

		const {
			data: { session },
		} = await locals.supabase.auth.getSession();
		if (!session) {
			return fail(401, { message: "Your reset session expired. Request a new link." });
		}

		const { error } = await locals.supabase.auth.updateUser({ password });
		if (error) {
			return fail(400, { message: error.message });
		}

		redirect(302, "/login");
	},
};
