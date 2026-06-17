import type { LeaveRoleCode } from "$lib/server/one-leave/types.js";

export interface AdminActor {
	leaveUserId: number | null;
	username: string;
	/** Whether the actor may grant/revoke the `admin` role (roles:grant_admin). */
	canGrantAdmin: boolean;
}

export interface AdminUserRow {
	id: number;
	username: string;
	isActive: boolean;
	mustChangePassword: boolean;
	employeeId: number | null;
	employeeCode: string | null;
	fullName: string | null;
	roles: LeaveRoleCode[];
	createdAt: string | null;
}

export interface AdminEmployeeRow {
	id: number;
	employeeCode: string;
	titleTh: string | null;
	firstNameTh: string;
	lastNameTh: string;
	orgUnitId: number | null;
	orgUnitName: string | null;
	orgUnitNameEn: string | null;
	positionTitle: string | null;
	employeeLine: string;
	employmentTrack: string;
	employmentCategory: string;
	email: string | null;
	isActive: boolean;
}

export interface OrgUnitOption {
	id: number;
	code: string | null;
	name: string | null;
	nameEn: string | null;
}

export const EMPLOYEE_LINES = ["staff", "lecturer", "head_support", "director"] as const;
export type EmployeeLine = (typeof EMPLOYEE_LINES)[number];

export const EMPLOYMENT_CATEGORIES = [
	"government_official",
	"university_employee",
	"permanent_employee",
	"temporary_income",
] as const;
export type EmploymentCategory = (typeof EMPLOYMENT_CATEGORIES)[number];

export function isEmployeeLine(value: string): value is EmployeeLine {
	return (EMPLOYEE_LINES as readonly string[]).includes(value);
}

export function isEmploymentCategory(value: string): value is EmploymentCategory {
	return (EMPLOYMENT_CATEGORIES as readonly string[]).includes(value);
}

export interface CreateUserInput {
	username: string;
	password: string;
	employeeId?: number | null;
	isActive?: boolean;
	mustChangePassword?: boolean;
	roles?: LeaveRoleCode[];
}

export interface UpdateUserInput {
	username?: string;
	employeeId?: number | null;
	isActive?: boolean;
}

export interface CreateEmployeeInput {
	employeeCode: string;
	titleTh?: string | null;
	firstNameTh: string;
	lastNameTh: string;
	orgUnitId: number;
	positionTitle?: string | null;
	employeeLine: EmployeeLine;
	employmentCategory: EmploymentCategory;
	hireDate: string;
	email?: string | null;
	isActive?: boolean;
}

export interface UpdateEmployeeInput {
	titleTh?: string | null;
	firstNameTh?: string;
	lastNameTh?: string;
	orgUnitId?: number;
	positionTitle?: string | null;
	employeeLine?: EmployeeLine;
	employmentCategory?: EmploymentCategory;
	email?: string | null;
	isActive?: boolean;
}

/** Business roles HR may assign/revoke freely (no admin escalation). */
export const BUSINESS_ROLE_CODES: LeaveRoleCode[] = [
	"employee",
	"hr_verifier",
	"grantor_head_l1",
	"grantor_deputy",
	"grantor_director",
];

export class AdminActionError extends Error {
	constructor(
		public readonly code: string,
		message: string
	) {
		super(message);
		this.name = "AdminActionError";
	}
}
