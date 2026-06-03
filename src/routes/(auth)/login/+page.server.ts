import { fail, redirect } from "@sveltejs/kit";
import { z } from "zod";
import { authenticateLeaveUser } from "$lib/server/one-leave/authenticate.js";
import { isLeaveAuthMockEnabled } from "$lib/server/one-leave/mock-auth.js";
import { userFacingDbError } from "$lib/server/one-leave/pg-errors.js";
import { sanitizePostLoginRedirect } from "$lib/server/one-leave/paths.js";
import { createLeaveSessionCookie } from "$lib/server/one-leave/session.js";
import { getEnabledProviders } from "$lib/server/oauth.js";
import type { Actions, PageServerLoad } from "./$types.js";

const loginSchema = z.object({
	username: z.string().trim().min(1),
	password: z.string().min(1),
});

export const load: PageServerLoad = async ({ locals, url }) => {
	if (locals.user) {
		redirect(302, "/");
	}

	return {
		locale: locals.locale,
		redirectTo: sanitizePostLoginRedirect(url.searchParams.get("redirectTo") ?? "/"),
		googleEnabled: getEnabledProviders().includes("google"),
		authMock: isLeaveAuthMockEnabled(),
	};
};

export const actions: Actions = {
	default: async ({ request, cookies, locals, url }) => {
		const t =
			locals.locale === "th"
				? {
						invalid: "กรุณากรอกชื่อผู้ใช้และรหัสผ่าน",
						dbError: "เชื่อมต่อฐานข้อมูลไม่สำเร็จ ลองใหม่อีกครั้ง",
						badCredentials: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง",
					}
				: {
						invalid: "Enter username and password",
						dbError: "Could not reach the database. Please try again.",
						badCredentials: "Incorrect username or password",
					};

		const fd = await request.formData();
		const parsed = loginSchema.safeParse({
			username: fd.get("username"),
			password: fd.get("password"),
		});

		if (!parsed.success) {
			return fail(400, { message: t.invalid, username: String(fd.get("username") ?? "") });
		}

		let user;
		try {
			user = await authenticateLeaveUser(parsed.data.username, parsed.data.password);
		} catch (err) {
			return fail(500, {
				message: userFacingDbError(err, t.dbError),
				username: parsed.data.username,
			});
		}

		if (!user) {
			return fail(401, { message: t.badCredentials, username: parsed.data.username });
		}

		try {
			await createLeaveSessionCookie(cookies, user);
		} catch (err) {
			return fail(500, {
				message: userFacingDbError(err, t.dbError),
				username: parsed.data.username,
			});
		}

		if (user.mustChangePassword) {
			redirect(303, "/leave/account/change-password");
		}

		const fromForm = fd.get("redirectTo");
		const redirectTo = sanitizePostLoginRedirect(
			typeof fromForm === "string" && fromForm.length > 0
				? fromForm
				: (url.searchParams.get("redirectTo") ?? "/"),
		);

		redirect(303, redirectTo.startsWith("/") ? redirectTo : "/");
	},
};
