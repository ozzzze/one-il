import type { Locale } from "$lib/i18n/locales.js";
import type { LeaveRoleCode } from "$lib/server/one-leave/types.js";

const LABELS: Record<LeaveRoleCode, { th: string; en: string }> = {
	admin: { th: "ผู้ดูแลระบบ", en: "Admin" },
	hr_verifier: { th: "เจ้าหน้าที่ HR", en: "HR verifier" },
	employee: { th: "พนักงาน", en: "Employee" },
	grantor_head_l1: { th: "ผู้อนุญาต (หัวหน้า)", en: "Grantor (head)" },
	grantor_deputy: { th: "ผู้อนุญาต (รองผู้อำนวยการ)", en: "Grantor (deputy)" },
	grantor_director: { th: "ผู้อนุญาต (ผู้อำนวยการ)", en: "Grantor (director)" },
};

/** All one-leave role codes, ordered for display (admin last). */
export const ALL_LEAVE_ROLES: LeaveRoleCode[] = [
	"employee",
	"hr_verifier",
	"grantor_head_l1",
	"grantor_deputy",
	"grantor_director",
	"admin",
];

export function leaveRoleLabel(role: LeaveRoleCode, locale: Locale): string {
	const entry = LABELS[role];
	if (!entry) return role;
	return locale === "th" ? entry.th : entry.en;
}

/**
 * Roles the current actor may assign. The `admin` role is only offered when the
 * actor holds `roles:grant_admin` (passed as `canGrantAdmin`).
 */
export function assignableLeaveRoles(canGrantAdmin: boolean): LeaveRoleCode[] {
	return ALL_LEAVE_ROLES.filter((r) => r !== "admin" || canGrantAdmin);
}
