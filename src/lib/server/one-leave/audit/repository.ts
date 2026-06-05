import { PgTransaction, PgConnectionPool, PgRequest } from '$lib/server/one-leave/db/pool.js';
import { getDbPool } from '$lib/server/one-leave/db/pool.js';
import type { AuditContext, AuditLogInput } from '$lib/server/one-leave/audit/types.js';

function toJson(value: unknown): string | null {
	if (value === null || value === undefined) return null;
	return JSON.stringify(value);
}

export async function writeAuditLog(
	ctx: AuditContext,
	entry: AuditLogInput,
	transaction?: PgTransaction
): Promise<void> {
	const executor = transaction ? new PgRequest(transaction) : (await getDbPool()).request();
	await executor
		.input('entityType', entry.entityType)
		.input('entityId', entry.entityId)
		.input('action', entry.action)
		.input('userId', ctx.userId)
		.input('roleCode', ctx.roleCode)
		.input('ipAddress', ctx.ipAddress)
		.input('beforeJson', toJson(entry.before))
		.input('afterJson', toJson(entry.after))
		.input('summary', entry.summary ?? null).query(`
			INSERT INTO [one_leave].[audit_logs] (
				[entity_type], [entity_id], [action],
				[user_id], [role_code], [ip_address],
				[before_json], [after_json], [summary]
			)
			VALUES (
				@entityType, @entityId, @action,
				@userId, @roleCode, @ipAddress,
				@beforeJson, @afterJson, @summary
			)
		`);
}
