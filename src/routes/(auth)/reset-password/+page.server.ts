import { fail, redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types.js";

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.supabase) {
		return { canReset: false, locale: locals.locale };
	}
	const {
		data: { session },
	} = await locals.supabase.auth.getSession();
	return { canReset: !!session, locale: locals.locale };
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const t =
			locals.locale === "th"
				? {
						passwordRule: "รหัสผ่านต้องมี 6-255 ตัวอักษร",
						passwordMismatch: "รหัสผ่านไม่ตรงกัน",
						sessionExpired: "เซสชันรีเซ็ตรหัสผ่านหมดอายุแล้ว กรุณาขอลิงก์ใหม่",
					}
				: {
						passwordRule: "Password must be 6-255 characters",
						passwordMismatch: "Passwords do not match",
						sessionExpired: "Your reset session expired. Request a new link.",
					};
		const formData = await request.formData();
		const password = formData.get("password");
		const confirmPassword = formData.get("confirmPassword");

		if (typeof password !== "string" || password.length < 6 || password.length > 255) {
			return fail(400, { message: t.passwordRule });
		}
		if (password !== confirmPassword) {
			return fail(400, { message: t.passwordMismatch });
		}

		if (!locals.supabase) {
			return fail(503, { message: t.sessionExpired });
		}

		const {
			data: { session },
		} = await locals.supabase.auth.getSession();
		if (!session) {
			return fail(401, { message: t.sessionExpired });
		}

		const { error } = await locals.supabase.auth.updateUser({ password });
		if (error) {
			return fail(400, { message: error.message });
		}

		redirect(302, "/login");
	},
};
