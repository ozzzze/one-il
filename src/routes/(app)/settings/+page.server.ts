import { getServiceRoleClient } from "$lib/server/supabase-admin.js";
import { fail } from "@sveltejs/kit";
import { hasPermission, isRole } from "$lib/auth/roles.js";
import type { Actions, PageServerLoad } from "./$types.js";

const defaultSettings: Record<string, string> = {
	siteName: "ONE-IL",
	timezone: "UTC",
	defaultRole: "user",
	maintenanceMode: "false",
};

const notificationPrefKeys = [
	"notif_new_user",
	"notif_content_published",
	"notif_security_alert",
	"notif_system_warning",
	"notif_weekly_digest",
	"notif_maintenance",
];

export const load: PageServerLoad = async ({ locals }) => {
	const user = locals.user!;

	const profile =
		user.authSource === "one-leave"
			? {
					id: user.id,
					name: user.name,
					email: user.email,
					username: user.username,
					role: user.role,
				}
			: await (async () => {
					const admin = getServiceRoleClient();
					const { data: profileRow } = await admin
						.from("users")
						.select("id,name,email,username,role")
						.eq("id", user.id)
						.maybeSingle();
					return (
						profileRow ?? {
							id: user.id,
							name: user.name,
							email: user.email,
							username: user.username,
							role: user.role,
						}
					);
				})();

	const settings = { ...defaultSettings };
	const notifPrefs: Record<string, boolean> = {};
	for (const key of notificationPrefKeys) {
		notifPrefs[key] = true;
	}

	if (user.authSource !== "one-leave" && hasPermission(user.role, "settings:manage")) {
		const admin = getServiceRoleClient();
		const { data: rows } = await admin.from("app_settings").select("key,value");
		for (const row of rows ?? []) {
			settings[row.key] = row.value;
		}
		const { data: prefRows } = await admin.from("app_settings").select("key,value");
		for (const row of prefRows ?? []) {
			const userPrefKey = `${user.id}:`;
			if (row.key.startsWith(userPrefKey)) {
				const prefName = row.key.slice(userPrefKey.length);
				if (notificationPrefKeys.includes(prefName)) {
					notifPrefs[prefName] = row.value === "true";
				}
			}
		}
	}

	return {
		profile,
		settings,
		isAdmin: hasPermission(user.role, "settings:manage"),
		sessions: [] as { id: string; userAgent: string | null; ipAddress: string | null; createdAt: Date | null; expiresAt: number }[],
		currentSessionId: "",
		notificationPrefs: notifPrefs,
	};
};

export const actions: Actions = {
	updateProfile: async ({ request, locals }) => {
		const admin = getServiceRoleClient();
		const t =
			locals.locale === "th"
				? {
						nameRequired: "ต้องระบุชื่อ (1-100 ตัวอักษร)",
						emailRequired: "ต้องระบุอีเมลที่ถูกต้อง",
						emailTaken: "อีเมลนี้ถูกใช้งานแล้ว",
					}
				: {
						nameRequired: "Name is required (1-100 characters)",
						emailRequired: "Valid email is required",
						emailTaken: "Email already taken",
					};
		const formData = await request.formData();
		const name = formData.get("name");
		const email = formData.get("email");

		if (typeof name !== "string" || name.length < 1 || name.length > 100) {
			return fail(400, { message: t.nameRequired });
		}
		if (typeof email !== "string" || !email.includes("@") || email.length > 255) {
			return fail(400, { message: t.emailRequired });
		}

		if (!locals.supabase || locals.user!.authSource === "one-leave") {
			const msg =
				locals.locale === "th"
					? "แก้ไขโปรไฟล์ในระบบลา (/leave) หรือติดต่อผู้ดูแล"
					: "Update profile in one-leave (/leave) or contact an admin";
			return fail(400, { message: msg });
		}

		const lower = email.toLowerCase();
		const { error: authErr } = await locals.supabase.auth.updateUser({ email: lower });
		if (authErr) {
			return fail(400, { message: authErr.message });
		}

		const { error: updateError } = await admin
			.from("users")
			.update({ name, email: lower, updated_at: new Date().toISOString() })
			.eq("id", locals.user!.id);
		if (updateError) return fail(400, { message: t.emailTaken });

		return { success: true, action: "profile" };
	},

	changePassword: async ({ request, locals }) => {
		const t =
			locals.locale === "th"
				? {
						currentRequired: "ต้องระบุรหัสผ่านปัจจุบัน",
						newLength: "รหัสผ่านใหม่ต้องมี 6-255 ตัวอักษร",
						mismatch: "รหัสผ่านไม่ตรงกัน",
						incorrectCurrent: "รหัสผ่านปัจจุบันไม่ถูกต้อง",
					}
				: {
						currentRequired: "Current password is required",
						newLength: "New password must be 6-255 characters",
						mismatch: "Passwords do not match",
						incorrectCurrent: "Current password is incorrect",
					};
		const formData = await request.formData();
		const currentPassword = formData.get("currentPassword");
		const newPassword = formData.get("newPassword");
		const confirmPassword = formData.get("confirmPassword");

		if (typeof currentPassword !== "string" || currentPassword.length < 1) {
			return fail(400, { message: t.currentRequired });
		}
		if (typeof newPassword !== "string" || newPassword.length < 6 || newPassword.length > 255) {
			return fail(400, { message: t.newLength });
		}
		if (newPassword !== confirmPassword) {
			return fail(400, { message: t.mismatch });
		}

		if (!locals.supabase || locals.user!.authSource === "one-leave") {
			const msg =
				locals.locale === "th"
					? "เปลี่ยนรหัสผ่านได้ที่ระบบลา (/leave)"
					: "Change password in one-leave (/leave)";
			return fail(400, { message: msg });
		}

		const profile = locals.user!;
		const { error: verifyErr } = await locals.supabase.auth.signInWithPassword({
			email: profile.email,
			password: currentPassword,
		});
		if (verifyErr) {
			return fail(400, { message: t.incorrectCurrent });
		}

		const { error: updErr } = await locals.supabase.auth.updateUser({ password: newPassword });
		if (updErr) {
			return fail(400, { message: updErr.message });
		}

		return { success: true, action: "password" };
	},

	updateSettings: async ({ request, locals }) => {
		const admin = getServiceRoleClient();
		const adminError = locals.locale === "th" ? "ต้องใช้สิทธิ์ผู้ดูแลระบบ" : "Admin access required";
		if (!hasPermission(locals.user!.role, "settings:manage")) {
			return fail(403, { message: adminError });
		}

		const formData = await request.formData();
		const siteName = formData.get("siteName");
		const timezone = formData.get("timezone");
		const defaultRole = formData.get("defaultRole");
		const maintenanceMode = formData.get("maintenanceMode");

		const entries: [string, string][] = [
			["siteName", typeof siteName === "string" ? siteName : "ONE-IL"],
			["timezone", typeof timezone === "string" ? timezone : "UTC"],
			["defaultRole", isRole(defaultRole) ? defaultRole : "user"],
			["maintenanceMode", maintenanceMode === "on" ? "true" : "false"],
		];

		for (const [key, value] of entries) {
			await admin.from("app_settings").upsert(
				{ key, value, updated_at: new Date().toISOString() },
				{ onConflict: "key" }
			);
		}

		return { success: true, action: "settings" };
	},

	revokeSession: async ({ locals }) => {
		const message =
			locals.locale === "th"
				? "การยกเลิกเซสชันรายอุปกรณ์จัดการผ่าน Supabase Auth; หากจำเป็นให้ลงชื่อออกจากทุกอุปกรณ์ผ่าน Supabase dashboard"
				: "Per-session revoke is handled by Supabase Auth; sign out everywhere from the Supabase dashboard if needed.";
		return fail(400, {
			message,
		});
	},

	revokeAllOtherSessions: async ({ locals }) => {
		const message =
			locals.locale === "th"
				? "การยกเลิกเซสชันอื่นจัดการผ่าน Supabase Auth"
				: "Revoking other sessions is handled by Supabase Auth.";
		return fail(400, {
			message,
		});
	},

	updateNotificationPrefs: async ({ request, locals }) => {
		const admin = getServiceRoleClient();
		const formData = await request.formData();
		const userId = locals.user!.id;

		for (const key of notificationPrefKeys) {
			const value = formData.get(key) === "on" ? "true" : "false";
			const settingKey = `${userId}:${key}`;

			await admin.from("app_settings").upsert(
				{ key: settingKey, value, updated_at: new Date().toISOString() },
				{ onConflict: "key" }
			);
		}

		return { success: true, action: "notifications" };
	},
};
