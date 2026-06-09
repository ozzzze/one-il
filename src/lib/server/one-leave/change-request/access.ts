import type { AuthUser } from "$lib/server/one-leave/auth/types.js";
import type { ChangeRequestDetail } from "$lib/server/one-leave/change-request/types.js";
import { getEmployeeById } from "$lib/server/one-leave/org/repository.js";

export function canViewAllScr(user: AuthUser): boolean {
	return user.roles.includes("admin") || user.roles.includes("hr_verifier");
}

export function canItReview(user: AuthUser): boolean {
	return user.roles.includes("admin");
}

export function canAccessScr(user: AuthUser, record: ChangeRequestDetail): boolean {
	if (canViewAllScr(user) || canItReview(user)) return true;
	if (user.employeeId !== null && user.employeeId === record.requesterEmployeeId) return true;
	if (user.employeeId !== null && record.supervisorEmployeeId === user.employeeId) return true;
	return false;
}

export function canEditScr(user: AuthUser, record: ChangeRequestDetail): boolean {
	return (
		record.status === "draft" &&
		user.employeeId !== null &&
		user.employeeId === record.requesterEmployeeId
	);
}

export function canWithdrawScr(user: AuthUser, record: ChangeRequestDetail): boolean {
	return (
		(record.status === "draft" || record.status === "submitted") &&
		user.employeeId !== null &&
		user.employeeId === record.requesterEmployeeId
	);
}

export function canSupervisorApprove(user: AuthUser, record: ChangeRequestDetail): boolean {
	if (record.status !== "submitted") return false;
	if (user.employeeId === null || record.supervisorEmployeeId === null) return false;
	if (user.employeeId !== record.supervisorEmployeeId) return false;
	if (user.employeeId === record.requesterEmployeeId) return false;
	return true;
}

export function canSupervisorDeny(user: AuthUser, record: ChangeRequestDetail): boolean {
	return canSupervisorApprove(user, record);
}

export function canItImplement(user: AuthUser, record: ChangeRequestDetail): boolean {
	if (!canItReview(user)) return false;
	if (record.status !== "supervisor_approved") return false;
	if (user.id === record.requesterUserId) return false;
	if (user.employeeId !== null && user.employeeId === record.requesterEmployeeId) return false;
	return true;
}

export function canItDeny(user: AuthUser, record: ChangeRequestDetail): boolean {
	return canItImplement(user, record);
}

export function canEmergencyImplement(user: AuthUser, record: ChangeRequestDetail): boolean {
	if (!canItReview(user)) return false;
	if (record.changeCategory !== "emergency") return false;
	if (record.status !== "submitted") return false;
	if (user.id === record.requesterUserId) return false;
	if (user.employeeId !== null && user.employeeId === record.requesterEmployeeId) return false;
	return true;
}

export function canCloseScr(user: AuthUser, record: ChangeRequestDetail): boolean {
	if (record.status !== "implemented") return false;
	return canItReview(user) || canViewAllScr(user);
}

export async function assertCanCreateScr(user: AuthUser): Promise<void> {
	if (user.employeeId === null) {
		throw new Error("บัญชีไม่ผูกข้อมูลพนักงาน");
	}
	const emp = await getEmployeeById(user.employeeId);
	if (!emp) {
		throw new Error("ไม่พบข้อมูลพนักงาน");
	}
}

export function assertSupervisorSeparation(user: AuthUser, record: ChangeRequestDetail): void {
	if (user.id === record.requesterUserId) {
		throw new Error("ผู้ยื่นคำขอไม่สามารถอนุมัติคำขอของตนเองได้");
	}
	if (user.employeeId !== null && user.employeeId === record.requesterEmployeeId) {
		throw new Error("ผู้ยื่นคำขอไม่สามารถอนุมัติคำขอของตนเองได้");
	}
}

export function assertItSeparation(user: AuthUser, record: ChangeRequestDetail): void {
	if (user.id === record.requesterUserId) {
		throw new Error("ผู้ยื่นคำขอไม่สามารถดำเนินการ IT คำขอของตนเองได้");
	}
	if (user.employeeId !== null && user.employeeId === record.requesterEmployeeId) {
		throw new Error("ผู้ยื่นคำขอไม่สามารถดำเนินการ IT คำขอของตนเองได้");
	}
}
