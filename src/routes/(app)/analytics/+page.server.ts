import { db } from "$lib/server/db/index.js";
import { users, pages, notifications } from "$lib/server/db/schema.js";
import { sql, eq, desc } from "drizzle-orm";
import type { PageServerLoad } from "./$types.js";

export const load: PageServerLoad = async () => {
	const signupsPerMonth = await db
		.select({
			month: sql<string>`to_char(date_trunc('month', ${users.createdAt}), 'YYYY-MM') || '-01'`,
			count: sql<number>`count(*)::int`,
		})
		.from(users)
		.groupBy(sql`date_trunc('month', ${users.createdAt})`)
		.orderBy(sql`date_trunc('month', ${users.createdAt})`);

	const pagesPerMonth = await db
		.select({
			month: sql<string>`to_char(date_trunc('month', ${pages.createdAt}), 'YYYY-MM') || '-01'`,
			count: sql<number>`count(*)::int`,
		})
		.from(pages)
		.groupBy(sql`date_trunc('month', ${pages.createdAt})`)
		.orderBy(sql`date_trunc('month', ${pages.createdAt})`);

	const pagesByStatus = await db
		.select({
			status: pages.status,
			count: sql<number>`count(*)::int`,
		})
		.from(pages)
		.groupBy(pages.status);

	const notificationsByType = await db
		.select({
			type: notifications.type,
			count: sql<number>`count(*)::int`,
		})
		.from(notifications)
		.groupBy(notifications.type);

	const topAuthors = await db
		.select({
			name: users.name,
			pageCount: sql<number>`count(${pages.id})::int`,
		})
		.from(pages)
		.innerJoin(users, eq(pages.authorId, users.id))
		.groupBy(users.id, users.name)
		.orderBy(desc(sql`count(${pages.id})::int`))
		.limit(10);

	return {
		signupsPerMonth,
		pagesPerMonth,
		pagesByStatus,
		notificationsByType,
		topAuthors,
	};
};
