import { error } from "@sveltejs/kit";
import type { SessionUser } from "$lib/server/auth.js";
import { getServiceRoleClient } from "$lib/server/supabase-admin.js";
import { filterCatalogRowsForRole } from "$lib/navigation/catalog.js";
import { loadMenuCatalogRows } from "$lib/server/navigation-menu-load.js";

export const MAX_MENU_SHORTCUTS = 32;

export async function userCanSeeMenuItem(user: SessionUser, menuItemId: string): Promise<boolean> {
	const { items } = await loadMenuCatalogRows();
	const visible = filterCatalogRowsForRole(user.role, items);
	return visible.some((row) => row.id === menuItemId);
}

export async function countShortcuts(userId: string): Promise<number> {
	const admin = getServiceRoleClient();
	const { count, error: cError } = await admin
		.from("user_menu_shortcuts")
		.select("id", { count: "exact", head: true })
		.eq("user_id", userId);
	if (cError) {
		console.error(cError);
		error(500, "Failed to count shortcuts");
	}
	return count ?? 0;
}

export async function insertShortcut(userId: string, menuItemId: string): Promise<{ ok: true } | { ok: false; reason: "limit" | "duplicate" }> {
	const n = await countShortcuts(userId);
	if (n >= MAX_MENU_SHORTCUTS) return { ok: false, reason: "limit" };
	const admin = getServiceRoleClient();
	const { error: insError } = await admin.from("user_menu_shortcuts").insert({
		user_id: userId,
		menu_item_id: menuItemId,
		sort_order: n,
	});
	if (insError) {
		if (insError.code === "23505") return { ok: false, reason: "duplicate" };
		console.error(insError);
		error(500, "Failed to save shortcut");
	}
	return { ok: true };
}

export async function deleteShortcut(userId: string, menuItemId: string): Promise<void> {
	const admin = getServiceRoleClient();
	const { error: delError } = await admin
		.from("user_menu_shortcuts")
		.delete()
		.eq("user_id", userId)
		.eq("menu_item_id", menuItemId);
	if (delError) {
		console.error(delError);
		error(500, "Failed to remove shortcut");
	}
}

export async function deleteAllShortcuts(userId: string): Promise<void> {
	const admin = getServiceRoleClient();
	const { error: delError } = await admin.from("user_menu_shortcuts").delete().eq("user_id", userId);
	if (delError) {
		console.error(delError);
		error(500, "Failed to clear shortcuts");
	}
}
