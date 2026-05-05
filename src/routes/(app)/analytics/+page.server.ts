import { getServiceRoleClient } from "$lib/server/supabase-admin.js";
import type { PageServerLoad } from "./$types.js";

export const load: PageServerLoad = async () => {
	const admin = getServiceRoleClient();
	const [userRowsRes, pageRowsRes, notificationRowsRes, topAuthorsRes] = await Promise.all([
		admin.from("users").select("created_at,name,id"),
		admin.from("pages").select("created_at,status,author_id,id"),
		admin.from("notifications").select("type"),
		admin.from("users").select("id,name"),
	]);
	if (userRowsRes.error || pageRowsRes.error || notificationRowsRes.error || topAuthorsRes.error) {
		return {
			signupsPerMonth: [],
			pagesPerMonth: [],
			pagesByStatus: [],
			notificationsByType: [],
			topAuthors: [],
		};
	}

	const signupsByMonth = new Map<string, number>();
	for (const user of userRowsRes.data ?? []) {
		const month = new Date(user.created_at).toISOString().slice(0, 7) + "-01";
		signupsByMonth.set(month, (signupsByMonth.get(month) ?? 0) + 1);
	}
	const signupsPerMonth = [...signupsByMonth.entries()]
		.map(([month, count]) => ({ month, count }))
		.sort((a, b) => a.month.localeCompare(b.month));

	const pagesByMonth = new Map<string, number>();
	const statusCount = new Map<string, number>();
	const authorPageCount = new Map<string, number>();
	for (const page of pageRowsRes.data ?? []) {
		const month = new Date(page.created_at).toISOString().slice(0, 7) + "-01";
		pagesByMonth.set(month, (pagesByMonth.get(month) ?? 0) + 1);
		statusCount.set(page.status, (statusCount.get(page.status) ?? 0) + 1);
		authorPageCount.set(page.author_id, (authorPageCount.get(page.author_id) ?? 0) + 1);
	}
	const pagesPerMonth = [...pagesByMonth.entries()]
		.map(([month, count]) => ({ month, count }))
		.sort((a, b) => a.month.localeCompare(b.month));
	const pagesByStatus = [...statusCount.entries()].map(([status, count]) => ({ status, count }));

	const notificationCounts = new Map<string, number>();
	for (const row of notificationRowsRes.data ?? []) {
		notificationCounts.set(row.type, (notificationCounts.get(row.type) ?? 0) + 1);
	}
	const notificationsByType = [...notificationCounts.entries()].map(([type, count]) => ({ type, count }));

	const usersById = new Map((topAuthorsRes.data ?? []).map((u) => [u.id, u.name]));
	const topAuthors = [...authorPageCount.entries()]
		.map(([id, pageCount]) => ({ name: usersById.get(id) ?? "Unknown", pageCount }))
		.sort((a, b) => b.pageCount - a.pageCount)
		.slice(0, 10);

	return {
		signupsPerMonth,
		pagesPerMonth,
		pagesByStatus,
		notificationsByType,
		topAuthors,
	};
};
