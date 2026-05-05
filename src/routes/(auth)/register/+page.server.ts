import { getServiceRoleClient } from "$lib/server/supabase-admin.js";
import { fail, redirect } from "@sveltejs/kit";
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

		const admin = getServiceRoleClient();
		const { count, error: userCountError } = await admin
			.from("users")
			.select("id", { count: "exact", head: true });
		if (userCountError) {
			return fail(500, { message: "Cannot reach user database right now. Please try again." });
		}
		const userCount = count ?? 0;
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

		const { error: profileInsertError } = await admin.from("users").insert({
			id: uid,
			email: email.toLowerCase(),
			username: username.toLowerCase(),
			password_hash: null,
			name,
			role,
		});
		if (profileInsertError) {
			const msg =
				profileInsertError.code === "23505"
					? "Username or email already taken"
					: "Cannot create user profile right now. Please try again.";
			return fail(profileInsertError.code === "23505" ? 400 : 500, { message: msg });
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
