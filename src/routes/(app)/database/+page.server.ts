import { db } from "$lib/server/db/index.js";
import { users, sessions, pages, notifications, appSettings } from "$lib/server/db/schema.js";
import { sql } from "drizzle-orm";
import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types.js";

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user!.role !== "admin") {
		error(403, "Admin access required");
	}

	const [usersCount] = await db.select({ count: sql<number>`count(*)::int` }).from(users);
	const [sessionsCount] = await db.select({ count: sql<number>`count(*)::int` }).from(sessions);
	const [pagesCount] = await db.select({ count: sql<number>`count(*)::int` }).from(pages);
	const [notificationsCount] = await db.select({ count: sql<number>`count(*)::int` }).from(notifications);
	const [settingsCount] = await db.select({ count: sql<number>`count(*)::int` }).from(appSettings);

	const tables = [
		{ name: "users", rows: Number(usersCount.count) },
		{ name: "sessions", rows: Number(sessionsCount.count) },
		{ name: "pages", rows: Number(pagesCount.count) },
		{ name: "notifications", rows: Number(notificationsCount.count) },
		{ name: "app_settings", rows: Number(settingsCount.count) },
	];

	return {
		dbSize: 0,
		journalMode: "postgresql",
		tables,
		totalRows: tables.reduce((sum, t) => sum + t.rows, 0),
	};
};
