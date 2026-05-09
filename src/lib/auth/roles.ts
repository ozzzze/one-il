export const roles = ["admin", "editor", "viewer", "user"] as const;
import type { Locale } from "$lib/i18n/locales.js";

export type Role = (typeof roles)[number];

export type RoleDefinition = {
	name: Role;
	label: string;
	description: string;
	permissions: string[];
};

const roleCopy = {
	en: {
		admin: {
			label: "Admin",
			description: "Full system access. Can manage users, roles, content, settings, database info, and all requests.",
			permissions: ["Manage users", "Manage roles", "Manage content", "Manage settings", "View database", "Manage all requests"],
		},
		editor: {
			label: "Editor",
			description: "Can manage content, view analytics, and work with request queues without system administration.",
			permissions: ["Create content", "Edit content", "Delete content", "View analytics", "Review requests"],
		},
		viewer: {
			label: "Viewer",
			description: "Read-only access for dashboards, analytics, content, and personal preferences.",
			permissions: ["View dashboard", "View analytics", "View content", "Edit own profile"],
		},
		user: {
			label: "User",
			description: "Standard user access for all modules and their own requests.",
			permissions: ["View all modules", "Create own requests", "Edit own requests", "Cancel own requests", "Edit own profile"],
		},
	},
	th: {
		admin: {
			label: "ผู้ดูแลระบบ",
			description: "เข้าถึงระบบทั้งหมด จัดการผู้ใช้ บทบาท เนื้อหา การตั้งค่า ข้อมูลฐานข้อมูล และคำขอทั้งหมดได้",
			permissions: [
				"จัดการผู้ใช้",
				"จัดการบทบาท",
				"จัดการเนื้อหา",
				"จัดการการตั้งค่า",
				"ดูข้อมูลฐานข้อมูล",
				"จัดการคำขอทั้งหมด",
			],
		},
		editor: {
			label: "บรรณาธิการ",
			description: "จัดการเนื้อหา ดูข้อมูลวิเคราะห์ และทำงานกับคิวคำขอได้ โดยไม่ต้องดูแลระบบ",
			permissions: ["สร้างเนื้อหา", "แก้ไขเนื้อหา", "ลบเนื้อหา", "ดูข้อมูลวิเคราะห์", "ตรวจสอบคำขอ"],
		},
		viewer: {
			label: "ผู้ดู",
			description: "สิทธิ์แบบอ่านอย่างเดียวสำหรับแดชบอร์ด ข้อมูลวิเคราะห์ เนื้อหา และการตั้งค่าส่วนตัว",
			permissions: ["ดูแดชบอร์ด", "ดูข้อมูลวิเคราะห์", "ดูเนื้อหา", "แก้ไขโปรไฟล์ตนเอง"],
		},
		user: {
			label: "ผู้ใช้งาน",
			description: "สิทธิ์ใช้งานทั่วไปสำหรับทุกโมดูลและคำขอของตนเอง",
			permissions: ["ดูทุกโมดูล", "สร้างคำขอของตนเอง", "แก้ไขคำขอของตนเอง", "ยกเลิกคำขอของตนเอง", "แก้ไขโปรไฟล์ตนเอง"],
		},
	},
} satisfies Record<Locale, Record<Role, { label: string; description: string; permissions: string[] }>>;

export function getRoleOptions(locale: Locale): { value: Role; label: string }[] {
	return roles.map((role) => ({ value: role, label: roleCopy[locale][role].label }));
}

export function getRoleDefinitions(locale: Locale): RoleDefinition[] {
	return roles.map((role) => ({
		name: role,
		label: roleCopy[locale][role].label,
		description: roleCopy[locale][role].description,
		permissions: [...roleCopy[locale][role].permissions],
	}));
}

export function getRoleLabel(role: Role, locale: Locale): string {
	return roleCopy[locale][role].label;
}

export const roleOptions: { value: Role; label: string }[] = getRoleOptions("en");
export const roleDefinitions: RoleDefinition[] = getRoleDefinitions("en");

export const permissionKeys = [
	"dashboard:view",
	"analytics:view",
	"content:view",
	"content:manage",
	"gateway:access",
	"employees:manage",
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
