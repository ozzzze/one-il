import { PgTransaction, PgRequest } from '$lib/server/one-leave/db/pool.js';
import type { AuthUser } from '$lib/server/one-leave/auth/types.js';
import { writeAuditLog } from '$lib/server/one-leave/audit/repository.js';
import type { AuditContext } from '$lib/server/one-leave/audit/types.js';
import { getDbPool } from '$lib/server/one-leave/db/pool.js';
import { getEmployeeById } from '$lib/server/one-leave/org/repository.js';
import {
	insertScrApprovalRow,
	rollbackTransaction
} from '$lib/server/one-leave/change-request/db-helpers.js';
import {
	assertItSeparation,
	assertSupervisorSeparation,
	canCloseScr,
	canEmergencyImplement,
	canItDeny,
	canItImplement,
	canSupervisorApprove,
	canSupervisorDeny,
	canWithdrawScr
} from '$lib/server/one-leave/change-request/access.js';
import {
	assertTestEvidenceAttached
} from '$lib/server/one-leave/change-request/attachments.js';
import type { ItImplementInput } from '$lib/server/one-leave/change-request/types.js';
import { getChangeRequestById } from '$lib/server/one-leave/change-request/repository.js';

interface TransitionExtras {
	submittedAt?: boolean;
	supervisorApprovedAt?: boolean;
	implementedAt?: boolean;
	closedAt?: boolean;
	testEnvironment?: string;
	testResultSummary?: string;
	implementationNotes?: string;
	postReviewRequired?: boolean;
}

function buildApprovalSummary(
	action: string,
	requestNumber: string,
	toStatus: string
): string {
	switch (action) {
		case 'submit':
			return `ส่งคำขอเปลี่ยนแปลงระบบ ${requestNumber}`;
		case 'withdraw':
			return `ถอนคำขอเปลี่ยนแปลงระบบ ${requestNumber}`;
		case 'approve':
			return `หัวหน้าอนุมัติคำขอ ${requestNumber} → ${toStatus}`;
		case 'deny':
			return `ไม่อนุมัติคำขอ ${requestNumber}`;
		case 'implement':
			return `IT ดำเนินการคำขอ ${requestNumber} → ${toStatus}`;
		case 'emergency_implement':
			return `IT ดำเนินการฉุกเฉิน ${requestNumber} → ${toStatus}`;
		case 'close':
			return `ปิดคำขอเปลี่ยนแปลงระบบ ${requestNumber}`;
		default:
			return `${action} คำขอ ${requestNumber} → ${toStatus}`;
	}
}

async function transitionScrStatus(
	scrId: number,
	fromStatus: string,
	toStatus: string,
	actorUserId: number | null,
	actorRole: string,
	actionType: string,
	stepOrder: number,
	comment: string | null,
	ipAddress: string | null,
	extras?: TransitionExtras
): Promise<void> {
	const pool = await getDbPool();
	const transaction = new PgTransaction(pool);
	await transaction.begin();

	try {
		const req = new PgRequest(transaction)
			.input('id', scrId)
			.input('fromStatus', fromStatus)
			.input('toStatus', toStatus);

		const setClauses = ['[status] = @toStatus', '[updated_at] = SYSUTCDATETIME()'];

		if (extras?.submittedAt) setClauses.push('[submitted_at] = SYSUTCDATETIME()');
		if (extras?.supervisorApprovedAt) {
			setClauses.push('[supervisor_approved_at] = SYSUTCDATETIME()');
		}
		if (extras?.implementedAt) setClauses.push('[implemented_at] = SYSUTCDATETIME()');
		if (extras?.closedAt) setClauses.push('[closed_at] = SYSUTCDATETIME()');
		if (extras?.postReviewRequired !== undefined) {
			req.input('postReviewRequired', extras.postReviewRequired ? 1 : 0);
			setClauses.push('[post_review_required] = @postReviewRequired');
		}
		if (extras?.testEnvironment !== undefined) {
			req.input('testEnvironment', extras.testEnvironment);
			setClauses.push('[test_environment] = @testEnvironment');
		}
		if (extras?.testResultSummary !== undefined) {
			req.input('testResultSummary', extras.testResultSummary);
			setClauses.push('[test_result_summary] = @testResultSummary');
		}
		if (extras?.implementationNotes !== undefined) {
			req.input('implementationNotes', extras.implementationNotes);
			setClauses.push('[implementation_notes] = @implementationNotes');
		}

		const update = await req.query<{ n: number }>(`
			UPDATE [one_leave].[system_change_requests]
			SET ${setClauses.join(', ')}
			WHERE [id] = @id AND [status] = @fromStatus;
			SELECT @@ROWCOUNT AS n;
		`);

		if ((update.recordset[0]?.n ?? 0) === 0) {
			throw new Error('สถานะคำขอเปลี่ยนแล้ว — รีเฟรชหน้าแล้วลองใหม่');
		}

		await insertScrApprovalRow(transaction, {
			scrId,
			actorUserId,
			actorRole,
			actionType,
			fromStatus,
			toStatus,
			stepOrder,
			comment,
			ipAddress
		});

		await transaction.commit();
	} catch (err: unknown) {
		await rollbackTransaction(transaction);
		throw err;
	}
}

export async function submitChangeRequest(
	user: AuthUser,
	scrId: number,
	ipAddress: string | null = null,
	audit?: AuditContext
): Promise<void> {
	const record = await getChangeRequestById(scrId);
	if (!record) throw new Error('ไม่พบคำขอเปลี่ยนแปลงระบบ');
	if (record.status !== 'draft') {
		throw new Error('ส่งได้เฉพาะคำขอร่าง');
	}
	if (user.employeeId === null || user.employeeId !== record.requesterEmployeeId) {
		throw new Error('ส่งได้เฉพาะคำขอของตนเอง');
	}

	const employee = await getEmployeeById(user.employeeId);
	if (!employee) throw new Error('ไม่พบข้อมูลพนักงาน');

	if (record.changeCategory !== 'emergency' && employee.supervisorEmployeeId === null) {
		throw new Error('ไม่พบหัวหน้างาน — ติดต่อ HR ตั้งค่าสายอนุมัติ');
	}

	const pool = await getDbPool();
	await pool
		.request()
		.input('id', scrId)
		.input('supervisorEmployeeId', employee.supervisorEmployeeId).query(`
			UPDATE [one_leave].[system_change_requests]
			SET [supervisor_employee_id] = @supervisorEmployeeId
			WHERE [id] = @id
		`);

	const fromStatus = record.status;
	await transitionScrStatus(
		scrId,
		'draft',
		'submitted',
		user.id,
		'requester',
		'submit',
		1,
		null,
		ipAddress,
		{ submittedAt: true }
	);

	if (audit) {
		await writeAuditLog(audit, {
			entityType: 'system_change_request',
			entityId: scrId,
			action: 'submit',
			before: { status: fromStatus },
			after: { status: 'submitted' },
			summary: buildApprovalSummary('submit', record.requestNumber, 'submitted')
		});
	}
}

export async function withdrawChangeRequest(
	user: AuthUser,
	scrId: number,
	ipAddress: string | null = null,
	audit?: AuditContext
): Promise<void> {
	const record = await getChangeRequestById(scrId);
	if (!record) throw new Error('ไม่พบคำขอเปลี่ยนแปลงระบบ');
	if (!canWithdrawScr(user, record)) {
		throw new Error('ถอนได้เฉพาะคำขอร่างหรือที่ส่งแล้ว (ก่อนหัวหน้าอนุมัติ)');
	}

	const fromStatus = record.status;
	await transitionScrStatus(
		scrId,
		record.status,
		'withdrawn',
		user.id,
		'requester',
		'withdraw',
		98,
		null,
		ipAddress
	);

	if (audit) {
		await writeAuditLog(audit, {
			entityType: 'system_change_request',
			entityId: scrId,
			action: 'withdraw',
			before: { status: fromStatus },
			after: { status: 'withdrawn' },
			summary: buildApprovalSummary('withdraw', record.requestNumber, 'withdrawn')
		});
	}
}

export async function supervisorApprove(
	user: AuthUser,
	scrId: number,
	comment: string | null = null,
	ipAddress: string | null = null,
	audit?: AuditContext
): Promise<void> {
	const record = await getChangeRequestById(scrId);
	if (!record) throw new Error('ไม่พบคำขอเปลี่ยนแปลงระบบ');
	if (!canSupervisorApprove(user, record)) {
		throw new Error('ไม่มีสิทธิอนุมัติคำขอนี้');
	}
	assertSupervisorSeparation(user, record);

	const fromStatus = record.status;
	await transitionScrStatus(
		scrId,
		'submitted',
		'supervisor_approved',
		user.id,
		'supervisor',
		'approve',
		2,
		comment?.trim() || null,
		ipAddress,
		{ supervisorApprovedAt: true }
	);

	if (audit) {
		await writeAuditLog(audit, {
			entityType: 'system_change_request',
			entityId: scrId,
			action: 'approve',
			before: { status: fromStatus },
			after: { status: 'supervisor_approved' },
			summary: buildApprovalSummary('approve', record.requestNumber, 'supervisor_approved')
		});
	}
}

export async function supervisorDeny(
	user: AuthUser,
	scrId: number,
	reason: string,
	ipAddress: string | null = null,
	audit?: AuditContext
): Promise<void> {
	const trimmed = reason.trim();
	if (!trimmed) throw new Error('กรุณาระบุเหตุผลที่ไม่อนุมัติ');

	const record = await getChangeRequestById(scrId);
	if (!record) throw new Error('ไม่พบคำขอเปลี่ยนแปลงระบบ');
	if (!canSupervisorDeny(user, record)) {
		throw new Error('ไม่มีสิทธิไม่อนุมัติคำขอนี้');
	}
	assertSupervisorSeparation(user, record);

	const fromStatus = record.status;
	await transitionScrStatus(
		scrId,
		'submitted',
		'denied',
		user.id,
		'supervisor',
		'deny',
		99,
		trimmed,
		ipAddress
	);

	if (audit) {
		await writeAuditLog(audit, {
			entityType: 'system_change_request',
			entityId: scrId,
			action: 'deny',
			before: { status: fromStatus },
			after: { status: 'denied', reason: trimmed },
			summary: buildApprovalSummary('deny', record.requestNumber, 'denied')
		});
	}
}

export async function itImplement(
	user: AuthUser,
	scrId: number,
	input: ItImplementInput,
	ipAddress: string | null = null,
	audit?: AuditContext
): Promise<void> {
	const record = await getChangeRequestById(scrId);
	if (!record) throw new Error('ไม่พบคำขอเปลี่ยนแปลงระบบ');
	if (!canItImplement(user, record)) {
		throw new Error('ไม่มีสิทธิดำเนินการ IT คำขอนี้');
	}
	assertItSeparation(user, record);
	await assertTestEvidenceAttached(scrId);

	const fromStatus = record.status;
	await transitionScrStatus(
		scrId,
		'supervisor_approved',
		'implemented',
		user.id,
		'it_reviewer',
		'implement',
		3,
		null,
		ipAddress,
		{
			implementedAt: true,
			testEnvironment: input.testEnvironment,
			testResultSummary: input.testResultSummary,
			implementationNotes: input.implementationNotes
		}
	);

	if (audit) {
		await writeAuditLog(audit, {
			entityType: 'system_change_request',
			entityId: scrId,
			action: 'implement',
			before: { status: fromStatus },
			after: {
				status: 'implemented',
				testEnvironment: input.testEnvironment
			},
			summary: buildApprovalSummary('implement', record.requestNumber, 'implemented')
		});
	}
}

export async function itDeny(
	user: AuthUser,
	scrId: number,
	reason: string,
	ipAddress: string | null = null,
	audit?: AuditContext
): Promise<void> {
	const trimmed = reason.trim();
	if (!trimmed) throw new Error('กรุณาระบุเหตุผลที่ไม่อนุมัติ');

	const record = await getChangeRequestById(scrId);
	if (!record) throw new Error('ไม่พบคำขอเปลี่ยนแปลงระบบ');
	if (!canItDeny(user, record)) {
		throw new Error('ไม่มีสิทธิไม่อนุมัติคำขอนี้');
	}
	assertItSeparation(user, record);

	const fromStatus = record.status;
	await transitionScrStatus(
		scrId,
		'supervisor_approved',
		'denied',
		user.id,
		'it_reviewer',
		'deny',
		99,
		trimmed,
		ipAddress
	);

	if (audit) {
		await writeAuditLog(audit, {
			entityType: 'system_change_request',
			entityId: scrId,
			action: 'deny',
			before: { status: fromStatus },
			after: { status: 'denied', reason: trimmed },
			summary: buildApprovalSummary('deny', record.requestNumber, 'denied')
		});
	}
}

export async function emergencyImplement(
	user: AuthUser,
	scrId: number,
	input: ItImplementInput,
	ipAddress: string | null = null,
	audit?: AuditContext
): Promise<void> {
	const record = await getChangeRequestById(scrId);
	if (!record) throw new Error('ไม่พบคำขอเปลี่ยนแปลงระบบ');
	if (!canEmergencyImplement(user, record)) {
		throw new Error('ดำเนินการฉุกเฉินได้เฉพาะคำขอ emergency ที่ส่งแล้ว');
	}
	assertItSeparation(user, record);
	await assertTestEvidenceAttached(scrId);

	const fromStatus = record.status;
	await transitionScrStatus(
		scrId,
		'submitted',
		'implemented',
		user.id,
		'it_reviewer',
		'emergency_implement',
		2,
		null,
		ipAddress,
		{
			implementedAt: true,
			postReviewRequired: true,
			testEnvironment: input.testEnvironment,
			testResultSummary: input.testResultSummary,
			implementationNotes: input.implementationNotes
		}
	);

	if (audit) {
		await writeAuditLog(audit, {
			entityType: 'system_change_request',
			entityId: scrId,
			action: 'emergency_implement',
			before: { status: fromStatus },
			after: {
				status: 'implemented',
				postReviewRequired: true
			},
			summary: buildApprovalSummary('emergency_implement', record.requestNumber, 'implemented')
		});
	}
}

export async function closeChangeRequest(
	user: AuthUser,
	scrId: number,
	ipAddress: string | null = null,
	audit?: AuditContext
): Promise<void> {
	const record = await getChangeRequestById(scrId);
	if (!record) throw new Error('ไม่พบคำขอเปลี่ยนแปลงระบบ');
	if (!canCloseScr(user, record)) {
		throw new Error('ปิดได้เฉพาะคำขอที่ดำเนินการแล้ว');
	}

	const fromStatus = record.status;
	await transitionScrStatus(
		scrId,
		'implemented',
		'closed',
		user.id,
		user.roles.includes('admin') ? 'it_reviewer' : 'hr_verifier',
		'close',
		4,
		null,
		ipAddress,
		{ closedAt: true }
	);

	if (audit) {
		await writeAuditLog(audit, {
			entityType: 'system_change_request',
			entityId: scrId,
			action: 'close',
			before: { status: fromStatus },
			after: { status: 'closed' },
			summary: buildApprovalSummary('close', record.requestNumber, 'closed')
		});
	}
}
