import { getServiceRoleClient } from "$lib/server/supabase-admin.js";
import { fail, redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types.js";

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) redirect(302, "/");
	redirect(303, "/login");
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const t =
			locals.locale === "th"
				? {
						nameRequired: "ต้องระบุชื่อ (1-100 ตัวอักษร)",
						emailRequired: "ต้องระบุอีเมลที่ถูกต้อง",
						usernameRule:
							"ชื่อผู้ใช้ต้องยาว 3-31 ตัวอักษร และใช้ได้เฉพาะตัวพิมพ์เล็ก ตัวเลข ขีดกลาง และขีดล่าง",
						passwordRule: "รหัสผ่านต้องมี 6-255 ตัวอักษร",
						dbUnavailable: "ไม่สามารถเชื่อมต่อฐานข้อมูลผู้ใช้ได้ในขณะนี้ กรุณาลองใหม่",
						missingSession:
							"สร้างบัญชีแล้วแต่ยังไม่มีเซสชัน — หากระบบบังคับยืนยันอีเมล ให้ยืนยันก่อนแล้วจึงเข้าสู่ระบบ",
						duplicate: "ชื่อผู้ใช้หรืออีเมลนี้ถูกใช้งานแล้ว",
						profileFail: "ไม่สามารถสร้างโปรไฟล์ผู้ใช้ได้ในขณะนี้ กรุณาลองใหม่",
						checkEmail: "กรุณาตรวจสอบอีเมลเพื่อยืนยันบัญชี แล้วจึงเข้าสู่ระบบ",
					}
				: {
						nameRequired: "Name is required (1-100 characters)",
						emailRequired: "Valid email is required",
						usernameRule:
							"Username must be 3-31 characters, lowercase letters, numbers, hyphens, underscores",
						passwordRule: "Password must be 6-255 characters",
						dbUnavailable: "Cannot reach user database right now. Please try again.",
						missingSession:
							"Account created but session missing — confirm email if required, or try signing in.",
						duplicate: "Username or email already taken",
						profileFail: "Cannot create user profile right now. Please try again.",
						checkEmail: "Check your email to confirm your account, then sign in.",
					};
		const formData = await request.formData();
		const name = formData.get("name");
		const email = formData.get("email");
		const username = formData.get("username");
		const password = formData.get("password");

		if (typeof name !== "string" || name.length < 1 || name.length > 100) {
			return fail(400, { message: t.nameRequired });
		}
		if (typeof email !== "string" || !email.includes("@") || email.length > 255) {
			return fail(400, { message: t.emailRequired });
		}
		if (
			typeof username !== "string" ||
			username.length < 3 ||
			username.length > 31 ||
			!/^[a-z0-9_-]+$/.test(username)
		) {
			return fail(400, {
				message: t.usernameRule,
			});
		}
		if (typeof password !== "string" || password.length < 6 || password.length > 255) {
			return fail(400, { message: t.passwordRule });
		}

		const admin = getServiceRoleClient();
		const { count, error: userCountError } = await admin
			.from("users")
			.select("id", { count: "exact", head: true });
		if (userCountError) {
			return fail(500, { message: t.dbUnavailable });
		}
		const userCount = count ?? 0;
		const role = userCount === 0 ? "admin" : "viewer";

		if (!locals.supabase) {
			return fail(503, {
				message:
					locals.locale === "th"
						? "สมัครสมาชิกผ่านระบบลา (/leave)"
						: "Register via one-leave (/leave)",
			});
		}

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
				message: t.missingSession,
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
			const msg = profileInsertError.code === "23505" ? t.duplicate : t.profileFail;
			return fail(profileInsertError.code === "23505" ? 400 : 500, { message: msg });
		}

		if (data.session) {
			redirect(302, "/");
		}

		return {
			success: true,
			message: t.checkEmail,
		};
	},
};
