import { error } from "@sveltejs/kit";
import type { SessionUser } from "$lib/server/auth.js";

export function canViewAuditLogs(user: SessionUser | null): boolean {
	if (!user) return false;
	return user.leaveRoles.includes("admin") || user.leaveRoles.includes("hr_verifier");
}

export function assertAuditLogAccess(user: SessionUser | null): asserts user is SessionUser {
	if (!user) error(401, "กรุณาเข้าสู่ระบบ");
	if (!canViewAuditLogs(user)) {
		error(403, "ไม่มีสิทธิดูประวัติการทำรายการ");
	}
}
