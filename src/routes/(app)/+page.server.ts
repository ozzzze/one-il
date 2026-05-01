import { db } from "$lib/server/db/index.js";
import { users, pages, notifications, appSettings } from "$lib/server/db/schema.js";
import { sql, eq, desc, or, isNull, gt } from "drizzle-orm";
import type { PageServerLoad } from "./$types.js";

export const load: PageServerLoad = async ({ locals }) => {
	const thisMonthStart = new Date();
	thisMonthStart.setDate(1);
	thisMonthStart.setHours(0, 0, 0, 0);
	const lastMonthStart = new Date(thisMonthStart);
	lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);

	const [userCount] = await db.select({ count: sql<number>`count(*)::int` }).from(users);

	const [pageCount] = await db.select({ count: sql<number>`count(*)::int` }).from(pages);

	const [unreadCount] = await db
		.select({ count: sql<number>`count(*)::int` })
		.from(notifications)
		.where(eq(notifications.read, false));

	const [usersThisMonth] = await db
		.select({ count: sql<number>`count(*)::int` })
		.from(users)
		.where(sql`${users.createdAt} >= ${thisMonthStart}`);

	const [usersLastMonth] = await db
		.select({ count: sql<number>`count(*)::int` })
		.from(users)
		.where(sql`${users.createdAt} >= ${lastMonthStart} AND ${users.createdAt} < ${thisMonthStart}`);

	const [pagesThisMonth] = await db
		.select({ count: sql<number>`count(*)::int` })
		.from(pages)
		.where(sql`${pages.createdAt} >= ${thisMonthStart}`);

	const [pagesLastMonth] = await db
		.select({ count: sql<number>`count(*)::int` })
		.from(pages)
		.where(sql`${pages.createdAt} >= ${lastMonthStart} AND ${pages.createdAt} < ${thisMonthStart}`);

	function calcTrend(current: number, previous: number) {
		if (previous === 0) return current > 0 ? 100 : 0;
		return Math.round(((current - previous) / previous) * 100);
	}

	const roleDistribution = await db
		.select({
			role: users.role,
			count: sql<number>`count(*)::int`,
		})
		.from(users)
		.groupBy(users.role);

	const monthlySignups = await db
		.select({
			month: sql<string>`to_char(date_trunc('month', ${users.createdAt}), 'YYYY-MM') || '-01'`,
			count: sql<number>`count(*)::int`,
		})
		.from(users)
		.groupBy(sql`date_trunc('month', ${users.createdAt})`)
		.orderBy(sql`date_trunc('month', ${users.createdAt})`);

	const recentUsers = await db
		.select({ name: users.name, createdAt: users.createdAt })
		.from(users)
		.orderBy(desc(users.createdAt))
		.limit(5);

	const recentPages = await db
		.select({
			title: pages.title,
			authorName: users.name,
			createdAt: pages.createdAt,
		})
		.from(pages)
		.leftJoin(users, eq(pages.authorId, users.id))
		.orderBy(desc(pages.createdAt))
		.limit(5);

	type ActivityItem = { label: string; description: string; time: Date };

	const activity: ActivityItem[] = [
		...recentUsers.map((u) => ({
			label: u.name,
			description: "Joined the platform",
			time: u.createdAt,
		})),
		...recentPages.map((p) => ({
			label: p.authorName ?? "Unknown",
			description: `Created "${p.title}"`,
			time: p.createdAt,
		})),
	]
		.sort((a, b) => b.time.getTime() - a.time.getTime())
		.slice(0, 5);

	const userNotifFilter = or(
		eq(notifications.userId, locals.user!.id),
		isNull(notifications.userId)
	);
	const recentNotifications = await db
		.select({
			id: notifications.id,
			title: notifications.title,
			message: notifications.message,
			type: notifications.type,
			read: notifications.read,
			createdAt: notifications.createdAt,
		})
		.from(notifications)
		.where(userNotifFilter)
		.orderBy(desc(notifications.createdAt))
		.limit(5);

	const [publishedCount] = await db
		.select({ count: sql<number>`count(*)::int` })
		.from(pages)
		.where(eq(pages.status, "published"));
	const [editorCount] = await db
		.select({ count: sql<number>`count(*)::int` })
		.from(users)
		.where(eq(users.role, "editor"));

	const pagesByStatus = await db
		.select({
			status: pages.status,
			count: sql<number>`count(*)::int`,
		})
		.from(pages)
		.groupBy(pages.status);

	const sixMonthsAgo = new Date(Date.now() - 180 * 86400000);

	const contentTrend = await db
		.select({
			month: sql<string>`to_char(date_trunc('month', ${pages.createdAt}), 'YYYY-MM') || '-01'`,
			status: pages.status,
			count: sql<number>`count(*)::int`,
		})
		.from(pages)
		.where(gt(pages.createdAt, sixMonthsAgo))
		.groupBy(sql`date_trunc('month', ${pages.createdAt})`, pages.status)
		.orderBy(sql`date_trunc('month', ${pages.createdAt})`);

	const maintenanceSetting = await db.query.appSettings.findFirst({
		where: eq(appSettings.key, "maintenanceMode"),
	});

	return {
		stats: {
			totalUsers: Number(userCount.count),
			activeSessions: 0,
			totalPages: Number(pageCount.count),
			unreadNotifications: Number(unreadCount.count),
		},
		trends: {
			users: calcTrend(Number(usersThisMonth.count), Number(usersLastMonth.count)),
			pages: calcTrend(Number(pagesThisMonth.count), Number(pagesLastMonth.count)),
		},
		roleDistribution,
		monthlySignups,
		recentActivity: activity.map((a) => ({
			...a,
			time: a.time.toISOString(),
		})),
		recentNotifications,
		quickStats: {
			publishedPages: Number(publishedCount.count),
			activeEditors: Number(editorCount.count),
		},
		pagesByStatus,
		contentTrend,
		systemStatus: {
			maintenanceMode: maintenanceSetting?.value === "true",
		},
	};
};
