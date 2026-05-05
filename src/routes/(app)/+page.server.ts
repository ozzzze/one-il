import { getServiceRoleClient } from "$lib/server/supabase-admin.js";
import type { PageServerLoad } from "./$types.js";

export const load: PageServerLoad = async ({ locals }) => {
	const admin = getServiceRoleClient();
	const thisMonthStart = new Date();
	thisMonthStart.setDate(1);
	thisMonthStart.setHours(0, 0, 0, 0);
	const lastMonthStart = new Date(thisMonthStart);
	lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
	const sixMonthsAgo = new Date(Date.now() - 180 * 86400000);

	const [
		{ count: userCount, error: userCountError },
		{ count: pageCount, error: pageCountError },
		{ count: unreadCount, error: unreadCountError },
		{ count: usersThisMonth, error: usersThisMonthError },
		{ count: usersLastMonth, error: usersLastMonthError },
		{ count: pagesThisMonth, error: pagesThisMonthError },
		{ count: pagesLastMonth, error: pagesLastMonthError },
	] = await Promise.all([
		admin.from("users").select("id", { count: "exact", head: true }),
		admin.from("pages").select("id", { count: "exact", head: true }),
		admin.from("notifications").select("id", { count: "exact", head: true }).eq("read", false),
		admin.from("users").select("id", { count: "exact", head: true }).gte("created_at", thisMonthStart.toISOString()),
		admin
			.from("users")
			.select("id", { count: "exact", head: true })
			.gte("created_at", lastMonthStart.toISOString())
			.lt("created_at", thisMonthStart.toISOString()),
		admin.from("pages").select("id", { count: "exact", head: true }).gte("created_at", thisMonthStart.toISOString()),
		admin
			.from("pages")
			.select("id", { count: "exact", head: true })
			.gte("created_at", lastMonthStart.toISOString())
			.lt("created_at", thisMonthStart.toISOString()),
	]);

	if (
		userCountError ||
		pageCountError ||
		unreadCountError ||
		usersThisMonthError ||
		usersLastMonthError ||
		pagesThisMonthError ||
		pagesLastMonthError
	) {
		throw new Error("Failed to load dashboard stats");
	}

	function calcTrend(current: number, previous: number) {
		if (previous === 0) return current > 0 ? 100 : 0;
		return Math.round(((current - previous) / previous) * 100);
	}

	const { data: roleRows, error: roleRowsError } = await admin.from("users").select("role");
	if (roleRowsError) throw new Error("Failed to load role distribution");
	const roleCounts = new Map<string, number>();
	for (const row of roleRows ?? []) {
		if (!row.role) continue;
		roleCounts.set(row.role, (roleCounts.get(row.role) ?? 0) + 1);
	}
	const roleDistribution = [...roleCounts.entries()].map(([role, count]) => ({ role, count }));

	const { data: signupRows, error: signupRowsError } = await admin.from("users").select("created_at");
	if (signupRowsError) throw new Error("Failed to load monthly signups");
	const signupByMonth = new Map<string, number>();
	for (const row of signupRows ?? []) {
		if (!row.created_at) continue;
		const month = new Date(row.created_at).toISOString().slice(0, 7) + "-01";
		signupByMonth.set(month, (signupByMonth.get(month) ?? 0) + 1);
	}
	const monthlySignups = [...signupByMonth.entries()]
		.map(([month, count]) => ({ month, count }))
		.sort((a, b) => a.month.localeCompare(b.month));

	const { data: recentUsers, error: recentUsersError } = await admin
		.from("users")
		.select("name,created_at")
		.order("created_at", { ascending: false })
		.limit(5);
	if (recentUsersError) throw new Error("Failed to load recent users");

	const { data: recentPages, error: recentPagesError } = await admin
		.from("pages")
		.select("title,created_at,users:author_id(name)")
		.order("created_at", { ascending: false })
		.limit(5);
	if (recentPagesError) throw new Error("Failed to load recent pages");

	type ActivityItem = { label: string; description: string; time: Date };

	const activity: ActivityItem[] = [
		...(recentUsers ?? []).map((u) => ({
			label: u.name,
			description: "Joined the platform",
			time: new Date(u.created_at),
		})),
		...(recentPages ?? []).map((p) => ({
			label: Array.isArray(p.users) ? (p.users[0]?.name ?? "Unknown") : "Unknown",
			description: `Created "${p.title}"`,
			time: new Date(p.created_at),
		})),
	]
		.sort((a, b) => b.time.getTime() - a.time.getTime())
		.slice(0, 5);

	const { data: recentNotifications, error: recentNotificationsError } = await admin
		.from("notifications")
		.select("id,title,message,type,read,created_at")
		.or(`user_id.eq.${locals.user!.id},user_id.is.null`)
		.order("created_at", { ascending: false })
		.limit(5);
	if (recentNotificationsError) throw new Error("Failed to load recent notifications");

	const [
		{ count: publishedCount, error: publishedCountError },
		{ count: editorCount, error: editorCountError },
		{ data: pagesByStatusRows, error: pagesByStatusError },
		{ data: contentRows, error: contentRowsError },
		{ data: maintenanceSetting, error: maintenanceError },
	] = await Promise.all([
		admin.from("pages").select("id", { count: "exact", head: true }).eq("status", "published"),
		admin.from("users").select("id", { count: "exact", head: true }).eq("role", "editor"),
		admin.from("pages").select("status"),
		admin.from("pages").select("status,created_at").gt("created_at", sixMonthsAgo.toISOString()),
		admin.from("app_settings").select("value").eq("key", "maintenanceMode").maybeSingle(),
	]);
	if (
		publishedCountError ||
		editorCountError ||
		pagesByStatusError ||
		contentRowsError ||
		maintenanceError
	) {
		throw new Error("Failed to load dashboard details");
	}

	const pageStatusCounts = new Map<string, number>();
	for (const row of pagesByStatusRows ?? []) {
		if (!row.status) continue;
		pageStatusCounts.set(row.status, (pageStatusCounts.get(row.status) ?? 0) + 1);
	}
	const pagesByStatus = [...pageStatusCounts.entries()].map(([status, count]) => ({ status, count }));

	const contentTrendCounts = new Map<string, number>();
	for (const row of contentRows ?? []) {
		if (!row.created_at || !row.status) continue;
		const month = new Date(row.created_at).toISOString().slice(0, 7) + "-01";
		const key = `${month}|${row.status}`;
		contentTrendCounts.set(key, (contentTrendCounts.get(key) ?? 0) + 1);
	}
	const contentTrend = [...contentTrendCounts.entries()]
		.map(([key, count]) => {
			const [month, status] = key.split("|");
			return { month, status, count };
		})
		.sort((a, b) => a.month.localeCompare(b.month));

	return {
		stats: {
			totalUsers: Number(userCount ?? 0),
			activeSessions: 0,
			totalPages: Number(pageCount ?? 0),
			unreadNotifications: Number(unreadCount ?? 0),
		},
		trends: {
			users: calcTrend(Number(usersThisMonth ?? 0), Number(usersLastMonth ?? 0)),
			pages: calcTrend(Number(pagesThisMonth ?? 0), Number(pagesLastMonth ?? 0)),
		},
		roleDistribution,
		monthlySignups,
		recentActivity: activity.map((a) => ({
			...a,
			time: a.time.toISOString(),
		})),
		recentNotifications:
			recentNotifications?.map((n) => ({
				id: n.id,
				title: n.title,
				message: n.message,
				type: n.type,
				read: n.read,
				createdAt: n.created_at,
			})) ?? [],
		quickStats: {
			publishedPages: Number(publishedCount ?? 0),
			activeEditors: Number(editorCount ?? 0),
		},
		pagesByStatus,
		contentTrend,
		systemStatus: {
			maintenanceMode: maintenanceSetting?.value === "true",
		},
	};
};
