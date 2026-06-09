import { formatEmployeeName } from "$lib/org/labels.js";
import { getDbPool } from "$lib/server/one-leave/db/pool.js";
import type { AuthUser } from "$lib/server/one-leave/auth/types.js";
import { canItReview } from "$lib/server/one-leave/change-request/access.js";
import {
	labelChangeCategory,
	labelScrStatus,
} from "$lib/server/one-leave/change-request/labels.js";
import type { ScrQueueItem } from "$lib/server/one-leave/change-request/types.js";

function toInt(value: number | string | null | undefined): number | null {
	if (value === null || value === undefined) return null;
	const n = typeof value === "number" ? value : Number.parseInt(String(value), 10);
	return Number.isFinite(n) ? n : null;
}

function toDateString(value: Date | string | null | undefined): string | null {
	if (value === null || value === undefined) return null;
	if (value instanceof Date) return value.toISOString().slice(0, 10);
	return String(value).slice(0, 10);
}

function toIso(value: Date | string | null | undefined): string | null {
	if (value === null || value === undefined) return null;
	if (value instanceof Date) return value.toISOString();
	return String(value);
}

interface QueueRow {
	id: number | string;
	request_number: string;
	title: string;
	status: string;
	change_category: string;
	it_system_name: string;
	employee_code: string | null;
	title_th: string | null;
	first_name_th: string;
	last_name_th: string;
	exception_start_date: Date | string;
	exception_end_date: Date | string;
	submitted_at: Date | string | null;
	updated_at: Date | string | null;
}

const QUEUE_SELECT = `
	SELECT
		scr.[id],
		scr.[request_number],
		scr.[title],
		scr.[status],
		scr.[change_category],
		its.[name_th] AS it_system_name,
		e.[employee_code],
		e.[title_th],
		e.[first_name_th],
		e.[last_name_th],
		scr.[exception_start_date],
		scr.[exception_end_date],
		scr.[submitted_at],
		scr.[updated_at]
	FROM [one_leave].[system_change_requests] AS scr
	INNER JOIN [one_leave].[it_systems] AS its ON its.[id] = scr.[it_system_id]
	INNER JOIN [one_leave].[employees] AS e ON e.[id] = scr.[requester_employee_id]
`;

function mapQueueRow(row: QueueRow): ScrQueueItem | null {
	const id = toInt(row.id);
	if (id === null) return null;
	return {
		id,
		requestNumber: row.request_number,
		title: row.title,
		status: row.status as ScrQueueItem["status"],
		statusLabel: labelScrStatus(row.status),
		changeCategory: row.change_category as ScrQueueItem["changeCategory"],
		changeCategoryLabel: labelChangeCategory(row.change_category),
		itSystemName: row.it_system_name,
		requesterEmployeeCode: row.employee_code ?? null,
		requesterName: formatEmployeeName(row.title_th, row.first_name_th, row.last_name_th),
		exceptionStartDate: toDateString(row.exception_start_date) ?? "",
		exceptionEndDate: toDateString(row.exception_end_date) ?? "",
		submittedAt: toIso(row.submitted_at),
		updatedAt: toIso(row.updated_at),
	};
}

export async function listSupervisorQueue(user: AuthUser): Promise<ScrQueueItem[]> {
	if (user.employeeId === null) return [];

	const pool = await getDbPool();
	const result = await pool.request().input("supervisorEmployeeId", user.employeeId)
		.query<QueueRow>(`
			${QUEUE_SELECT}
			WHERE scr.[status] = N'submitted'
			  AND scr.[supervisor_employee_id] = @supervisorEmployeeId
			  AND scr.[requester_employee_id] <> @supervisorEmployeeId
			ORDER BY scr.[submitted_at] ASC, scr.[id] ASC
		`);

	return result.recordset.map(mapQueueRow).filter((r): r is ScrQueueItem => r !== null);
}

export async function listItQueue(user: AuthUser): Promise<ScrQueueItem[]> {
	if (!canItReview(user)) return [];

	const pool = await getDbPool();
	const req = pool.request();

	let sodFilter = "";
	if (user.employeeId !== null) {
		req.input("actorEmployeeId", user.employeeId);
		sodFilter = " AND scr.[requester_employee_id] <> @actorEmployeeId";
	}
	req.input("actorUserId", user.id);
	sodFilter += " AND scr.[requester_user_id] <> @actorUserId";

	const result = await req.query<QueueRow>(`
		${QUEUE_SELECT}
		WHERE scr.[status] = N'supervisor_approved'
		${sodFilter}
		ORDER BY scr.[supervisor_approved_at] ASC, scr.[id] ASC
	`);

	return result.recordset.map(mapQueueRow).filter((r): r is ScrQueueItem => r !== null);
}
