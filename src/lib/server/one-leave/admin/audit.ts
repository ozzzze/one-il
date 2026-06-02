import type { PoolClient } from "pg";

export interface AdminAuditEntry {
	actorUserId: number | null;
	actorUsername: string | null;
	action: string;
	targetUserId: number | null;
	detail?: Record<string, unknown> | null;
}

/**
 * Insert one audit row. Must run on the SAME transaction client as the mutation
 * it records so the log is atomic with the change (commit/rollback together).
 */
export async function writeAdminAudit(client: PoolClient, entry: AdminAuditEntry): Promise<void> {
	await client.query(
		`INSERT INTO one_leave.user_admin_audit
			(actor_user_id, actor_username, action, target_user_id, detail)
		 VALUES ($1, $2, $3, $4, $5)`,
		[
			entry.actorUserId,
			entry.actorUsername,
			entry.action,
			entry.targetUserId,
			entry.detail ? JSON.stringify(entry.detail) : null,
		],
	);
}
