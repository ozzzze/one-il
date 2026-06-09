import { getServiceRoleClient, isServiceRoleConfigured } from "$lib/server/supabase-admin.js";
import type { RawMenuGroupRow, RawMenuItemRow } from "$lib/navigation/catalog.js";

export async function loadMenuCatalogRows(): Promise<{
	groups: RawMenuGroupRow[];
	items: RawMenuItemRow[];
}> {
	const catalog = await tryLoadMenuCatalogRows();
	if (!catalog) {
		return { groups: [], items: [] };
	}
	return catalog;
}

/** Returns null when menu tables or Supabase service role are unavailable (gateway uses static launcher). */
export async function tryLoadMenuCatalogRows(): Promise<{
	groups: RawMenuGroupRow[];
	items: RawMenuItemRow[];
} | null> {
	if (!isServiceRoleConfigured()) return null;
	try {
		const admin = getServiceRoleClient();
		const [{ data: groups, error: groupsError }, { data: items, error: itemsError }] =
			await Promise.all([
				admin
					.from("menu_groups")
					.select("code, label_th, label_en, sort_order, is_active")
					.order("sort_order", { ascending: true }),
				admin
					.from("menu_items")
					.select(
						"id, group_id, parent_id, label_th, label_en, href, icon_key, keywords, required_permission_keys, visibility, implementation_status, sort_order"
					)
					.order("group_id", { ascending: true })
					.order("sort_order", { ascending: true }),
			]);
		if (groupsError || itemsError) {
			console.warn("[menu catalog]", groupsError?.message ?? itemsError?.message);
			return null;
		}
		return {
			groups: (groups ?? []) as RawMenuGroupRow[],
			items: (items ?? []) as RawMenuItemRow[],
		};
	} catch (err) {
		console.warn("[menu catalog]", err);
		return null;
	}
}

export async function loadUserMenuShortcutIds(userId: string): Promise<string[]> {
	const ids = await tryLoadUserMenuShortcutIds(userId);
	return ids ?? [];
}

export async function tryLoadUserMenuShortcutIds(userId: string): Promise<string[] | null> {
	if (!isServiceRoleConfigured()) return null;
	try {
		const admin = getServiceRoleClient();
		const { data, error: qError } = await admin
			.from("user_menu_shortcuts")
			.select("menu_item_id, sort_order")
			.eq("user_id", userId)
			.order("sort_order", { ascending: true });
		if (qError) {
			console.warn("[menu shortcuts]", qError.message);
			return null;
		}
		return (data ?? []).map((r) => r.menu_item_id);
	} catch {
		return null;
	}
}
