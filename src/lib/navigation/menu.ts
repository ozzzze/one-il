import type { PermissionKey, Role } from "$lib/auth/roles.js";
import type { Pathname } from "$app/types";
import { hasEveryPermission } from "$lib/auth/roles.js";
import { getMenuGroupLabels, getMenuItemLabels } from "$lib/content/labels.js";
import { DEFAULT_LOCALE, type Locale } from "$lib/i18n/locales.js";

export type IconKey =
	| "analytics"
	| "content"
	| "dashboard"
	| "database"
	| "docs"
	| "gateway"
	| "notifications"
	| "requests"
	| "room"
	| "roles"
	| "settings"
	| "users"
	| "employees"
	| "organization"
	| "office"
	| "academic"
	| "services";

export type MenuItem = {
	id: string;
	label: string;
	href: Pathname;
	iconKey: IconKey;
	keywords?: string[];
	requiredPermissions?: PermissionKey[];
};

export type MenuGroup = {
	label: string;
	items: MenuItem[];
};

export function getMenuGroups(locale: Locale): MenuGroup[] {
	const groupLabels = getMenuGroupLabels(locale);
	const itemLabels = getMenuItemLabels(locale);

	return [
		{
			label: groupLabels.overview,
			items: [
				{
					id: "dashboard",
					label: itemLabels.dashboard,
					href: "/",
					iconKey: "dashboard",
					keywords: ["home", "overview", "kpi"],
					requiredPermissions: ["dashboard:view"],
				},
				{
					id: "analytics",
					label: itemLabels.analytics,
					href: "/analytics",
					iconKey: "analytics",
					keywords: ["charts", "stats", "reports"],
					requiredPermissions: ["analytics:view"],
				},
			],
		},
		{
			label: groupLabels.workflows,
			items: [
				{
					id: "requests",
					label: itemLabels.requests,
					href: "/requests",
					iconKey: "requests",
					keywords: ["requests", "ticket", "leave", "booking", "borrow", "forms", "intake"],
					requiredPermissions: ["requests:view_own"],
				},
				{
					id: "gateway",
					label: itemLabels.modules,
					href: "/gateway",
					iconKey: "gateway",
					keywords: ["portal", "modules", "module map", "workspace", "gateway", "one-il"],
					requiredPermissions: ["gateway:access"],
				},
			],
		},
		{
			label: groupLabels.management,
			items: [
				{
					id: "users",
					label: itemLabels.users,
					href: "/users",
					iconKey: "users",
					keywords: ["accounts", "members", "people"],
					requiredPermissions: ["users:manage"],
				},
				{
					id: "employees",
					label: itemLabels.employees,
					href: "/employees",
					iconKey: "employees",
					keywords: ["employee", "personnel", "organization", "supervisor", "assignment"],
					requiredPermissions: ["employees:manage"],
				},
				{
					id: "organization",
					label: itemLabels.organization,
					href: "/organization/positions",
					iconKey: "organization",
					keywords: [
						"organization",
						"structure",
						"position",
						"org unit",
						"department",
						"ตำแหน่ง",
						"หน่วยงาน",
						"องค์กร",
					],
					requiredPermissions: ["organization:manage"],
				},
				{
					id: "content",
					label: itemLabels.content,
					href: "/content",
					iconKey: "content",
					keywords: ["pages", "blog", "articles"],
					requiredPermissions: ["content:view"],
				},
				{
					id: "roles",
					label: itemLabels.roles,
					href: "/roles",
					iconKey: "roles",
					keywords: ["permissions", "access", "admin"],
					requiredPermissions: ["roles:manage"],
				},
			],
		},
		{
			label: groupLabels.system,
			items: [
				{
					id: "notifications",
					label: itemLabels.notifications,
					href: "/notifications",
					iconKey: "notifications",
					keywords: ["alerts", "messages"],
					requiredPermissions: ["notifications:view"],
				},
				{
					id: "database",
					label: itemLabels.database,
					href: "/database",
					iconKey: "database",
					keywords: ["tables", "sql", "storage"],
					requiredPermissions: ["database:view"],
				},
				{
					id: "settings",
					label: itemLabels.settings,
					href: "/settings",
					iconKey: "settings",
					keywords: ["preferences", "profile", "config"],
					requiredPermissions: ["profile:manage"],
				},
				{
					id: "docs",
					label: itemLabels.documentation,
					href: "/docs",
					iconKey: "docs",
					keywords: ["help", "guide", "documentation"],
					requiredPermissions: ["profile:manage"],
				},
				{
					id: "room-booking",
					label: itemLabels.roomBooking,
					href: "/room-booking",
					iconKey: "room",
					keywords: ["room", "booking", "meeting", "module mockup"],
					requiredPermissions: ["requests:create"],
				},
			],
		},
	];
}

export function getCommandMenuItems(locale: Locale): MenuItem[] {
	const itemLabels = getMenuItemLabels(locale);

	return [
		...getMenuGroups(locale).flatMap((group) => group.items),
		{
			id: "gateway-office",
			label: itemLabels.officeModules,
			href: "/gateway",
			iconKey: "office",
			keywords: ["hr", "leave", "welfare", "supply", "asset", "worksheet"],
			requiredPermissions: ["gateway:access"],
		},
		{
			id: "gateway-academic",
			label: itemLabels.academicModules,
			href: "/gateway",
			iconKey: "academic",
			keywords: ["student", "advisor", "research", "laboratory", "stock"],
			requiredPermissions: ["gateway:access"],
		},
		{
			id: "gateway-services",
			label: itemLabels.sharedServices,
			href: "/gateway",
			iconKey: "services",
			keywords: ["booking", "room", "borrow", "return", "equipment", "academic service"],
			requiredPermissions: ["gateway:access"],
		},
	];
}

export function canAccessMenuItem(role: Role, item: MenuItem): boolean {
	return hasEveryPermission(role, item.requiredPermissions);
}

export function getAllowedMenuIds(role: Role): string[] {
	return getCommandMenuItems(DEFAULT_LOCALE)
		.filter((item) => canAccessMenuItem(role, item))
		.map((item) => item.id);
}

export function getVisibleMenuGroups(allowedMenuIds: readonly string[], locale: Locale): MenuGroup[] {
	const allowed = new Set(allowedMenuIds);
	return getMenuGroups(locale)
		.map((group) => ({
			...group,
			items: group.items.filter((item) => allowed.has(item.id)),
		}))
		.filter((group) => group.items.length > 0);
}

export function getVisibleCommandItems(allowedMenuIds: readonly string[], locale: Locale): MenuItem[] {
	const allowed = new Set(allowedMenuIds);
	return getCommandMenuItems(locale).filter((item) => allowed.has(item.id));
}
