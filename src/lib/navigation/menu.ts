import type { PermissionKey, Role } from "$lib/auth/roles.js";
import { hasEveryPermission } from "$lib/auth/roles.js";
import { MENU_GROUP_LABELS, MENU_ITEM_LABELS } from "$lib/content/labels.js";

export type IconKey =
	| "analytics"
	| "content"
	| "dashboard"
	| "database"
	| "docs"
	| "gateway"
	| "notifications"
	| "requests"
	| "roles"
	| "settings"
	| "users"
	| "office"
	| "academic"
	| "services";

export type MenuItem = {
	id: string;
	label: string;
	href: string;
	iconKey: IconKey;
	keywords?: string[];
	requiredPermissions?: PermissionKey[];
};

export type MenuGroup = {
	label: string;
	items: MenuItem[];
};

export const menuGroups: MenuGroup[] = [
	{
		label: MENU_GROUP_LABELS.overview,
		items: [
			{
				id: "dashboard",
				label: MENU_ITEM_LABELS.dashboard,
				href: "/",
				iconKey: "dashboard",
				keywords: ["home", "overview", "kpi"],
				requiredPermissions: ["dashboard:view"],
			},
			{
				id: "analytics",
				label: MENU_ITEM_LABELS.analytics,
				href: "/analytics",
				iconKey: "analytics",
				keywords: ["charts", "stats", "reports"],
				requiredPermissions: ["analytics:view"],
			},
		],
	},
	{
		label: MENU_GROUP_LABELS.workflows,
		items: [
			{
				id: "requests",
				label: MENU_ITEM_LABELS.requests,
				href: "/requests",
				iconKey: "requests",
				keywords: ["requests", "ticket", "leave", "booking", "borrow", "forms", "intake"],
				requiredPermissions: ["requests:view_own"],
			},
			{
				id: "gateway",
				label: MENU_ITEM_LABELS.modules,
				href: "/gateway",
				iconKey: "gateway",
				keywords: ["portal", "modules", "module map", "workspace", "gateway", "one-il"],
				requiredPermissions: ["gateway:access"],
			},
		],
	},
	{
		label: MENU_GROUP_LABELS.management,
		items: [
			{
				id: "users",
				label: MENU_ITEM_LABELS.users,
				href: "/users",
				iconKey: "users",
				keywords: ["accounts", "members", "people"],
				requiredPermissions: ["users:manage"],
			},
			{
				id: "content",
				label: MENU_ITEM_LABELS.content,
				href: "/content",
				iconKey: "content",
				keywords: ["pages", "blog", "articles"],
				requiredPermissions: ["content:view"],
			},
			{
				id: "roles",
				label: MENU_ITEM_LABELS.roles,
				href: "/roles",
				iconKey: "roles",
				keywords: ["permissions", "access", "admin"],
				requiredPermissions: ["roles:manage"],
			},
		],
	},
	{
		label: MENU_GROUP_LABELS.system,
		items: [
			{
				id: "notifications",
				label: MENU_ITEM_LABELS.notifications,
				href: "/notifications",
				iconKey: "notifications",
				keywords: ["alerts", "messages"],
				requiredPermissions: ["notifications:view"],
			},
			{
				id: "database",
				label: MENU_ITEM_LABELS.database,
				href: "/database",
				iconKey: "database",
				keywords: ["tables", "sql", "storage"],
				requiredPermissions: ["database:view"],
			},
			{
				id: "settings",
				label: MENU_ITEM_LABELS.settings,
				href: "/settings",
				iconKey: "settings",
				keywords: ["preferences", "profile", "config"],
				requiredPermissions: ["profile:manage"],
			},
			{
				id: "docs",
				label: MENU_ITEM_LABELS.documentation,
				href: "/docs",
				iconKey: "docs",
				keywords: ["help", "guide", "documentation"],
				requiredPermissions: ["profile:manage"],
			},
		],
	},
];

export const commandMenuItems: MenuItem[] = [
	...menuGroups.flatMap((group) => group.items),
	{
		id: "gateway-office",
		label: MENU_ITEM_LABELS.officeModules,
		href: "/gateway",
		iconKey: "office",
		keywords: ["hr", "leave", "welfare", "supply", "asset", "worksheet"],
		requiredPermissions: ["gateway:access"],
	},
	{
		id: "gateway-academic",
		label: MENU_ITEM_LABELS.academicModules,
		href: "/gateway",
		iconKey: "academic",
		keywords: ["student", "advisor", "research", "laboratory", "stock"],
		requiredPermissions: ["gateway:access"],
	},
	{
		id: "gateway-services",
		label: MENU_ITEM_LABELS.sharedServices,
		href: "/gateway",
		iconKey: "services",
		keywords: ["booking", "room", "borrow", "return", "equipment", "academic service"],
		requiredPermissions: ["gateway:access"],
	},
];

export function canAccessMenuItem(role: Role, item: MenuItem): boolean {
	return hasEveryPermission(role, item.requiredPermissions);
}

export function getAllowedMenuIds(role: Role): string[] {
	return commandMenuItems.filter((item) => canAccessMenuItem(role, item)).map((item) => item.id);
}

export function getVisibleMenuGroups(allowedMenuIds: readonly string[]): MenuGroup[] {
	const allowed = new Set(allowedMenuIds);
	return menuGroups
		.map((group) => ({
			...group,
			items: group.items.filter((item) => allowed.has(item.id)),
		}))
		.filter((group) => group.items.length > 0);
}

export function getVisibleCommandItems(allowedMenuIds: readonly string[]): MenuItem[] {
	const allowed = new Set(allowedMenuIds);
	return commandMenuItems.filter((item) => allowed.has(item.id));
}
