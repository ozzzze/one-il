/** Mirrors one-leave `RoleCode` — keep in sync with one_leave.user_roles CHECK. */
export type LeaveRoleCode =
	| "employee"
	| "hr_verifier"
	| "grantor_head_l1"
	| "grantor_deputy"
	| "grantor_director"
	| "admin";

export interface LeaveAuthUser {
	id: number;
	username: string;
	roles: LeaveRoleCode[];
	displayName: string;
	employeeId: number | null;
	employeeCode: string | null;
	mustChangePassword: boolean;
}

export interface LeaveSessionPayload {
	userId: number;
	username: string;
	exp: number;
	pwdAt: number;
}

export function isLeaveRoleCode(value: string): value is LeaveRoleCode {
	return (
		value === "employee" ||
		value === "hr_verifier" ||
		value === "grantor_head_l1" ||
		value === "grantor_deputy" ||
		value === "grantor_director" ||
		value === "admin"
	);
}
