import { getLeavePgPool } from "$lib/server/one-leave/pg.js";
import { isLeaveRoleCode, type LeaveAuthUser, type LeaveRoleCode } from "$lib/server/one-leave/types.js";

type UserRow = {
	id: string | number;
	username: string;
	employee_id: string | number | null;
	must_change_password: boolean;
	password_changed_at: Date | null;
	first_name_th: string | null;
	last_name_th: string | null;
	employee_code: string | null;
};

function toInt(value: string | number | null | undefined): number | null {
	if (value === null || value === undefined) return null;
	const n = typeof value === "number" ? value : Number.parseInt(String(value), 10);
	return Number.isFinite(n) ? n : null;
}

async function loadRoles(userId: number): Promise<LeaveRoleCode[]> {
	const pool = getLeavePgPool();
	const { rows } = await pool.query<{ role_code: string }>(
		`SELECT role_code FROM one_leave.user_roles WHERE user_id = $1`,
		[userId],
	);
	return rows.map((r: { role_code: string }) => r.role_code).filter(isLeaveRoleCode);
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

export async function getPasswordChangedAt(userId: number): Promise<number> {
	const pool = getLeavePgPool();
	const { rows } = await pool.query<{ password_changed_at: Date | null }>(
		`SELECT password_changed_at FROM one_leave.users WHERE id = $1 AND is_active = true`,
		[userId],
	);
	const row = rows[0];
	if (!row?.password_changed_at) return 0;
	return Math.floor(row.password_changed_at.getTime() / 1000);
}

export async function getLeaveUserById(userId: number): Promise<LeaveAuthUser | null> {
	const pool = getLeavePgPool();
	const { rows } = await pool.query<UserRow>(
		`
		SELECT
			u.id,
			u.username,
			u.employee_id,
			u.must_change_password,
			u.password_changed_at,
			e.first_name_th,
			e.last_name_th,
			e.employee_code
		FROM one_leave.users AS u
		LEFT JOIN one_leave.employees AS e ON e.id = u.employee_id
		WHERE u.id = $1 AND u.is_active = true
		`,
		[userId],
	);
	const row = rows[0];
	if (!row) return null;
	const roles = await loadRoles(userId);
	if (roles.length === 0) return null;
	return rowToAuthUser(row, roles);
}
