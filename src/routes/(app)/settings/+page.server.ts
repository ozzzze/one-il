import { db } from "$lib/server/db/index.js";
import { users, appSettings } from "$lib/server/db/schema.js";
import { fail } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import type { Actions, PageServerLoad } from "./$types.js";

const defaultSettings: Record<string, string> = {
	siteName: "SvelteForge Admin",
	timezone: "UTC",
	defaultRole: "viewer",
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

	const [profile] = await db
		.select({
			id: users.id,
			name: users.name,
			email: users.email,
			username: users.username,
			role: users.role,
		})
		.from(users)
		.where(eq(users.id, user.id));

	const settings = { ...defaultSettings };
	if (user.role === "admin") {
		const rows = await db.select().from(appSettings);
		for (const row of rows) {
			settings[row.key] = row.value;
		}
	}

	const notifPrefs: Record<string, boolean> = {};
	for (const key of notificationPrefKeys) {
		notifPrefs[key] = true;
	}
	const prefRows = await db.select().from(appSettings);
	for (const row of prefRows) {
		const userPrefKey = `${user.id}:`;
		if (row.key.startsWith(userPrefKey)) {
			const prefName = row.key.slice(userPrefKey.length);
			if (notificationPrefKeys.includes(prefName)) {
				notifPrefs[prefName] = row.value === "true";
			}
		}
	}

	return {
		profile,
		settings,
		isAdmin: user.role === "admin",
		sessions: [] as { id: string; userAgent: string | null; ipAddress: string | null; createdAt: Date | null; expiresAt: number }[],
		currentSessionId: "",
		notificationPrefs: notifPrefs,
	};
};

export const actions: Actions = {
	updateProfile: async ({ request, locals }) => {
		const formData = await request.formData();
		const name = formData.get("name");
		const email = formData.get("email");

		if (typeof name !== "string" || name.length < 1 || name.length > 100) {
			return fail(400, { message: "Name is required (1-100 characters)" });
		}
		if (typeof email !== "string" || !email.includes("@") || email.length > 255) {
			return fail(400, { message: "Valid email is required" });
		}

		const lower = email.toLowerCase();
		const { error: authErr } = await locals.supabase.auth.updateUser({ email: lower });
		if (authErr) {
			return fail(400, { message: authErr.message });
		}

		try {
			await db
				.update(users)
				.set({ name, email: lower, updatedAt: new Date() })
				.where(eq(users.id, locals.user!.id));
		} catch {
			return fail(400, { message: "Email already taken" });
		}

		return { success: true, action: "profile" };
	},

	changePassword: async ({ request, locals }) => {
		const formData = await request.formData();
		const currentPassword = formData.get("currentPassword");
		const newPassword = formData.get("newPassword");
		const confirmPassword = formData.get("confirmPassword");

		if (typeof currentPassword !== "string" || currentPassword.length < 1) {
			return fail(400, { message: "Current password is required" });
		}
		if (typeof newPassword !== "string" || newPassword.length < 6 || newPassword.length > 255) {
			return fail(400, { message: "New password must be 6-255 characters" });
		}
		if (newPassword !== confirmPassword) {
			return fail(400, { message: "Passwords do not match" });
		}

		const profile = locals.user!;
		const { error: verifyErr } = await locals.supabase.auth.signInWithPassword({
			email: profile.email,
			password: currentPassword,
		});
		if (verifyErr) {
			return fail(400, { message: "Current password is incorrect" });
		}

		const { error: updErr } = await locals.supabase.auth.updateUser({ password: newPassword });
		if (updErr) {
			return fail(400, { message: updErr.message });
		}

		return { success: true, action: "password" };
	},

	updateSettings: async ({ request, locals }) => {
		if (locals.user!.role !== "admin") {
			return fail(403, { message: "Admin access required" });
		}

		const formData = await request.formData();
		const siteName = formData.get("siteName");
		const timezone = formData.get("timezone");
		const defaultRole = formData.get("defaultRole");
		const maintenanceMode = formData.get("maintenanceMode");

		const entries: [string, string][] = [
			["siteName", typeof siteName === "string" ? siteName : "SvelteForge Admin"],
			["timezone", typeof timezone === "string" ? timezone : "UTC"],
			["defaultRole", typeof defaultRole === "string" ? defaultRole : "viewer"],
			["maintenanceMode", maintenanceMode === "on" ? "true" : "false"],
		];

		for (const [key, value] of entries) {
			await db
				.insert(appSettings)
				.values({ key, value, updatedAt: new Date() })
				.onConflictDoUpdate({
					target: appSettings.key,
					set: { value, updatedAt: new Date() },
				});
		}

		return { success: true, action: "settings" };
	},

	revokeSession: async () => {
		return fail(400, {
			message: "Per-session revoke is handled by Supabase Auth; sign out everywhere from the Supabase dashboard if needed.",
		});
	},

	revokeAllOtherSessions: async () => {
		return fail(400, {
			message: "Revoking other sessions is handled by Supabase Auth.",
		});
	},

	updateNotificationPrefs: async ({ request, locals }) => {
		const formData = await request.formData();
		const userId = locals.user!.id;

		for (const key of notificationPrefKeys) {
			const value = formData.get(key) === "on" ? "true" : "false";
			const settingKey = `${userId}:${key}`;

			await db
				.insert(appSettings)
				.values({ key: settingKey, value, updatedAt: new Date() })
				.onConflictDoUpdate({
					target: appSettings.key,
					set: { value, updatedAt: new Date() },
				});
		}

		return { success: true, action: "notifications" };
	},
};
