import { redirect, error } from "@sveltejs/kit";
import { getServiceRoleClient } from "$lib/server/supabase-admin.js";
import type { LayoutServerLoad } from "./$types.js";

export const load: LayoutServerLoad = async ({ locals }) => {
	if (!locals.user) {
		redirect(302, "/login");
	}
	const admin = getServiceRoleClient();

	// Check maintenance mode
	const { data: maintenanceSetting, error: maintenanceError } = await admin
		.from("app_settings")
		.select("value")
		.eq("key", "maintenanceMode")
		.maybeSingle();
	if (maintenanceError) {
		error(500, "Failed to load application settings");
	}
	if (maintenanceSetting?.value === "true" && locals.user.role !== "admin") {
		error(503, "The application is currently under maintenance. Please check back later.");
	}

	const { count, error: unreadCountError } = await admin
		.from("notifications")
		.select("id", { count: "exact", head: true })
		.eq("read", false)
		.or(`user_id.eq.${locals.user.id},user_id.is.null`);
	if (unreadCountError) {
		error(500, "Failed to load notifications");
	}

	const { data: recentNotifications, error: recentNotificationsError } = await admin
		.from("notifications")
		.select("id,title,message,type,created_at")
		.eq("read", false)
		.or(`user_id.eq.${locals.user.id},user_id.is.null`)
		.order("created_at", { ascending: false })
		.limit(5);
	if (recentNotificationsError) {
		error(500, "Failed to load notifications");
	}

	return {
		user: locals.user,
		unreadNotificationCount: count ?? 0,
		recentNotifications:
			recentNotifications?.map((item) => ({
				id: item.id,
				title: item.title,
				message: item.message,
				type: item.type,
				createdAt: item.created_at,
			})) ?? [],
	};
};
