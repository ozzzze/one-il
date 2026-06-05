import { PgTransaction, PgRequest } from '$lib/server/one-leave/db/pool.js';
import sql from '$lib/server/one-leave/db/pool.js';
import { formatEmployeeName } from '$lib/org/labels.js';
import type { AuthUser } from '$lib/server/one-leave/auth/types.js';
import { writeAuditLog } from '$lib/server/one-leave/audit/repository.js';
import type { AuditContext } from '$lib/server/one-leave/audit/types.js';
import { getDbPool } from '$lib/server/one-leave/db/pool.js';
import {
	insertScrApprovalRow,
	rollbackTransaction,
	toSqlDateTime
} from '$lib/server/one-leave/change-request/db-helpers.js';
import { getEmployeeById } from '$lib/server/one-leave/org/repository.js';
import { canViewAllScr } from '$lib/server/one-leave/change-request/access.js';
import { labelChangeCategory, labelScrStatus } from '$lib/server/one-leave/change-request/labels.js';
import { truncateForExport } from '$lib/server/one-leave/change-request/registry-export.js';
import type {
	ApprovalHistoryItem,
	ChangeCategory,
	ChangeRequestDetail,
	ChangeRequestListFilter,
	ChangeRequestListItem,
	ChangeRequestWriteInput,
	ExceptionTypeOption,
	ItSystemOption,
	ScrQueueCounts,
	ScrStatus
} from '$lib/server/one-leave/change-request/types.js';

function toInt(value: number | string | null | undefined): number | null {
	if (value === null || value === undefined) return null;
	const n = typeof value === 'number' ? value : Number.parseInt(String(value), 10);
	return Number.isFinite(n) ? n : null;
}

function toDateString(value: Date | string | null | undefined): string | null {
	if (value === null || value === undefined) return null;
	if (value instanceof Date) return value.toISOString().slice(0, 10);
	return String(value).slice(0, 10);
}

function toIsoDateTime(value: Date | string | null | undefined): string | null {
	if (value === null || value === undefined) return null;
	if (value instanceof Date) return value.toISOString();
	return String(value);
}

function asChangeCategory(code: string): ChangeCategory {
	if (code === 'standard' || code === 'normal' || code === 'emergency') return code;
	return 'normal';
}

function asScrStatus(code: string): ScrStatus {
	const valid: ScrStatus[] = [
		'draft',
		'submitted',
		'supervisor_approved',
		'denied',
		'implemented',
		'closed',
		'withdrawn'
	];
	return valid.includes(code as ScrStatus) ? (code as ScrStatus) : 'draft';
}

function applyListFilter(
	items: ChangeRequestListItem[],
	filter: ChangeRequestListFilter
): ChangeRequestListItem[] {
	let out = items;
	if (filter.status) {
		out = out.filter((r) => r.status === filter.status);
	}
	if (filter.changeCategory) {
		out = out.filter((r) => r.changeCategory === filter.changeCategory);
	}
	if (filter.q) {
		const q = filter.q.toLowerCase();
		out = out.filter(
			(r) =>
				r.requestNumber.toLowerCase().includes(q) ||
				r.title.toLowerCase().includes(q) ||
				r.itSystemName.toLowerCase().includes(q) ||
				r.requesterName.toLowerCase().includes(q) ||
				(r.requesterEmployeeCode?.toLowerCase().includes(q) ?? false)
		);
	}
	return out;
}

export async function listItSystems(): Promise<ItSystemOption[]> {
	const pool = await getDbPool();
	const result = await pool.request().query<{
		id: number | string;
		code: string;
		name_th: string;
		name_en: string | null;
	}>(`
		SELECT [id], [code], [name_th], [name_en]
		FROM [one_leave].[it_systems]
		WHERE [is_active] = 1
		ORDER BY [sort_order], [name_th]
	`);

	return result.recordset
		.map((row) => {
			const id = toInt(row.id);
			if (id === null) return null;
			return {
				id,
				code: row.code,
				nameTh: row.name_th,
				nameEn: row.name_en
			};
		})
		.filter((r): r is ItSystemOption => r !== null);
}

export async function listExceptionTypes(): Promise<ExceptionTypeOption[]> {
	const pool = await getDbPool();
	const result = await pool.request().query<{
		id: number | string;
		code: string;
		name_th: string;
	}>(`
		SELECT [id], [code], [name_th]
		FROM [one_leave].[exception_types]
		WHERE [is_active] = 1
		ORDER BY [sort_order], [name_th]
	`);

	return result.recordset
		.map((row) => {
			const id = toInt(row.id);
			if (id === null) return null;
			return {
				id,
				code: row.code,
				nameTh: row.name_th
			};
		})
		.filter((r): r is ExceptionTypeOption => r !== null);
}

interface ListRow {
	id: number | string;
	request_number: string;
	title: string;
	status: string;
	change_category: string;
	it_system_name: string;
	exception_type_name: string;
	employee_code: string | null;
	title_th: string | null;
	first_name_th: string;
	last_name_th: string;
	exception_start_date: Date | string;
	exception_end_date: Date | string;
	submitted_at: Date | string | null;
}

function mapListRow(row: ListRow): ChangeRequestListItem | null {
	const id = toInt(row.id);
	if (id === null) return null;
	const changeCategory = asChangeCategory(row.change_category);
	const status = asScrStatus(row.status);
	return {
		id,
		requestNumber: row.request_number,
		title: row.title,
		status,
		statusLabel: labelScrStatus(status),
		changeCategory,
		changeCategoryLabel: labelChangeCategory(changeCategory),
		itSystemName: row.it_system_name,
		exceptionTypeName: row.exception_type_name,
		requesterEmployeeCode: row.employee_code ?? null,
		requesterName: formatEmployeeName(row.title_th, row.first_name_th, row.last_name_th),
		exceptionStartDate: toDateString(row.exception_start_date) ?? '',
		exceptionEndDate: toDateString(row.exception_end_date) ?? '',
		submittedAt: toIsoDateTime(row.submitted_at)
	};
}

export async function listChangeRequests(
	user: AuthUser,
	filter: ChangeRequestListFilter
): Promise<ChangeRequestListItem[]> {
	const pool = await getDbPool();
	const viewAll = canViewAllScr(user);
	const req = pool.request();

	let query = `
		SELECT
			scr.[id],
			scr.[request_number],
			scr.[title],
			scr.[status],
			scr.[change_category],
			its.[name_th] AS it_system_name,
			et.[name_th] AS exception_type_name,
			e.[employee_code],
			e.[title_th],
			e.[first_name_th],
			e.[last_name_th],
			scr.[exception_start_date],
			scr.[exception_end_date],
			scr.[submitted_at]
		FROM [one_leave].[system_change_requests] AS scr
		INNER JOIN [one_leave].[it_systems] AS its ON its.[id] = scr.[it_system_id]
		INNER JOIN [one_leave].[exception_types] AS et ON et.[id] = scr.[exception_type_id]
		INNER JOIN [one_leave].[employees] AS e ON e.[id] = scr.[requester_employee_id]
		WHERE 1 = 1
	`;

	if (!viewAll) {
		if (user.employeeId === null) return [];
		req.input('employeeId', user.employeeId);
		query += `
			AND (
				scr.[requester_employee_id] = @employeeId
				OR scr.[supervisor_employee_id] = @employeeId
			)
		`;
	}

	if (filter.status) {
		req.input('status', filter.status);
		query += ' AND scr.[status] = @status';
	}
	if (filter.changeCategory) {
		req.input('changeCategory', filter.changeCategory);
		query += ' AND scr.[change_category] = @changeCategory';
	}
	if (filter.itSystemId !== null) {
		req.input('itSystemId', filter.itSystemId);
		query += ' AND scr.[it_system_id] = @itSystemId';
	}
	if (filter.exceptionTypeId !== null) {
		req.input('exceptionTypeId', filter.exceptionTypeId);
		query += ' AND scr.[exception_type_id] = @exceptionTypeId';
	}

	query += ' ORDER BY scr.[created_at] DESC';

	const result = await req.query<ListRow>(query);
	const items = result.recordset
		.map(mapListRow)
		.filter((r): r is ChangeRequestListItem => r !== null);

	return applyListFilter(items, filter);
}

const DETAIL_SELECT = `
	SELECT
		scr.[id],
		scr.[request_number],
		scr.[requester_user_id],
		scr.[requester_employee_id],
		scr.[supervisor_employee_id],
		scr.[it_system_id],
		its.[code] AS it_system_code,
		its.[name_th] AS it_system_name,
		scr.[exception_type_id],
		et.[code] AS exception_type_code,
		et.[name_th] AS exception_type_name,
		scr.[change_category],
		scr.[title],
		scr.[description],
		scr.[business_justification],
		scr.[risk_assessment],
		scr.[impact_description],
		scr.[compensating_controls],
		scr.[exception_start_date],
		scr.[exception_end_date],
		scr.[rollback_plan],
		scr.[planned_implementation_at],
		scr.[status],
		scr.[submitted_at],
		scr.[supervisor_approved_at],
		scr.[implemented_at],
		scr.[closed_at],
		scr.[test_environment],
		scr.[test_result_summary],
		scr.[implementation_notes],
		scr.[post_review_required],
		scr.[post_review_completed_at],
		req.[employee_code] AS requester_employee_code,
		req.[title_th] AS requester_title_th,
		req.[first_name_th] AS requester_first_name_th,
		req.[last_name_th] AS requester_last_name_th,
		sup.[employee_code] AS supervisor_employee_code,
		sup.[title_th] AS supervisor_title_th,
		sup.[first_name_th] AS supervisor_first_name_th,
		sup.[last_name_th] AS supervisor_last_name_th,
		ou.[name_th] AS org_unit_name,
		scr.[created_at],
		scr.[updated_at]
	FROM [one_leave].[system_change_requests] AS scr
	INNER JOIN [one_leave].[it_systems] AS its ON its.[id] = scr.[it_system_id]
	INNER JOIN [one_leave].[exception_types] AS et ON et.[id] = scr.[exception_type_id]
	INNER JOIN [one_leave].[employees] AS req ON req.[id] = scr.[requester_employee_id]
	LEFT JOIN [one_leave].[employees] AS sup ON sup.[id] = scr.[supervisor_employee_id]
	LEFT JOIN [one_leave].[org_units] AS ou ON ou.[id] = req.[org_unit_id]
`;

interface DetailRow {
	id: number | string;
	request_number: string;
	requester_user_id: number | string;
	requester_employee_id: number | string;
	supervisor_employee_id: number | string | null;
	it_system_id: number | string;
	it_system_code: string;
	it_system_name: string;
	exception_type_id: number | string;
	exception_type_code: string;
	exception_type_name: string;
	change_category: string;
	title: string;
	description: string;
	business_justification: string;
	risk_assessment: string;
	impact_description: string | null;
	compensating_controls: string | null;
	exception_start_date: Date | string;
	exception_end_date: Date | string;
	rollback_plan: string;
	planned_implementation_at: Date | string | null;
	status: string;
	submitted_at: Date | string | null;
	supervisor_approved_at: Date | string | null;
	implemented_at: Date | string | null;
	closed_at: Date | string | null;
	test_environment: string | null;
	test_result_summary: string | null;
	implementation_notes: string | null;
	post_review_required: boolean;
	post_review_completed_at: Date | string | null;
	requester_employee_code: string | null;
	requester_title_th: string | null;
	requester_first_name_th: string;
	requester_last_name_th: string;
	supervisor_employee_code: string | null;
	supervisor_title_th: string | null;
	supervisor_first_name_th: string | null;
	supervisor_last_name_th: string | null;
	org_unit_name: string | null;
	created_at: Date | string;
	updated_at: Date | string;
}

function mapDetailRow(row: DetailRow): ChangeRequestDetail | null {
	const id = toInt(row.id);
	const requesterUserId = toInt(row.requester_user_id);
	const requesterEmployeeId = toInt(row.requester_employee_id);
	const itSystemId = toInt(row.it_system_id);
	const exceptionTypeId = toInt(row.exception_type_id);
	if (
		id === null ||
		requesterUserId === null ||
		requesterEmployeeId === null ||
		itSystemId === null ||
		exceptionTypeId === null
	) {
		return null;
	}

	const changeCategory = asChangeCategory(row.change_category);
	const status = asScrStatus(row.status);

	return {
		id,
		requestNumber: row.request_number,
		requesterUserId,
		requesterEmployeeId,
		supervisorEmployeeId: toInt(row.supervisor_employee_id),
		itSystemId,
		itSystemCode: row.it_system_code,
		itSystemName: row.it_system_name,
		exceptionTypeId,
		exceptionTypeCode: row.exception_type_code,
		exceptionTypeName: row.exception_type_name,
		changeCategory,
		title: row.title,
		description: row.description,
		businessJustification: row.business_justification,
		riskAssessment: row.risk_assessment,
		impactDescription: row.impact_description,
		compensatingControls: row.compensating_controls,
		exceptionStartDate: toDateString(row.exception_start_date) ?? '',
		exceptionEndDate: toDateString(row.exception_end_date) ?? '',
		rollbackPlan: row.rollback_plan,
		plannedImplementationAt: toIsoDateTime(row.planned_implementation_at),
		status,
		submittedAt: toIsoDateTime(row.submitted_at),
		supervisorApprovedAt: toIsoDateTime(row.supervisor_approved_at),
		implementedAt: toIsoDateTime(row.implemented_at),
		closedAt: toIsoDateTime(row.closed_at),
		testEnvironment: row.test_environment,
		testResultSummary: row.test_result_summary,
		implementationNotes: row.implementation_notes,
		postReviewRequired: Boolean(row.post_review_required),
		postReviewCompletedAt: toIsoDateTime(row.post_review_completed_at),
		requesterEmployeeCode: row.requester_employee_code ?? null,
		requesterName: formatEmployeeName(
			row.requester_title_th,
			row.requester_first_name_th,
			row.requester_last_name_th
		),
		supervisorEmployeeCode: row.supervisor_employee_code ?? null,
		supervisorName:
			row.supervisor_first_name_th !== null
				? formatEmployeeName(
						row.supervisor_title_th,
						row.supervisor_first_name_th,
						row.supervisor_last_name_th ?? ''
					)
				: null,
		orgUnitName: row.org_unit_name,
		createdAt: toIsoDateTime(row.created_at) ?? '',
		updatedAt: toIsoDateTime(row.updated_at) ?? ''
	};
}

export async function getChangeRequestById(id: number): Promise<ChangeRequestDetail | null> {
	const pool = await getDbPool();
	const result = await pool
		.request()
		.input('id', id)
		.query<DetailRow>(`${DETAIL_SELECT} WHERE scr.[id] = @id`);

	const row = result.recordset[0];
	return row ? mapDetailRow(row) : null;
}

export async function allocateRequestNumber(
	transaction: PgTransaction,
	exceptionStartDate: string
): Promise<string> {
	const [y, m] = exceptionStartDate.split('-');
	const prefix = `SCR-${y}-${m}-`;
	const result = await new PgRequest(transaction)
		.input('prefix', `${prefix}%`)
		.query<{ request_number: string }>(`
			SELECT TOP (1) [request_number]
			FROM [one_leave].[system_change_requests]
			WHERE [request_number] LIKE @prefix
			ORDER BY [request_number] DESC
		`);

	const last = result.recordset[0]?.request_number;
	let seq = 1;
	if (last?.startsWith(prefix)) {
		const tail = Number.parseInt(last.slice(prefix.length), 10);
		if (Number.isFinite(tail)) seq = tail + 1;
	}

	return `${prefix}${String(seq).padStart(4, '0')}`;
}

function snapshotWrite(
	requestNumber: string,
	input: ChangeRequestWriteInput
): Record<string, unknown> {
	return {
		requestNumber,
		title: input.title,
		exceptionTypeId: input.exceptionTypeId,
		itSystemId: input.itSystemId,
		changeCategory: input.changeCategory,
		exceptionStartDate: input.exceptionStartDate,
		exceptionEndDate: input.exceptionEndDate,
		intent: input.intent
	};
}

function snapshotDetail(record: ChangeRequestDetail): Record<string, unknown> {
	return {
		requestNumber: record.requestNumber,
		title: record.title,
		status: record.status,
		changeCategory: record.changeCategory,
		itSystemId: record.itSystemId,
		exceptionTypeId: record.exceptionTypeId
	};
}

function buildSummary(action: string, requestNumber: string, title?: string): string {
	const ref = title ? `${requestNumber} (${title})` : requestNumber;
	switch (action) {
		case 'create':
			return `สร้างคำขอเปลี่ยนแปลงระบบ ${ref}`;
		case 'submit':
			return `ส่งคำขอเปลี่ยนแปลงระบบ ${ref}`;
		case 'update':
			return `แก้ไขคำขอเปลี่ยนแปลงระบบ ${ref}`;
		default:
			return `${action} คำขอเปลี่ยนแปลงระบบ ${ref}`;
	}
}

export interface CreateChangeRequestResult {
	id: number;
}

export async function createChangeRequest(
	user: AuthUser,
	input: ChangeRequestWriteInput,
	audit?: AuditContext
): Promise<CreateChangeRequestResult> {
	if (user.employeeId === null) {
		throw new Error('บัญชีไม่ผูกข้อมูลพนักงาน');
	}

	const employee = await getEmployeeById(user.employeeId);
	if (!employee) throw new Error('ไม่พบข้อมูลพนักงาน');

	if (input.intent === 'submit' && input.changeCategory !== 'emergency' && employee.supervisorEmployeeId === null) {
		throw new Error('ไม่พบหัวหน้างาน — ติดต่อ HR ตั้งค่าสายอนุมัติ');
	}

	const status = input.intent === 'submit' ? 'submitted' : 'draft';
	const submittedAt = input.intent === 'submit' ? new Date() : null;

	const pool = await getDbPool();
	const transaction = new PgTransaction(pool);
	await transaction.begin();

	try {
		const requestNumber = await allocateRequestNumber(transaction, input.exceptionStartDate);

		const insert = await new PgRequest(transaction)
			.input('requestNumber', requestNumber)
			.input('requesterUserId', user.id)
			.input('requesterEmployeeId', user.employeeId)
			.input('supervisorEmployeeId', employee.supervisorEmployeeId)
			.input('itSystemId', input.itSystemId)
			.input('exceptionTypeId', input.exceptionTypeId)
			.input('changeCategory', input.changeCategory)
			.input('title', input.title)
			.input('description', input.description)
			.input('businessJustification', input.businessJustification)
			.input('riskAssessment', input.riskAssessment)
			.input('impactDescription', input.impactDescription)
			.input('compensatingControls', input.compensatingControls)
			.input('exceptionStartDate', input.exceptionStartDate)
			.input('exceptionEndDate', input.exceptionEndDate)
			.input('rollbackPlan', input.rollbackPlan)
			.input('plannedImplementationAt', sql.DateTime2, toSqlDateTime(input.plannedImplementationAt))
			.input('status', status)
			.input('submittedAt', sql.DateTime2, submittedAt).query<{ id: number | string }>(`
				INSERT INTO [one_leave].[system_change_requests] (
					[request_number], [requester_user_id], [requester_employee_id], [supervisor_employee_id],
					[it_system_id], [exception_type_id], [change_category], [title], [description],
					[business_justification], [risk_assessment], [impact_description], [compensating_controls],
					[exception_start_date], [exception_end_date], [rollback_plan], [planned_implementation_at],
					[status], [submitted_at]
				)
				OUTPUT INSERTED.[id]
				VALUES (
					@requestNumber, @requesterUserId, @requesterEmployeeId, @supervisorEmployeeId,
					@itSystemId, @exceptionTypeId, @changeCategory, @title, @description,
					@businessJustification, @riskAssessment, @impactDescription, @compensatingControls,
					@exceptionStartDate, @exceptionEndDate, @rollbackPlan, @plannedImplementationAt,
					@status, @submittedAt
				)
			`);

		const id = toInt(insert.recordset[0]?.id);
		if (id === null) {
			throw new Error('สร้างคำขอไม่สำเร็จ');
		}

		if (input.intent === 'submit') {
			await insertScrApprovalRow(transaction, {
				scrId: id,
				actorUserId: user.id,
				actorRole: 'requester',
				actionType: 'submit',
				fromStatus: 'draft',
				toStatus: 'submitted',
				stepOrder: 1,
				comment: null,
				ipAddress: audit?.ipAddress ?? null
			});
		}

		if (audit) {
			const action = input.intent === 'submit' ? 'submit' : 'create';
			await writeAuditLog(
				audit,
				{
					entityType: 'system_change_request',
					entityId: id,
					action,
					before: null,
					after: { ...snapshotWrite(requestNumber, input), status },
					summary: buildSummary(action, requestNumber, input.title)
				},
				transaction
			);
		}

		await transaction.commit();
		return { id };
	} catch (err: unknown) {
		await rollbackTransaction(transaction);
		throw err;
	}
}

export async function updateChangeRequest(
	user: AuthUser,
	id: number,
	input: ChangeRequestWriteInput,
	audit?: AuditContext
): Promise<void> {
	const existing = await getChangeRequestById(id);
	if (!existing) throw new Error('ไม่พบคำขอเปลี่ยนแปลงระบบ');
	if (existing.status !== 'draft') {
		throw new Error('แก้ไขได้เฉพาะคำขอร่าง');
	}
	if (user.employeeId === null || user.employeeId !== existing.requesterEmployeeId) {
		throw new Error('แก้ไขได้เฉพาะคำขอร่างของตนเอง');
	}

	const employee = await getEmployeeById(user.employeeId);
	if (!employee) throw new Error('ไม่พบข้อมูลพนักงาน');

	const pool = await getDbPool();
	const transaction = new PgTransaction(pool);
	await transaction.begin();

	try {
		await new PgRequest(transaction)
			.input('id', id)
			.input('supervisorEmployeeId', employee.supervisorEmployeeId)
			.input('itSystemId', input.itSystemId)
			.input('exceptionTypeId', input.exceptionTypeId)
			.input('changeCategory', input.changeCategory)
			.input('title', input.title)
			.input('description', input.description)
			.input('businessJustification', input.businessJustification)
			.input('riskAssessment', input.riskAssessment)
			.input('impactDescription', input.impactDescription)
			.input('compensatingControls', input.compensatingControls)
			.input('exceptionStartDate', input.exceptionStartDate)
			.input('exceptionEndDate', input.exceptionEndDate)
			.input('rollbackPlan', input.rollbackPlan)
			.input('plannedImplementationAt', sql.DateTime2, toSqlDateTime(input.plannedImplementationAt)).query(`
				UPDATE [one_leave].[system_change_requests]
				SET
					[supervisor_employee_id] = @supervisorEmployeeId,
					[it_system_id] = @itSystemId,
					[exception_type_id] = @exceptionTypeId,
					[change_category] = @changeCategory,
					[title] = @title,
					[description] = @description,
					[business_justification] = @businessJustification,
					[risk_assessment] = @riskAssessment,
					[impact_description] = @impactDescription,
					[compensating_controls] = @compensatingControls,
					[exception_start_date] = @exceptionStartDate,
					[exception_end_date] = @exceptionEndDate,
					[rollback_plan] = @rollbackPlan,
					[planned_implementation_at] = @plannedImplementationAt,
					[updated_at] = SYSUTCDATETIME()
				WHERE [id] = @id AND [status] = N'draft'
			`);

		if (audit) {
			await writeAuditLog(
				audit,
				{
					entityType: 'system_change_request',
					entityId: id,
					action: 'update',
					before: snapshotDetail(existing),
					after: snapshotWrite(existing.requestNumber, input),
					summary: buildSummary('update', existing.requestNumber, input.title)
				},
				transaction
			);
		}

		await transaction.commit();
	} catch (err: unknown) {
		await rollbackTransaction(transaction);
		throw err;
	}
}

export async function listApprovalHistory(scrId: number): Promise<ApprovalHistoryItem[]> {
	const pool = await getDbPool();
	const result = await pool.request().input('scrId', scrId).query<{
		id: number | string;
		step_order: number | string;
		actor_role: string;
		actor_display: string | null;
		action_type: string;
		from_status: string;
		to_status: string;
		comment: string | null;
		acted_at: Date | string;
	}>(`
		SELECT
			sca.[id],
			sca.[step_order],
			sca.[actor_role],
			COALESCE(
				NULLIF(TRIM(RTRIM(CONCAT(e.[title_th], N' ', e.[first_name_th], N' ', e.[last_name_th]))), N''),
				u.[username]
			) AS actor_display,
			sca.[action_type],
			sca.[from_status],
			sca.[to_status],
			sca.[comment],
			sca.[acted_at]
		FROM [one_leave].[system_change_approvals] AS sca
		LEFT JOIN [one_leave].[users] AS u ON u.[id] = sca.[actor_user_id]
		LEFT JOIN [one_leave].[employees] AS e ON e.[id] = u.[employee_id]
		WHERE sca.[system_change_request_id] = @scrId
		ORDER BY sca.[acted_at] ASC, sca.[step_order] ASC
	`);

	return result.recordset.map((row) => {
		const id = toInt(row.id);
		const fromStatus = asScrStatus(row.from_status);
		const toStatus = asScrStatus(row.to_status);
		return {
			id: id ?? 0,
			stepOrder: Number(row.step_order),
			actorRole: row.actor_role,
			actorDisplayName: row.actor_display,
			actionType: row.action_type,
			fromStatus,
			toStatus,
			fromStatusLabel: labelScrStatus(fromStatus),
			toStatusLabel: labelScrStatus(toStatus),
			comment: row.comment,
			actedAt: toIsoDateTime(row.acted_at) ?? ''
		};
	});
}

export async function countByStatus(user: AuthUser): Promise<ScrQueueCounts> {
	const pool = await getDbPool();
	let supervisorPending = 0;
	let itPending = 0;

	if (user.employeeId !== null) {
		const supResult = await pool
			.request()
			.input('supervisorEmployeeId', user.employeeId).query<{ n: number | string }>(`
				SELECT COUNT(*) AS n
				FROM [one_leave].[system_change_requests]
				WHERE [status] = N'submitted'
				  AND [supervisor_employee_id] = @supervisorEmployeeId
				  AND [requester_employee_id] <> @supervisorEmployeeId
			`);
		supervisorPending = Number(supResult.recordset[0]?.n ?? 0);
	}

	if (canViewAllScr(user) || user.roles.includes('admin')) {
		const req = pool.request();
		let sodFilter = '';
		if (user.employeeId !== null) {
			req.input('actorEmployeeId', user.employeeId);
			sodFilter = ' AND [requester_employee_id] <> @actorEmployeeId';
		}
		req.input('actorUserId', user.id);
		sodFilter += ' AND [requester_user_id] <> @actorUserId';

		const itResult = await req.query<{ n: number | string }>(`
			SELECT COUNT(*) AS n
			FROM [one_leave].[system_change_requests]
			WHERE [status] = N'supervisor_approved'
			${sodFilter}
		`);
		itPending = Number(itResult.recordset[0]?.n ?? 0);
	}

	return { supervisorPending, itPending };
}

export async function listChangeRequestsForExport(
	user: AuthUser,
	filter: ChangeRequestListFilter
): Promise<import('$lib/server/one-leave/change-request/types.js').ChangeRequestExportRow[]> {
	const pool = await getDbPool();
	const viewAll = canViewAllScr(user);
	const req = pool.request();

	let query = `
		SELECT
			scr.[request_number],
			scr.[title],
			scr.[description],
			scr.[business_justification],
			scr.[risk_assessment],
			scr.[compensating_controls],
			scr.[status],
			scr.[change_category],
			its.[name_th] AS it_system_name,
			et.[name_th] AS exception_type_name,
			e.[employee_code],
			e.[title_th],
			e.[first_name_th],
			e.[last_name_th],
			se.[title_th] AS supervisor_title_th,
			se.[first_name_th] AS supervisor_first_name,
			se.[last_name_th] AS supervisor_last_name,
			scr.[exception_start_date],
			scr.[exception_end_date],
			scr.[submitted_at],
			scr.[supervisor_approved_at],
			scr.[implemented_at],
			scr.[closed_at],
			CASE WHEN EXISTS (
				SELECT 1 FROM [one_leave].[system_change_attachments] AS a
				WHERE a.[system_change_request_id] = scr.[id]
				  AND a.[attachment_type] = N'test_evidence'
			) THEN 1 ELSE 0 END AS has_test_evidence
		FROM [one_leave].[system_change_requests] AS scr
		INNER JOIN [one_leave].[it_systems] AS its ON its.[id] = scr.[it_system_id]
		INNER JOIN [one_leave].[exception_types] AS et ON et.[id] = scr.[exception_type_id]
		INNER JOIN [one_leave].[employees] AS e ON e.[id] = scr.[requester_employee_id]
		LEFT JOIN [one_leave].[employees] AS se ON se.[id] = scr.[supervisor_employee_id]
		WHERE 1 = 1
	`;

	if (!viewAll) {
		if (user.employeeId === null) return [];
		req.input('employeeId', user.employeeId);
		query += `
			AND (
				scr.[requester_employee_id] = @employeeId
				OR scr.[supervisor_employee_id] = @employeeId
			)
		`;
	}

	if (filter.status) {
		req.input('status', filter.status);
		query += ' AND scr.[status] = @status';
	}
	if (filter.changeCategory) {
		req.input('changeCategory', filter.changeCategory);
		query += ' AND scr.[change_category] = @changeCategory';
	}
	if (filter.itSystemId) {
		req.input('itSystemId', filter.itSystemId);
		query += ' AND scr.[it_system_id] = @itSystemId';
	}
	if (filter.exceptionTypeId) {
		req.input('exceptionTypeId', filter.exceptionTypeId);
		query += ' AND scr.[exception_type_id] = @exceptionTypeId';
	}
	if (filter.q) {
		req.input('q', `%${filter.q}%`);
		query += `
			AND (
				scr.[request_number] LIKE @q
				OR scr.[title] LIKE @q
				OR its.[name_th] LIKE @q
				OR e.[employee_code] LIKE @q
				OR e.[first_name_th] LIKE @q
				OR e.[last_name_th] LIKE @q
			)
		`;
	}

	query += ' ORDER BY scr.[submitted_at] DESC, scr.[id] DESC';

	const result = await req.query<{
		request_number: string;
		title: string;
		description: string;
		business_justification: string;
		risk_assessment: string;
		compensating_controls: string | null;
		status: string;
		change_category: string;
		it_system_name: string;
		exception_type_name: string;
		employee_code: string;
		title_th: string | null;
		first_name_th: string;
		last_name_th: string;
		supervisor_title_th: string | null;
		supervisor_first_name: string | null;
		supervisor_last_name: string | null;
		exception_start_date: Date | string;
		exception_end_date: Date | string;
		submitted_at: Date | string | null;
		supervisor_approved_at: Date | string | null;
		implemented_at: Date | string | null;
		closed_at: Date | string | null;
		has_test_evidence: number | boolean;
	}>(query);

	return result.recordset.map((row) => {
		const status = asScrStatus(row.status);
		const changeCategory = asChangeCategory(row.change_category);
		const supervisorName =
			row.supervisor_first_name && row.supervisor_last_name
				? formatEmployeeName(
						row.supervisor_title_th,
						row.supervisor_first_name,
						row.supervisor_last_name
					)
				: '';
		return {
			requestNumber: row.request_number,
			title: row.title,
			descriptionSummary: truncateForExport(row.description),
			businessJustificationSummary: truncateForExport(row.business_justification),
			riskAssessmentSummary: truncateForExport(row.risk_assessment),
			compensatingControlsSummary: truncateForExport(row.compensating_controls),
			status,
			statusLabel: labelScrStatus(status),
			changeCategory,
			changeCategoryLabel: labelChangeCategory(changeCategory),
			itSystemName: row.it_system_name,
			exceptionTypeName: row.exception_type_name,
			requesterEmployeeCode: row.employee_code,
			requesterName: formatEmployeeName(row.title_th, row.first_name_th, row.last_name_th),
			supervisorName,
			exceptionStartDate: toDateString(row.exception_start_date) ?? '',
			exceptionEndDate: toDateString(row.exception_end_date) ?? '',
			submittedAt: toIsoDateTime(row.submitted_at) ?? '',
			supervisorApprovedAt: toIsoDateTime(row.supervisor_approved_at) ?? '',
			implementedAt: toIsoDateTime(row.implemented_at) ?? '',
			closedAt: toIsoDateTime(row.closed_at) ?? '',
			hasTestEvidence: row.has_test_evidence ? 'ใช่' : 'ไม่'
		};
	});
}
