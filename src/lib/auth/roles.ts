export const roles = ["admin", "editor", "viewer", "user"] as const;

export type Role = (typeof roles)[number];

export type RoleDefinition = {
	name: Role;
	label: string;
	description: string;
	permissions: string[];
};

export const roleOptions: { value: Role; label: string }[] = [
	{ value: "admin", label: "Admin" },
	{ value: "editor", label: "Editor" },
	{ value: "viewer", label: "Viewer" },
	{ value: "user", label: "User" },
];

export const roleDefinitions: RoleDefinition[] = [
	{
		name: "admin",
		label: "Admin",
		description: "Full system access. Can manage users, roles, content, settings, database info, and all requests.",
		permissions: ["Manage users", "Manage roles", "Manage content", "Manage settings", "View database", "Manage all requests"],
	},
	{
		name: "editor",
		label: "Editor",
		description: "Can manage content, view analytics, and work with request queues without system administration.",
		permissions: ["Create content", "Edit content", "Delete content", "View analytics", "Review requests"],
	},
	{
		name: "viewer",
		label: "Viewer",
		description: "Read-only access for dashboards, analytics, content, and personal preferences.",
		permissions: ["View dashboard", "View analytics", "View content", "Edit own profile"],
	},
	{
		name: "user",
		label: "User",
		description: "Standard user access for All Modules and their own requests.",
		permissions: ["View all modules", "Create own requests", "Edit own requests", "Cancel own requests", "Edit own profile"],
	},
];

export const permissionKeys = [
	"dashboard:view",
	"analytics:view",
	"content:view",
	"content:manage",
	"gateway:access",
	"requests:view_own",
	"requests:create",
	"requests:update_own",
	"requests:cancel_own",
	"requests:manage",
	"notifications:view",
	"profile:manage",
	"settings:manage",
	"users:manage",
	"roles:manage",
	"database:view",
] as const;

export type PermissionKey = (typeof permissionKeys)[number];

const rolePermissions = {
	admin: permissionKeys,
	editor: [
		"dashboard:view",
		"analytics:view",
		"content:view",
		"content:manage",
		"gateway:access",
		"requests:view_own",
		"requests:create",
		"requests:update_own",
		"requests:cancel_own",
		"requests:manage",
		"notifications:view",
		"profile:manage",
	],
	viewer: [
		"dashboard:view",
		"analytics:view",
		"content:view",
		"gateway:access",
		"requests:view_own",
		"notifications:view",
		"profile:manage",
	],
	user: [
		"dashboard:view",
		"gateway:access",
		"requests:view_own",
		"requests:create",
		"requests:update_own",
		"requests:cancel_own",
		"notifications:view",
		"profile:manage",
	],
} satisfies Record<Role, readonly PermissionKey[]>;

export function isRole(value: unknown): value is Role {
	return typeof value === "string" && roles.includes(value as Role);
}

export function parseRole(value: unknown, fallback: Role = "viewer"): Role {
	return isRole(value) ? value : fallback;
}

export function getPermissions(role: Role): PermissionKey[] {
	return [...(rolePermissions[role] as readonly PermissionKey[])];
}

export function hasPermission(role: Role, permission: PermissionKey): boolean {
	return (rolePermissions[role] as readonly PermissionKey[]).includes(permission);
}

export function hasEveryPermission(role: Role, permissions: readonly PermissionKey[] = []): boolean {
	return permissions.every((permission) => hasPermission(role, permission));
}
