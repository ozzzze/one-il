import { PgTransaction, PgConnectionPool, PgRequest } from "$lib/server/one-leave/db/pool.js";
import sql from "$lib/server/one-leave/db/pool.js";

export function toSqlDateTime(value: string | null | undefined): Date | null {
	if (!value) return null;
	const normalized = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value) ? `${value}:00` : value;
	const d = new Date(normalized);
	return Number.isNaN(d.getTime()) ? null : d;
}

export async function rollbackTransaction(transaction: PgTransaction): Promise<void> {
	try {
		await transaction.rollback();
	} catch {
		// ignore — connection may already be rolled back
	}
}

export function formatDbError(err: unknown): string {
	if (!(err instanceof Error)) return "บันทึกไม่สำเร็จ";

	const reqErr = err as Error & { precedingErrors?: Array<{ message?: string }> };
	const root = reqErr.precedingErrors?.find(
		(e: { message?: string }) => e.message && !e.message.includes("Transaction has been aborted")
	)?.message;

	if (root) return root;

	if (err.message.includes("FOREIGN KEY")) {
		return "ข้อมูลอ้างอิงไม่ถูกต้อง — ตรวจสอบหัวหน้างาน ระบบ หรือประเภทข้อยกเว้น";
	}

	if (err.message.includes("Transaction has been aborted")) {
		return "บันทึกไม่สำเร็จ — ลองใหม่อีกครั้ง";
	}

	return err.message;
}

export interface ScrApprovalInsert {
	scrId: number;
	actorUserId: number | null;
	actorRole: string;
	actionType: string;
	fromStatus: string;
	toStatus: string;
	stepOrder: number;
	comment: string | null;
	ipAddress: string | null;
}

export async function insertScrApprovalRow(
	transaction: PgTransaction,
	params: ScrApprovalInsert
): Promise<void> {
	await new PgRequest(transaction)
		.input("scrId", params.scrId)
		.input("actorUserId", params.actorUserId)
		.input("actorRole", params.actorRole)
		.input("actionType", params.actionType)
		.input("fromStatus", params.fromStatus)
		.input("toStatus", params.toStatus)
		.input("stepOrder", params.stepOrder)
		.input("comment", params.comment)
		.input("ipAddress", params.ipAddress).query(`
			INSERT INTO [one_leave].[system_change_approvals] (
				[system_change_request_id], [step_order], [actor_user_id], [actor_role],
				[action_type], [from_status], [to_status], [comment], [ip_address]
			)
			VALUES (
				@scrId, @stepOrder, @actorUserId, @actorRole,
				@actionType, @fromStatus, @toStatus, @comment, @ipAddress
			)
		`);
}
