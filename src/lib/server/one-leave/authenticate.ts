import bcrypt from "bcryptjs";
import {
	authenticateLeaveMockUser,
	isLeaveAuthMockEnabled,
} from "$lib/server/one-leave/mock-auth.js";
import { leaveQuery } from "$lib/server/one-leave/pg.js";
import {
	isLeaveRoleCode,
	type LeaveAuthUser,
	type LeaveRoleCode,
} from "$lib/server/one-leave/types.js";

type UserRow = {
	id: string | number;
	username: string;
	password_hash: string;
	employee_id: string | number | null;
	must_change_password: boolean;
	first_name_th: string | null;
	last_name_th: string | null;
	employee_code: string | null;
};

function normalizeLogin(value: string): string {
	return value.trim().toLowerCase();
}

function getUsernameCandidates(username: string): string[] {
	const normalized = normalizeLogin(username);
	const candidates = new Set<string>([normalized]);
	const at = normalized.lastIndexOf("@");
	if (at <= 0) return [...candidates];

	const localPart = normalized.slice(0, at);
	const domain = normalized.slice(at + 1);
	if (domain === "mahidol.ac.th") {
		candidates.add(`${localPart}@mahidol.edu`);
	}
	if (domain === "mahidol.edu") {
		candidates.add(`${localPart}@mahidol.ac.th`);
	}
	return [...candidates];
}

function toInt(value: string | number | null | undefined): number | null {
	if (value === null || value === undefined) return null;
	const n = typeof value === "number" ? value : Number.parseInt(String(value), 10);
	return Number.isFinite(n) ? n : null;
}

async function loadRoles(userId: number): Promise<LeaveRoleCode[]> {
	const { rows } = await leaveQuery<{ role_code: string }>(
		`SELECT role_code FROM one_leave.user_roles WHERE user_id = $1`,
		[userId],
	);
	return rows.map((r) => r.role_code).filter(isLeaveRoleCode);
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

async function loadUserByUsernames(usernames: string[]): Promise<UserRow | null> {
	const lowered = usernames.map((u) => u.toLowerCase());
	const { rows } = await leaveQuery<UserRow>(
		`
		SELECT
			u.id,
			u.username,
			u.password_hash,
			u.employee_id,
			u.must_change_password,
			e.first_name_th,
			e.last_name_th,
			e.employee_code
		FROM one_leave.users AS u
		LEFT JOIN one_leave.employees AS e ON e.id = u.employee_id
		WHERE LOWER(u.username) = ANY($1::text[]) AND u.is_active = true
		LIMIT 1
		`,
		[lowered],
	);
	return rows[0] ?? null;
}

export async function authenticateLeaveUser(
	username: string,
	password: string,
): Promise<LeaveAuthUser | null> {
	if (isLeaveAuthMockEnabled()) {
		return authenticateLeaveMockUser(username, password);
	}

	const candidates = getUsernameCandidates(username);
	const row = await loadUserByUsernames(candidates);
	if (!row) return null;

	const valid = await bcrypt.compare(password, row.password_hash);
	if (!valid) return null;

	const userId = toInt(row.id);
	if (userId === null) return null;

	const roles = await loadRoles(userId);
	if (roles.length === 0) return null;

	return rowToAuthUser(row, roles);
}
