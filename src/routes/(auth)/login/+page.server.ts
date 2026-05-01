import { getEnabledProviders } from "$lib/server/oauth.js";
import { db } from "$lib/server/db/index.js";
import { users } from "$lib/server/db/schema.js";
import { fail, redirect } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import type { Actions, PageServerLoad } from "./$types.js";

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) redirect(302, "/");
	return {
		enabledProviders: getEnabledProviders(),
	};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const formData = await request.formData();
		const username = formData.get("username");
		const password = formData.get("password");

		if (typeof username !== "string" || username.length < 3 || username.length > 31) {
			return fail(400, { message: "Invalid username (3-31 characters required)" });
		}
		if (typeof password !== "string" || password.length < 6 || password.length > 255) {
			return fail(400, { message: "Invalid password (6-255 characters required)" });
		}

		const existingUser = await db.query.users.findFirst({
			where: eq(users.username, username.toLowerCase()),
		});

		if (!existingUser) {
			return fail(400, { message: "Incorrect username or password" });
		}

		const { error } = await locals.supabase.auth.signInWithPassword({
			email: existingUser.email,
			password,
		});

		if (error) {
			return fail(400, { message: error.message });
		}

		redirect(302, "/");
	},
};
