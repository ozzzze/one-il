export type RoleCode =
	| "employee"
	| "hr_verifier"
	| "grantor_head_l1"
	| "grantor_deputy"
	| "grantor_director"
	| "admin";

export interface AuthUser {
	id: number;
	username: string;
	roles: RoleCode[];
	displayName: string;
	employeeId: number | null;
	employeeCode: string | null;
	mustChangePassword: boolean;
}

export interface SessionPayload {
	userId: number;
	username: string;
	exp: number;
	pwdAt?: number;
}
