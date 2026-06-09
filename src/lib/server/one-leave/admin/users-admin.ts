import bcrypt from "bcryptjs";
import { leaveQuery, withLeaveTransaction } from "$lib/server/one-leave/pg.js";
import { isLeaveRoleCode, type LeaveRoleCode } from "$lib/server/one-leave/types.js";
import { writeAdminAudit } from "$lib/server/one-leave/admin/audit.js";
import {
	AdminActionError,
	type AdminActor,
	type AdminUserRow,
	type CreateUserInput,
	type UpdateUserInput,
} from "$lib/server/one-leave/admin/types.js";

const BCRYPT_ROUNDS = 12;

type UserListDbRow = {
	id: string | number;
	username: string;
	is_active: boolean;
	must_change_password: boolean;
	employee_id: string | number | null;
	created_at: string | null;
	employee_code: string | null;
	first_name_th: string | null;
	last_name_th: string | null;
	roles: string[] | null;
};

function toInt(value: string | number | null | undefined): number | null {
	if (value === null || value === undefined) return null;
	const n = typeof value === "number" ? value : Number.parseInt(String(value), 10);
	return Number.isFinite(n) ? n : null;
}

function normalizeUsername(value: string): string {
	return value.trim().toLowerCase();
}

function mapUserRow(row: UserListDbRow): AdminUserRow {
	const id = toInt(row.id);
	if (id === null) throw new Error("Invalid one_leave.users id");
	const fullName =
		row.first_name_th && row.last_name_th
			? `${row.first_name_th} ${row.last_name_th}`
			: (row.first_name_th ?? row.last_name_th ?? null);
	return {
		id,
		username: row.username,
		isActive: Boolean(row.is_active),
		mustChangePassword: Boolean(row.must_change_password),
		employeeId: toInt(row.employee_id),
		employeeCode: row.employee_code,
		fullName,
		roles: (row.roles ?? []).filter(isLeaveRoleCode),
		createdAt: row.created_at,
	};
}

export async function listLeaveUsers(): Promise<AdminUserRow[]> {
	const { rows } = await leaveQuery<UserListDbRow>(
		`
		SELECT
			u.id,
			u.username,
			u.is_active,
			u.must_change_password,
			u.employee_id,
			u.created_at,
			e.employee_code,
			e.first_name_th,
			e.last_name_th,
			COALESCE(
				array_agg(ur.role_code) FILTER (WHERE ur.role_code IS NOT NULL),
				'{}'
			) AS roles
		FROM one_leave.users AS u
		LEFT JOIN one_leave.employees AS e ON e.id = u.employee_id
		LEFT JOIN one_leave.user_roles AS ur ON ur.user_id = u.id
		GROUP BY u.id, e.employee_code, e.first_name_th, e.last_name_th
		ORDER BY u.username
		`
	);
	return rows.map(mapUserRow);
}

async function usernameExists(username: string, excludeId?: number): Promise<boolean> {
	const { rows } = await leaveQuery<{ id: number }>(
		`SELECT id FROM one_leave.users WHERE LOWER(username) = $1 AND ($2::bigint IS NULL OR id <> $2) LIMIT 1`,
		[username, excludeId ?? null]
	);
	return rows.length > 0;
}

export async function createLeaveUser(
	actor: AdminActor,
	input: CreateUserInput
): Promise<{ id: number }> {
	const username = normalizeUsername(input.username);
	if (!username) throw new AdminActionError("invalid_username", "Username is required");
	if (!input.password || input.password.length < 8) {
		throw new AdminActionError("weak_password", "Password must be at least 8 characters");
	}
	const roles = (input.roles ?? []).filter(isLeaveRoleCode);
	if (roles.includes("admin") && !actor.canGrantAdmin) {
		throw new AdminActionError("forbidden_admin_grant", "You cannot grant the admin role");
	}
	if (await usernameExists(username)) {
		throw new AdminActionError("duplicate_username", "Username already exists");
	}

	const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

	return withLeaveTransaction(async (client) => {
		const inserted = await client.query<{ id: string | number }>(
			`INSERT INTO one_leave.users
				(username, password_hash, must_change_password, employee_id, is_active, password_changed_at)
			 VALUES ($1, $2, $3, $4, $5, now())
			 RETURNING id`,
			[
				username,
				passwordHash,
				input.mustChangePassword ?? true,
				input.employeeId ?? null,
				input.isActive ?? true,
			]
		);
		const id = toInt(inserted.rows[0]?.id);
		if (id === null) throw new Error("Failed to create user");

		for (const role of roles) {
			await client.query(
				`INSERT INTO one_leave.user_roles (user_id, role_code)
				 VALUES ($1, $2)
				 ON CONFLICT (user_id, role_code) DO NOTHING`,
				[id, role]
			);
		}

		await writeAdminAudit(client, {
			actorUserId: actor.leaveUserId,
			actorUsername: actor.username,
			action: "user.create",
			targetUserId: id,
			detail: { username, roles, employeeId: input.employeeId ?? null },
		});

		return { id };
	});
}

export async function updateLeaveUser(
	actor: AdminActor,
	userId: number,
	input: UpdateUserInput
): Promise<void> {
	const username = input.username !== undefined ? normalizeUsername(input.username) : undefined;
	if (username !== undefined) {
		if (!username) throw new AdminActionError("invalid_username", "Username is required");
		if (await usernameExists(username, userId)) {
			throw new AdminActionError("duplicate_username", "Username already exists");
		}
	}

	await withLeaveTransaction(async (client) => {
		await client.query(
			`UPDATE one_leave.users SET
				username = COALESCE($2, username),
				employee_id = CASE WHEN $3::boolean THEN $4 ELSE employee_id END,
				is_active = COALESCE($5, is_active)
			 WHERE id = $1`,
			[
				userId,
				username ?? null,
				input.employeeId !== undefined,
				input.employeeId ?? null,
				input.isActive ?? null,
			]
		);
		await writeAdminAudit(client, {
			actorUserId: actor.leaveUserId,
			actorUsername: actor.username,
			action: "user.update",
			targetUserId: userId,
			detail: { ...input },
		});
	});
}

export async function setLeaveUserActive(
	actor: AdminActor,
	userId: number,
	isActive: boolean
): Promise<void> {
	if (actor.leaveUserId === userId && !isActive) {
		throw new AdminActionError("self_deactivate", "You cannot deactivate your own account");
	}
	await withLeaveTransaction(async (client) => {
		await client.query(`UPDATE one_leave.users SET is_active = $2 WHERE id = $1`, [
			userId,
			isActive,
		]);
		await writeAdminAudit(client, {
			actorUserId: actor.leaveUserId,
			actorUsername: actor.username,
			action: isActive ? "user.activate" : "user.deactivate",
			targetUserId: userId,
			detail: { isActive },
		});
	});
}

export async function resetLeaveUserPassword(
	actor: AdminActor,
	userId: number,
	newPassword: string
): Promise<void> {
	if (!newPassword || newPassword.length < 8) {
		throw new AdminActionError("weak_password", "Password must be at least 8 characters");
	}
	const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
	await withLeaveTransaction(async (client) => {
		await client.query(
			`UPDATE one_leave.users SET
				password_hash = $2,
				must_change_password = true,
				password_changed_at = now()
			 WHERE id = $1`,
			[userId, passwordHash]
		);
		await writeAdminAudit(client, {
			actorUserId: actor.leaveUserId,
			actorUsername: actor.username,
			action: "user.reset_password",
			targetUserId: userId,
			detail: null,
		});
	});
}

export async function getLeaveUserRoles(userId: number): Promise<LeaveRoleCode[]> {
	const { rows } = await leaveQuery<{ role_code: string }>(
		`SELECT role_code FROM one_leave.user_roles WHERE user_id = $1`,
		[userId]
	);
	return rows.map((r) => r.role_code).filter(isLeaveRoleCode);
}
