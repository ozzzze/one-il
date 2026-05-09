import { getEnabledProviders } from "$lib/server/oauth.js";
import { getServiceRoleClient } from "$lib/server/supabase-admin.js";
import { fail, redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types.js";

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) redirect(302, "/");
	return {
		locale: locals.locale,
		enabledProviders: getEnabledProviders(),
	};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const t =
			locals.locale === "th"
				? {
						invalidUsername: "ชื่อผู้ใช้ไม่ถูกต้อง (ต้องมี 3-31 ตัวอักษร)",
						invalidPassword: "รหัสผ่านไม่ถูกต้อง (ต้องมี 6-255 ตัวอักษร)",
						dbUnavailable: "ไม่สามารถเชื่อมต่อฐานข้อมูลผู้ใช้ได้ในขณะนี้ กรุณาลองใหม่",
						incorrectCredentials: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง",
					}
				: {
						invalidUsername: "Invalid username (3-31 characters required)",
						invalidPassword: "Invalid password (6-255 characters required)",
						dbUnavailable: "Cannot reach user database right now. Please try again.",
						incorrectCredentials: "Incorrect username or password",
					};
		const formData = await request.formData();
		const username = formData.get("username");
		const password = formData.get("password");

		if (typeof username !== "string" || username.length < 3 || username.length > 31) {
			return fail(400, { message: t.invalidUsername });
		}
		if (typeof password !== "string" || password.length < 6 || password.length > 255) {
			return fail(400, { message: t.invalidPassword });
		}

		const normalizedUsername = username.toLowerCase();
		const admin = getServiceRoleClient();
		const { data, error: userLookupError } = await admin
			.from("users")
			.select("email")
			.eq("username", normalizedUsername)
			.maybeSingle();
		if (userLookupError) {
			return fail(500, { message: t.dbUnavailable });
		}
		const existingUser = data ? { email: data.email as string } : null;

		if (!existingUser) {
			return fail(400, { message: t.incorrectCredentials });
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
