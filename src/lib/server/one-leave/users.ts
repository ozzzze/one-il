import { leaveQuery } from "$lib/server/one-leave/pg.js";
import {
	isLeaveRoleCode,
	type LeaveAuthUser,
	type LeaveRoleCode,
} from "$lib/server/one-leave/types.js";

type UserRow = {
	id: string | number;
	username: string;
	employee_id: string | number | null;
	must_change_password: boolean;
	password_changed_at: Date | null;
	first_name_th: string | null;
	last_name_th: string | null;
	employee_code: string | null;
	role_codes: string[] | null;
};

function toInt(value: string | number | null | undefined): number | null {
	if (value === null || value === undefined) return null;
	const n = typeof value === "number" ? value : Number.parseInt(String(value), 10);
	return Number.isFinite(n) ? n : null;
}

function passwordChangedAtSec(row: Pick<UserRow, "password_changed_at">): number {
	if (!row.password_changed_at) return 0;
	return Math.floor(row.password_changed_at.getTime() / 1000);
}

function rowToAuthUser(row: UserRow, roles: LeaveRoleCode[]): LeaveAuthUser {
	const id = toInt(row.id);
	if (id === null) throw new Error("Invalid one_leave.users id");

	const displayName =
		row.first_name_th && row.last_name_th
			? `${row.first_name_th} ${row.last_name_th}`
			: row.username;

	return {
		id,
		username: row.username,
		roles,
		displayName,
		employeeId: toInt(row.employee_id),
		employeeCode: row.employee_code,
		mustChangePassword: Boolean(row.must_change_password),
	};
}

async function fetchLeaveUserRow(userId: number): Promise<UserRow | null> {
	const { rows } = await leaveQuery<UserRow>(
		`
		SELECT
			u.id,
			u.username,
			u.employee_id,
			u.must_change_password,
			u.password_changed_at,
			e.first_name_th,
			e.last_name_th,
			e.employee_code,
			COALESCE(
				array_agg(ur.role_code) FILTER (WHERE ur.role_code IS NOT NULL),
				'{}'
			) AS role_codes
		FROM one_leave.users AS u
		LEFT JOIN one_leave.employees AS e ON e.id = u.employee_id
		LEFT JOIN one_leave.user_roles AS ur ON ur.user_id = u.id
		WHERE u.id = $1 AND u.is_active = true
		GROUP BY
			u.id,
			u.username,
			u.employee_id,
			u.must_change_password,
			u.password_changed_at,
			e.first_name_th,
			e.last_name_th,
			e.employee_code
		`,
		[userId]
	);
	return rows[0] ?? null;
}

function authUserFromRow(row: UserRow): LeaveAuthUser | null {
	const roles = (row.role_codes ?? []).filter(isLeaveRoleCode);
	if (roles.length === 0) return null;
	return rowToAuthUser(row, roles);
}

export async function getPasswordChangedAt(userId: number): Promise<number> {
	const { rows } = await leaveQuery<{ password_changed_at: Date | null }>(
		`SELECT password_changed_at FROM one_leave.users WHERE id = $1 AND is_active = true`,
		[userId]
	);
	const row = rows[0];
	if (!row?.password_changed_at) return 0;
	return passwordChangedAtSec(row);
}

/** Single round-trip for session validation: user + password_changed_at + roles. */
export async function loadLeaveAuthSessionUser(
	userId: number
): Promise<{ user: LeaveAuthUser; passwordChangedAtSec: number } | null> {
	const row = await fetchLeaveUserRow(userId);
	if (!row) return null;
	const user = authUserFromRow(row);
	if (!user) return null;
	return { user, passwordChangedAtSec: passwordChangedAtSec(row) };
}

export async function getLeaveUserById(userId: number): Promise<LeaveAuthUser | null> {
	const row = await fetchLeaveUserRow(userId);
	if (!row) return null;
	return authUserFromRow(row);
}
