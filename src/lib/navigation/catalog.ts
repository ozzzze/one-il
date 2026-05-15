import type { Role, PermissionKey } from "$lib/auth/roles.js";
import { hasEveryPermission, permissionKeys } from "$lib/auth/roles.js";
import type { Locale } from "$lib/i18n/locales.js";
import { localizedDualField } from "$lib/i18n/display.js";

export type MenuItemVisibility = "standard" | "admin_only";
export type MenuItemImplementationStatus = "live" | "planned";

export type RawMenuGroupRow = {
	code: string;
	label_th: string;
	label_en: string;
	sort_order: number;
	is_active: boolean;
};

export type RawMenuItemRow = {
	id: string;
	group_id: string;
	parent_id: string | null;
	label_th: string;
	label_en: string;
	href: string | null;
	icon_key: string | null;
	keywords: string[] | null;
	required_permission_keys: string[];
	visibility: MenuItemVisibility;
	implementation_status: MenuItemImplementationStatus;
	sort_order: number;
};

export type LockReason = "no_permission" | "planned" | null;

export type NavMenuItem = {
	id: string;
	label: string;
	href: string | null;
	iconKey: string;
	keywords: string[];
	accessible: boolean;
	lockReason: LockReason;
	children: NavMenuItem[];
};

export type NavMenuGroup = {
	code: string;
	label: string;
	items: NavMenuItem[];
};

export type CommandNavEntry = {
	id: string;
	label: string;
	href: string;
	iconKey: string;
	keywords: string[];
};

export type HomeNavCard = {
	id: string;
	label: string;
	href: string | null;
	iconKey: string;
	keywords: string[];
	accessible: boolean;
	lockReason: LockReason;
	groupLabel: string;
};

const permissionKeySet = new Set<string>(permissionKeys);

function asPermissionKeys(keys: readonly string[]): PermissionKey[] {
	return keys.filter((k): k is PermissionKey => permissionKeySet.has(k));
}

/** Items visible in catalog for this role (admin_only stripped for non-admin). */
export function filterCatalogRowsForRole(role: Role, items: readonly RawMenuItemRow[]): RawMenuItemRow[] {
	if (role === "admin") return [...items];
	return items.filter((row) => row.visibility !== "admin_only");
}

export function evaluateMenuItemAccess(
	role: Role,
	item: RawMenuItemRow,
): { accessible: boolean; lockReason: LockReason } {
	if (item.implementation_status === "planned" || !item.href) {
		return { accessible: false, lockReason: "planned" };
	}
	const keys = asPermissionKeys(item.required_permission_keys);
	if (!hasEveryPermission(role, keys)) {
		return { accessible: false, lockReason: "no_permission" };
	}
	return { accessible: true, lockReason: null };
}

/** Ids the user may navigate to (live + permissions). */
export function getAccessibleMenuItemIds(role: Role, items: readonly RawMenuItemRow[]): string[] {
	const visible = filterCatalogRowsForRole(role, items);
	return visible
		.filter((item) => {
			const { accessible } = evaluateMenuItemAccess(role, item);
			return accessible;
		})
		.map((item) => item.id);
}

function labelFor(locale: Locale, row: RawMenuItemRow): string {
	return localizedDualField(locale, row.label_th, row.label_en);
}

function groupLabelFor(locale: Locale, row: RawMenuGroupRow): string {
	return localizedDualField(locale, row.label_th, row.label_en);
}

function buildItemTree(locale: Locale, role: Role, groupItems: RawMenuItemRow[]): NavMenuItem[] {
	const byParent = new Map<string | null, RawMenuItemRow[]>();
	for (const it of groupItems) {
		const key = it.parent_id;
		const list = byParent.get(key) ?? [];
		list.push(it);
		byParent.set(key, list);
	}
	for (const list of byParent.values()) {
		list.sort((a, b) => a.sort_order - b.sort_order);
	}

	function toNav(row: RawMenuItemRow): NavMenuItem {
		const { accessible, lockReason } = evaluateMenuItemAccess(role, row);
		const kids = (byParent.get(row.id) ?? []).map(toNav);
		return {
			id: row.id,
			label: labelFor(locale, row),
			href: row.href,
			iconKey: row.icon_key ?? "dashboard",
			keywords: row.keywords ?? [],
			accessible,
			lockReason,
			children: kids,
		};
	}

	const roots = byParent.get(null) ?? [];
	return roots.map(toNav);
}

export function buildNavMenuGroups(
	locale: Locale,
	role: Role,
	groups: readonly RawMenuGroupRow[],
	items: readonly RawMenuItemRow[],
): NavMenuGroup[] {
	const visibleItems = filterCatalogRowsForRole(role, items);
	const itemsByGroup = new Map<string, RawMenuItemRow[]>();
	for (const it of visibleItems) {
		const list = itemsByGroup.get(it.group_id) ?? [];
		list.push(it);
		itemsByGroup.set(it.group_id, list);
	}

	const sortedGroups = [...groups].filter((g) => g.is_active).sort((a, b) => a.sort_order - b.sort_order);

	const result: NavMenuGroup[] = [];
	for (const g of sortedGroups) {
		const groupItems = itemsByGroup.get(g.code) ?? [];
		if (groupItems.length === 0) continue;
		const tree = buildItemTree(locale, role, groupItems);
		result.push({
			code: g.code,
			label: groupLabelFor(locale, g),
			items: tree,
		});
	}
	return result;
}

export function buildCommandPaletteNav(
	locale: Locale,
	role: Role,
	items: readonly RawMenuItemRow[],
): CommandNavEntry[] {
	const visible = filterCatalogRowsForRole(role, items);
	const out: CommandNavEntry[] = [];
	for (const row of visible) {
		if (row.implementation_status !== "live") continue;
		const { accessible, lockReason } = evaluateMenuItemAccess(role, row);
		if (!accessible || lockReason !== null) continue;
		if (!row.href) continue;
		out.push({
			id: row.id,
			label: labelFor(locale, row),
			href: row.href,
			iconKey: row.icon_key ?? "dashboard",
			keywords: row.keywords ?? [],
		});
	}
	out.sort((a, b) => a.label.localeCompare(b.label));
	return out;
}

/** Apps grid: one tile per href (first row wins by sort_order). */
export function buildAppsMenuNav(locale: Locale, role: Role, items: readonly RawMenuItemRow[]): CommandNavEntry[] {
	const command = buildCommandPaletteNav(locale, role, items);
	const byHref = new Map<string, CommandNavEntry>();
	for (const entry of command) {
		if (!byHref.has(entry.href)) {
			byHref.set(entry.href, entry);
		}
	}
	return [...byHref.values()].sort((a, b) => a.label.localeCompare(b.label));
}

export function buildHomeNavCards(
	locale: Locale,
	role: Role,
	groups: readonly RawMenuGroupRow[],
	items: readonly RawMenuItemRow[],
): HomeNavCard[] {
	const visible = filterCatalogRowsForRole(role, items);
	const groupMap = new Map(groups.map((g) => [g.code, g]));
	const decorated = visible.map((row) => ({
		row,
		groupOrder: groupMap.get(row.group_id)?.sort_order ?? 999,
	}));
	decorated.sort((a, b) => a.groupOrder - b.groupOrder || a.row.sort_order - b.row.sort_order);

	const cards: HomeNavCard[] = [];
	for (const { row } of decorated) {
		const g = groupMap.get(row.group_id);
		const groupLabel = g ? groupLabelFor(locale, g) : row.group_id;
		const { accessible, lockReason } = evaluateMenuItemAccess(role, row);
		cards.push({
			id: row.id,
			label: labelFor(locale, row),
			href: row.href,
			iconKey: row.icon_key ?? "dashboard",
			keywords: row.keywords ?? [],
			accessible,
			lockReason,
			groupLabel,
		});
	}
	return cards;
}

export function orderHomeCardsByShortcuts(
	cards: readonly HomeNavCard[],
	shortcutIds: readonly string[],
): HomeNavCard[] {
	if (shortcutIds.length === 0) return [...cards];
	const map = new Map(cards.map((c) => [c.id, c]));
	const ordered: HomeNavCard[] = [];
	for (const id of shortcutIds) {
		const c = map.get(id);
		if (c) ordered.push(c);
	}
	return ordered;
}
