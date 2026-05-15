import { redirect, error } from "@sveltejs/kit";
import { getServiceRoleClient } from "$lib/server/supabase-admin.js";
import { getPermissions } from "$lib/auth/roles.js";
import {
	buildAppsMenuNav,
	buildCommandPaletteNav,
	buildHomeNavCards,
	buildNavMenuGroups,
} from "$lib/navigation/catalog.js";
import { loadMenuCatalogRows, loadUserMenuShortcutIds } from "$lib/server/navigation-menu-load.js";
import type { LayoutServerLoad } from "./$types.js";

export const load: LayoutServerLoad = async ({ locals }) => {
	if (!locals.user) {
		redirect(302, "/login");
	}
	const admin = getServiceRoleClient();

	const [
		{ data: maintenanceSetting, error: maintenanceError },
		{ count, error: unreadCountError },
		{ data: recentNotifications, error: recentNotificationsError },
		menuCatalog,
		shortcutMenuItemIds,
	] = await Promise.all([
		admin.from("app_settings").select("value").eq("key", "maintenanceMode").maybeSingle(),
		admin
			.from("notifications")
			.select("id", { count: "exact", head: true })
			.eq("read", false)
			.or(`user_id.eq.${locals.user.id},user_id.is.null`),
		admin
			.from("notifications")
			.select("id,title,message,type,created_at")
			.eq("read", false)
			.or(`user_id.eq.${locals.user.id},user_id.is.null`)
			.order("created_at", { ascending: false })
			.limit(5),
		loadMenuCatalogRows(),
		loadUserMenuShortcutIds(locals.user.id),
	]);

	if (maintenanceError) {
		error(500, "Failed to load application settings");
	}
	if (maintenanceSetting?.value === "true" && locals.user.role !== "admin") {
		error(503, "The application is currently under maintenance. Please check back later.");
	}
	if (unreadCountError) {
		error(500, "Failed to load notifications");
	}
	if (recentNotificationsError) {
		error(500, "Failed to load notifications");
	}

	const role = locals.user.role;
	const locale = locals.locale;
	const { groups, items } = menuCatalog;

	const navigation = {
		sidebarGroups: buildNavMenuGroups(locale, role, groups, items),
		commandPaletteNav: buildCommandPaletteNav(locale, role, items),
		appsMenuNav: buildAppsMenuNav(locale, role, items),
		homeNavCards: buildHomeNavCards(locale, role, groups, items),
		shortcutMenuItemIds,
	};

	return {
		user: locals.user,
		locale,
		permissions: getPermissions(role),
		navigation,
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
