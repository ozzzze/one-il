import { db } from "$lib/server/db/index.js";
import { users } from "$lib/server/db/schema.js";
import { fail, redirect } from "@sveltejs/kit";
import { sql } from "drizzle-orm";
import type { Actions, PageServerLoad } from "./$types.js";

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) redirect(302, "/");
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const formData = await request.formData();
		const name = formData.get("name");
		const email = formData.get("email");
		const username = formData.get("username");
		const password = formData.get("password");

		if (typeof name !== "string" || name.length < 1 || name.length > 100) {
			return fail(400, { message: "Name is required (1-100 characters)" });
		}
		if (typeof email !== "string" || !email.includes("@") || email.length > 255) {
			return fail(400, { message: "Valid email is required" });
		}
		if (
			typeof username !== "string" ||
			username.length < 3 ||
			username.length > 31 ||
			!/^[a-z0-9_-]+$/.test(username)
		) {
			return fail(400, {
				message: "Username must be 3-31 characters, lowercase letters, numbers, hyphens, underscores",
			});
		}
		if (typeof password !== "string" || password.length < 6 || password.length > 255) {
			return fail(400, { message: "Password must be 6-255 characters" });
		}

		const [{ c }] = await db.select({ c: sql<number>`count(*)::int` }).from(users);
		const userCount = Number(c) || 0;
		const role = userCount === 0 ? "admin" : "viewer";

		const { data, error } = await locals.supabase.auth.signUp({
			email: email.toLowerCase(),
			password,
			options: {
				data: {
					username: username.toLowerCase(),
					full_name: name,
					role,
				},
			},
		});

		if (error) {
			return fail(400, { message: error.message });
		}

		const uid = data.user?.id;
		if (!uid) {
			return fail(400, {
				message:
					"Account created but session missing — confirm email if required, or try signing in.",
			});
		}

		try {
			await db
				.insert(users)
				.values({
					id: uid,
					email: email.toLowerCase(),
					username: username.toLowerCase(),
					passwordHash: null,
					name,
					role,
				})
				.onConflictDoNothing();
		} catch {
			return fail(400, { message: "Username or email already taken" });
		}

		if (data.session) {
			redirect(302, "/");
		}

		return {
			success: true,
			message: "Check your email to confirm your account, then sign in.",
		};
	},
};
