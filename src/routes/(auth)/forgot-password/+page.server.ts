import { env } from "$env/dynamic/private";
import { fail } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types.js";

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) {
		return { alreadyLoggedIn: true, locale: locals.locale };
	}
	return { locale: locals.locale };
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const formData = await request.formData();
		const email = formData.get("email");

		if (typeof email !== "string" || !email.includes("@")) {
			return fail(400, {
				message:
					locals.locale === "th"
						? "กรุณากรอกอีเมลให้ถูกต้อง"
						: "Please enter a valid email address",
			});
		}

		if (!locals.supabase) {
			return fail(503, {
				message:
					locals.locale === "th"
						? "ใช้การรีเซ็ตรหัสผ่านที่ระบบลา (/leave)"
						: "Use password reset in one-leave (/leave)",
			});
		}

		const origin = env.ORIGIN ?? "http://localhost:5173";
		const { error } = await locals.supabase.auth.resetPasswordForEmail(email.toLowerCase(), {
			redirectTo: `${origin}/auth/callback?next=/reset-password`,
		});

		if (error) {
			console.warn("[forgot-password]", error.message);
		}

		return { success: true };
	},
};
