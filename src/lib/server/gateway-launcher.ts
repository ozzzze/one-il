import type { Locale } from "$lib/i18n/locales.js";
import type { Role } from "$lib/auth/roles.js";
import { hasPermission } from "$lib/auth/roles.js";
import type {
	CommandNavEntry,
	HomeNavCard,
	NavMenuGroup,
	NavMenuItem,
} from "$lib/navigation/catalog.js";
import type { LeaveRoleCode } from "$lib/server/one-leave/types.js";

type LauncherModule = {
	id: string;
	titleTh: string;
	titleEn: string;
	descriptionTh: string;
	descriptionEn: string;
	/** Path under reverse-proxy mount (e.g. `/leave/leave` for one-leave `/leave`). */
	href: string;
	groupTh: string;
	groupEn: string;
	groupCode: string;
	iconKey: string;
	leaveRoles?: readonly LeaveRoleCode[];
	/** Gateway-only tile (no /leave prefix). */
	gatewayOnly?: boolean;
};

const LEAVE_BASE = "/leave";

function leaveHref(path: string): string {
	if (path === "/") return LEAVE_BASE;
	return `${LEAVE_BASE}${path}`;
}

/** Keep in sync with one-leave `APP_MODULES` (proxy paths). */
const LAUNCHER_MODULES: readonly LauncherModule[] = [
	{
		id: "leave-app",
		titleTh: "ระบบลาและบันทึกงาน",
		titleEn: "Leave & work activity",
		descriptionTh: "เข้าสู่แอป one-leave — ใบลา อนุมัติ องค์กร",
		descriptionEn: "Open one-leave — leave, approvals, org",
		href: leaveHref("/"),
		groupTh: "แอปพลิเคชัน",
		groupEn: "Applications",
		groupCode: "apps",
		iconKey: "calendar",
	},
	{
		id: "leave-list",
		titleTh: "รายการใบลา",
		titleEn: "Leave requests",
		descriptionTh: "ดูและติดตามใบลา",
		descriptionEn: "View and track leave requests",
		href: leaveHref("/leave"),
		groupTh: "ใบลา",
		groupEn: "Leave",
		groupCode: "leave",
		iconKey: "calendar",
	},
	{
		id: "leave-approvals",
		titleTh: "คิวตรวจสอบ / อนุญาต",
		titleEn: "Approvals queue",
		descriptionTh: "HR และผู้อนุมัติ",
		descriptionEn: "HR and grantor approvals",
		href: leaveHref("/approvals"),
		groupTh: "ใบลา",
		groupEn: "Leave",
		groupCode: "leave",
		iconKey: "check",
		leaveRoles: ["hr_verifier", "grantor_head_l1", "grantor_deputy", "grantor_director", "admin"],
	},
	{
		id: "org-users",
		titleTh: "ผู้ใช้และบทบาท",
		titleEn: "Users & roles",
		descriptionTh: "จัดการผู้ใช้ one-leave",
		descriptionEn: "Manage one-leave users",
		href: leaveHref("/org/users"),
		groupTh: "องค์กร",
		groupEn: "Organization",
		groupCode: "org",
		iconKey: "users",
		leaveRoles: ["admin"],
	},
	{
		id: "gateway-settings",
		titleTh: "การตั้งค่า Gateway",
		titleEn: "Gateway settings",
		descriptionTh: "โปรไฟล์และการตั้งค่าศูนย์กลาง",
		descriptionEn: "Hub profile and preferences",
		href: "/settings",
		groupTh: "ศูนย์กลาง",
		groupEn: "Hub",
		groupCode: "hub",
		iconKey: "settings",
		gatewayOnly: true,
	},
	{
		id: "gateway-roles",
		titleTh: "บทบาทและเมนู",
		titleEn: "Roles & menu",
		descriptionTh: "กำหนดสิทธิ์เมนู Gateway (เมื่อมี catalog)",
		descriptionEn: "Gateway menu RBAC (when catalog exists)",
		href: "/roles",
		groupTh: "ศูนย์กลาง",
		groupEn: "Hub",
		groupCode: "hub",
		iconKey: "shield",
		gatewayOnly: true,
		leaveRoles: ["admin"],
	},
	{
		id: "gateway-change-request",
		titleTh: "ขอเปลี่ยนข้อมูลบัญชี",
		titleEn: "Account change request",
		descriptionTh: "ส่งคำขอแก้ชื่อ / บทบาท",
		descriptionEn: "Request profile or role changes",
		href: "/account/change-request",
		groupTh: "ศูนย์กลาง",
		groupEn: "Hub",
		groupCode: "hub",
		iconKey: "edit",
		gatewayOnly: true,
	},
	{
		id: "admin-users",
		titleTh: "จัดการผู้ใช้ (Admin)",
		titleEn: "User administration",
		descriptionTh: "สร้าง/แก้ผู้ใช้ one-leave, รีเซ็ตรหัสผ่าน",
		descriptionEn: "Create/edit one-leave users, reset passwords",
		href: "/admin/users",
		groupTh: "ผู้ดูแลระบบ",
		groupEn: "Administration",
		groupCode: "admin",
		iconKey: "users",
		gatewayOnly: true,
		leaveRoles: ["admin", "hr_verifier"],
	},
	{
		id: "admin-employees",
		titleTh: "จัดการพนักงาน (Admin)",
		titleEn: "Employee administration",
		descriptionTh: "ข้อมูลพนักงานและหน่วยงาน",
		descriptionEn: "Employee records and org units",
		href: "/admin/employees",
		groupTh: "ผู้ดูแลระบบ",
		groupEn: "Administration",
		groupCode: "admin",
		iconKey: "users",
		gatewayOnly: true,
		leaveRoles: ["admin", "hr_verifier"],
	},
	{
		id: "admin-roles",
		titleTh: "กำหนดบทบาทผู้ใช้ (Admin)",
		titleEn: "User role assignment",
		descriptionTh: "มอบ/ถอนบทบาท; บทบาท admin เฉพาะผู้ดูแลระบบ",
		descriptionEn: "Assign/revoke roles; admin role gated",
		href: "/admin/roles",
		groupTh: "ผู้ดูแลระบบ",
		groupEn: "Administration",
		groupCode: "admin",
		iconKey: "shield",
		gatewayOnly: true,
		leaveRoles: ["admin", "hr_verifier"],
	},
];

function label(locale: Locale, th: string, en: string): string {
	return locale === "th" ? th : en;
}

function canSeeModule(mod: LauncherModule, leaveRoles: readonly LeaveRoleCode[]): boolean {
	if (!mod.leaveRoles || mod.leaveRoles.length === 0) return true;
	return mod.leaveRoles.some((r) => leaveRoles.includes(r));
}

function moduleAccessible(mod: LauncherModule, role: Role, leaveRoles: readonly LeaveRoleCode[]): boolean {
	if (mod.gatewayOnly && mod.id === "gateway-roles") {
		return hasPermission(role, "roles:manage") || leaveRoles.includes("admin");
	}
	// Role-gated modules (admin/HR sections) respect leaveRoles even when gateway-only.
	if (mod.leaveRoles && mod.leaveRoles.length > 0) {
		return canSeeModule(mod, leaveRoles);
	}
	if (mod.gatewayOnly) return true;
	return canSeeModule(mod, leaveRoles);
}

export function buildGatewayNavigationFromLeave(
	locale: Locale,
	role: Role,
	leaveRoles: readonly LeaveRoleCode[],
): {
	sidebarGroups: NavMenuGroup[];
	commandPaletteNav: CommandNavEntry[];
	appsMenuNav: CommandNavEntry[];
	homeNavCards: HomeNavCard[];
} {
	const groups = new Map<string, NavMenuGroup>();
	const commandPaletteNav: CommandNavEntry[] = [];
	const homeNavCards: HomeNavCard[] = [];

	for (const mod of LAUNCHER_MODULES) {
		const accessible = moduleAccessible(mod, role, leaveRoles);
		const groupLabel = label(locale, mod.groupTh, mod.groupEn);
		let group = groups.get(mod.groupCode);
		if (!group) {
			group = { code: mod.groupCode, label: groupLabel, items: [] };
			groups.set(mod.groupCode, group);
		}

		const itemLabel = label(locale, mod.titleTh, mod.titleEn);
		const navItem: NavMenuItem = {
			id: mod.id,
			label: itemLabel,
			href: mod.href,
			iconKey: mod.iconKey,
			keywords: [mod.titleTh, mod.titleEn, mod.descriptionTh, mod.descriptionEn],
			accessible,
			lockReason: accessible ? null : "no_permission",
			children: [],
		};
		group.items.push(navItem);

		if (accessible && mod.href) {
			commandPaletteNav.push({
				id: mod.id,
				label: itemLabel,
				href: mod.href,
				iconKey: mod.iconKey,
				keywords: navItem.keywords,
			});
			homeNavCards.push({
				id: mod.id,
				label: itemLabel,
				href: mod.href,
				iconKey: mod.iconKey,
				keywords: navItem.keywords,
				accessible: true,
				lockReason: null,
				groupLabel,
			});
		}
	}

	commandPaletteNav.sort((a, b) => a.label.localeCompare(b.label));

	return {
		sidebarGroups: [...groups.values()],
		commandPaletteNav,
		appsMenuNav: [...commandPaletteNav],
		homeNavCards,
	};
}
