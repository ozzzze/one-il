import { withLeaveTransaction } from "$lib/server/one-leave/pg.js";
import { isLeaveRoleCode, type LeaveRoleCode } from "$lib/server/one-leave/types.js";
import { writeAdminAudit } from "$lib/server/one-leave/admin/audit.js";
import { AdminActionError, type AdminActor } from "$lib/server/one-leave/admin/types.js";
import type { PoolClient } from "pg";

function assertValidRole(roleCode: string): asserts roleCode is LeaveRoleCode {
	if (!isLeaveRoleCode(roleCode)) {
		throw new AdminActionError("invalid_role", `Unknown role: ${roleCode}`);
	}
}

/**
 * Tiered guard: granting/revoking `admin` requires `roles:grant_admin`
 * (`canGrantAdmin`). All other (business) roles only require `roles:manage`,
 * which the caller has already asserted before reaching the repository.
 */
function assertCanModifyRole(actor: AdminActor, roleCode: LeaveRoleCode): void {
	if (roleCode === "admin" && !actor.canGrantAdmin) {
		throw new AdminActionError(
			"forbidden_admin_grant",
			"You cannot grant or revoke the admin role"
		);
	}
}

function assertNotSelf(actor: AdminActor, targetUserId: number): void {
	if (actor.leaveUserId !== null && actor.leaveUserId === targetUserId) {
		throw new AdminActionError("self_modify", "You cannot change your own roles");
	}
}

async function countAdmins(client: PoolClient): Promise<number> {
	const { rows } = await client.query<{ n: string }>(
		`SELECT COUNT(*)::text AS n FROM one_leave.user_roles WHERE role_code = 'admin'`
	);
	return Number(rows[0]?.n ?? 0);
}

export async function assignLeaveRole(
	actor: AdminActor,
	targetUserId: number,
	roleCode: string
): Promise<void> {
	assertValidRole(roleCode);
	assertCanModifyRole(actor, roleCode);
	if (roleCode === "admin") assertNotSelf(actor, targetUserId);

	await withLeaveTransaction(async (client) => {
		const result = await client.query(
			`INSERT INTO one_leave.user_roles (user_id, role_code)
			 VALUES ($1, $2)
			 ON CONFLICT (user_id, role_code) DO NOTHING`,
			[targetUserId, roleCode]
		);
		if (result.rowCount === 0) return; // already had the role; no-op, no audit noise
		await writeAdminAudit(client, {
			actorUserId: actor.leaveUserId,
			actorUsername: actor.username,
			action: "role.assign",
			targetUserId,
			detail: { roleCode },
		});
	});
}

export async function revokeLeaveRole(
	actor: AdminActor,
	targetUserId: number,
	roleCode: string
): Promise<void> {
	assertValidRole(roleCode);
	assertCanModifyRole(actor, roleCode);
	assertNotSelf(actor, targetUserId);

	await withLeaveTransaction(async (client) => {
		if (roleCode === "admin") {
			const admins = await countAdmins(client);
			const { rows: has } = await client.query<{ exists: boolean }>(
				`SELECT EXISTS(
					SELECT 1 FROM one_leave.user_roles WHERE user_id = $1 AND role_code = 'admin'
				) AS exists`,
				[targetUserId]
			);
			if (has[0]?.exists && admins <= 1) {
				throw new AdminActionError("last_admin", "Cannot revoke the last admin");
			}
		}
		const result = await client.query(
			`DELETE FROM one_leave.user_roles WHERE user_id = $1 AND role_code = $2`,
			[targetUserId, roleCode]
		);
		if (result.rowCount === 0) return;
		await writeAdminAudit(client, {
			actorUserId: actor.leaveUserId,
			actorUsername: actor.username,
			action: "role.revoke",
			targetUserId,
			detail: { roleCode },
		});
	});
}
