import { getServiceRoleClient } from "$lib/server/supabase-admin.js";
import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types.js";

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user!.role !== "admin") {
		error(403, "Admin access required");
	}
	const admin = getServiceRoleClient();
	const [usersCountRes, sessionsCountRes, pagesCountRes, notificationsCountRes, settingsCountRes] =
		await Promise.all([
			admin.from("users").select("id", { count: "exact", head: true }),
			admin.from("sessions").select("id", { count: "exact", head: true }),
			admin.from("pages").select("id", { count: "exact", head: true }),
			admin.from("notifications").select("id", { count: "exact", head: true }),
			admin.from("app_settings").select("key", { count: "exact", head: true }),
		]);
	if (
		usersCountRes.error ||
		sessionsCountRes.error ||
		pagesCountRes.error ||
		notificationsCountRes.error ||
		settingsCountRes.error
	) {
		error(500, "Cannot load database information");
	}

	const tables = [
		{ name: "users", rows: Number(usersCountRes.count ?? 0) },
		{ name: "sessions", rows: Number(sessionsCountRes.count ?? 0) },
		{ name: "pages", rows: Number(pagesCountRes.count ?? 0) },
		{ name: "notifications", rows: Number(notificationsCountRes.count ?? 0) },
		{ name: "app_settings", rows: Number(settingsCountRes.count ?? 0) },
	];

	return {
		dbSize: 0,
		journalMode: "postgresql",
		tables,
		totalRows: tables.reduce((sum, t) => sum + t.rows, 0),
	};
};
