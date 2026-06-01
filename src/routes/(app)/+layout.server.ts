import { redirect } from "@sveltejs/kit";
import { getPermissions } from "$lib/auth/roles.js";
import {
	buildAppsMenuNav,
	buildCommandPaletteNav,
	buildHomeNavCards,
	buildNavMenuGroups,
} from "$lib/navigation/catalog.js";
import { buildGatewayNavigationFromLeave } from "$lib/server/gateway-launcher.js";
import { permissionsForLeaveRoles } from "$lib/server/one-leave/role-bridge.js";
import { tryLoadMenuCatalogRows, tryLoadUserMenuShortcutIds } from "$lib/server/navigation-menu-load.js";
import { getServiceRoleClient, isServiceRoleConfigured } from "$lib/server/supabase-admin.js";
import { isOneLeaveAppPath, sanitizePostLoginRedirect } from "$lib/server/one-leave/paths.js";
import type { LayoutServerLoad } from "./$types.js";

export const load: LayoutServerLoad = async ({ locals, url }) => {
	if (!locals.user) {
		if (isOneLeaveAppPath(url.pathname)) {
			const returnTo = sanitizePostLoginRedirect(url.pathname + url.search);
			redirect(302, `/login?redirectTo=${encodeURIComponent(returnTo)}`);
		}
		redirect(302, "/login");
	}

	const role = locals.user.role;
	const locale = locals.locale;

	const menuCatalog = await tryLoadMenuCatalogRows();
	let navigation: {
		sidebarGroups: ReturnType<typeof buildNavMenuGroups>;
		commandPaletteNav: ReturnType<typeof buildCommandPaletteNav>;
		appsMenuNav: ReturnType<typeof buildAppsMenuNav>;
		homeNavCards: ReturnType<typeof buildHomeNavCards>;
		shortcutMenuItemIds: string[];
	};

	if (menuCatalog && menuCatalog.groups.length > 0) {
		const { groups, items } = menuCatalog;
		const shortcutMenuItemIds =
			locals.user.authSource === "supabase"
				? ((await tryLoadUserMenuShortcutIds(locals.user.id)) ?? [])
				: [];
		navigation = {
			sidebarGroups: buildNavMenuGroups(locale, role, groups, items),
			commandPaletteNav: buildCommandPaletteNav(locale, role, items),
			appsMenuNav: buildAppsMenuNav(locale, role, items),
			homeNavCards: buildHomeNavCards(locale, role, groups, items),
			shortcutMenuItemIds,
		};
	} else {
		const fromLeave = buildGatewayNavigationFromLeave(locale, role, locals.user.leaveRoles);
		navigation = {
			...fromLeave,
			shortcutMenuItemIds: [],
		};
	}

	let unreadNotificationCount = 0;
	let recentNotifications: {
		id: string;
		title: string;
		message: string;
		type: string;
		createdAt: string;
	}[] = [];

	if (isServiceRoleConfigured() && locals.user.authSource === "supabase") {
		try {
			const admin = getServiceRoleClient();
			const [{ count }, { data: recent }] = await Promise.all([
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
			]);
			unreadNotificationCount = count ?? 0;
			recentNotifications =
				recent?.map((item) => ({
					id: item.id,
					title: item.title,
					message: item.message,
					type: item.type,
					createdAt: item.created_at,
				})) ?? [];
		} catch (err) {
			console.warn("[layout] notifications unavailable", err);
		}
	}

	const permissions =
		locals.user.authSource === "one-leave"
			? permissionsForLeaveRoles(locals.user.leaveRoles)
			: getPermissions(role);

	return {
		user: locals.user,
		locale,
		permissions,
		navigation,
		unreadNotificationCount,
		recentNotifications,
	};
};
