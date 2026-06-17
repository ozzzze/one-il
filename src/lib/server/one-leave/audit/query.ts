import { getDbPool } from "$lib/server/one-leave/db/pool.js";
import { isLeaveAuthMockEnabled } from "$lib/server/one-leave/mock-auth.js";

export const AUDIT_LOG_PAGE_SIZE = 10;

export interface AuditLogFilter {
	from: string;
	to: string;
	entityType: string;
	action: string;
	q: string;
}

export interface AuditLogListItem {
	id: number;
	entityType: string;
	entityId: number;
	action: string;
	userId: number | null;
	roleCode: string | null;
	ipAddress: string | null;
	summary: string | null;
	createdAt: string;
	actorDisplayName: string | null;
	actorUsername: string | null;
}

export interface AuditLogDetail extends AuditLogListItem {
	beforeJson: string | null;
	afterJson: string | null;
}

export interface AuditLogPage {
	items: AuditLogListItem[];
	total: number;
	page: number;
	pageSize: number;
}

export function parseAuditFilter(params: URLSearchParams): AuditLogFilter {
	const today = new Date().toISOString().slice(0, 10);
	const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
	return {
		from: params.get("from")?.trim() || thirtyDaysAgo,
		to: params.get("to")?.trim() || today,
		entityType: params.get("entityType")?.trim() ?? "",
		action: params.get("action")?.trim() ?? "",
		q: params.get("q")?.trim() ?? "",
	};
}

function toInt(value: number | string | null | undefined): number | null {
	if (value === null || value === undefined) return null;
	const n = typeof value === "number" ? value : Number.parseInt(String(value), 10);
	return Number.isFinite(n) ? n : null;
}

function toIsoString(value: Date | string | null | undefined): string | null {
	if (value === null || value === undefined) return null;
	if (value instanceof Date) return value.toISOString();
	return String(value);
}

const MOCK_AUDIT_LOGS: AuditLogListItem[] = [
	{
		id: 13,
		entityType: "system_change_request",
		entityId: 42,
		action: "submit",
		userId: 3,
		roleCode: "employee",
		ipAddress: "192.168.1.15",
		summary: "ส่งคำขอเปลี่ยนแปลงระบบ SCR-2026-06-0042",
		createdAt: "2026-05-26T09:10:00.000Z",
		actorDisplayName: "staff.demo",
		actorUsername: "staff.demo",
	},
	{
		id: 12,
		entityType: "leave_request",
		entityId: 202,
		action: "grant",
		userId: 5,
		roleCode: "grantor_director",
		ipAddress: "192.168.1.30",
		summary: "ผู้อำนวยการอนุมัติใบลาพักผ่อนขั้นสุดท้าย",
		createdAt: "2026-05-26T09:10:00.000Z",
		actorDisplayName: "director.demo",
		actorUsername: "director.demo",
	},
	{
		id: 11,
		entityType: "leave_request",
		entityId: 202,
		action: "verify",
		userId: 2,
		roleCode: "hr_verifier",
		ipAddress: "192.168.1.20",
		summary: "HR ตรวจสอบใบลาพักผ่อนเรียบร้อย",
		createdAt: "2026-05-26T08:55:00.000Z",
		actorDisplayName: "hr.demo",
		actorUsername: "hr.demo",
	},
];

export async function listAuditLogs(filter: AuditLogFilter, page: number): Promise<AuditLogPage> {
	if (isLeaveAuthMockEnabled()) {
		let filtered = [...MOCK_AUDIT_LOGS];
		if (filter.entityType) {
			filtered = filtered.filter((x) => x.entityType === filter.entityType);
		}
		if (filter.action) {
			filtered = filtered.filter((x) =>
				x.action.toLowerCase().includes(filter.action.toLowerCase()),
			);
		}
		if (filter.q) {
			const queryStr = filter.q.toLowerCase();
			filtered = filtered.filter(
				(x) =>
					(x.summary && x.summary.toLowerCase().includes(queryStr)) ||
					String(x.entityId).includes(queryStr) ||
					(x.actorUsername && x.actorUsername.toLowerCase().includes(queryStr)) ||
					(x.actorDisplayName && x.actorDisplayName.toLowerCase().includes(queryStr)),
			);
		}

		const total = Math.min(50, filtered.length);
		const offset = (Math.max(1, page) - 1) * AUDIT_LOG_PAGE_SIZE;
		const items = filtered.slice(offset, offset + AUDIT_LOG_PAGE_SIZE);

		return { items, total, page, pageSize: AUDIT_LOG_PAGE_SIZE };
	}

	const pool = await getDbPool();
	const offset = (Math.max(1, page) - 1) * AUDIT_LOG_PAGE_SIZE;

	const req = pool.request();
	req.input("from", filter.from);
	req.input("to", filter.to + "T23:59:59");
	req.input("offset", offset);
	req.input("pageSize", AUDIT_LOG_PAGE_SIZE);

	let where = `al.[created_at] >= @from AND al.[created_at] <= @to`;

	if (filter.entityType) {
		req.input("entityType", filter.entityType);
		where += ` AND al.[entity_type] = @entityType`;
	}
	if (filter.action) {
		req.input("action", filter.action);
		where += ` AND al.[action] = @action`;
	}
	if (filter.q) {
		req.input("q", `%${filter.q}%`);
		where += ` AND (al.[summary] LIKE @q OR CAST(al.[entity_id] AS VARCHAR) LIKE @q OR u.[username] LIKE @q)`;
	}

	const countResult = await req.query<{ total: number }>(`
		SELECT COUNT(*) AS total
		FROM [one_leave].[audit_logs] AS al
		LEFT JOIN [one_leave].[users] AS u ON u.[id] = al.[user_id]
		WHERE ${where}
	`);

	const total = Math.min(50, countResult.recordset[0]?.total ?? 0);

	if (offset >= 50) {
		return { items: [], total, page, pageSize: AUDIT_LOG_PAGE_SIZE };
	}

	const listResult = await req.query<{
		id: number | string;
		entity_type: string;
		entity_id: number | string;
		action: string;
		user_id: number | string | null;
		role_code: string | null;
		ip_address: string | null;
		summary: string | null;
		created_at: Date | string;
		display_name: string | null;
		username: string | null;
	}>(`
		SELECT
			al.[id],
			al.[entity_type],
			al.[entity_id],
			al.[action],
			al.[user_id],
			al.[role_code],
			al.[ip_address],
			al.[summary],
			al.[created_at],
			COALESCE(e.[first_name_th] || ' ' || e.[last_name_th], u.[username]) AS display_name,
			u.[username]
		FROM [one_leave].[audit_logs] AS al
		LEFT JOIN [one_leave].[users] AS u ON u.[id] = al.[user_id]
		LEFT JOIN [one_leave].[employees] AS e ON e.[id] = u.[employee_id]
		WHERE ${where}
		ORDER BY al.[created_at] DESC
		OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY
	`);

	const items = listResult.recordset
		.map((row) => {
			const id = toInt(row.id);
			const entityId = toInt(row.entity_id);
			if (id === null || entityId === null) return null;
			return {
				id,
				entityType: row.entity_type,
				entityId,
				action: row.action,
				userId: toInt(row.user_id),
				roleCode: row.role_code,
				ipAddress: row.ip_address,
				summary: row.summary,
				createdAt: toIsoString(row.created_at) ?? "",
				actorDisplayName: row.display_name,
				actorUsername: row.username,
			} satisfies AuditLogListItem;
		})
		.filter((r): r is AuditLogListItem => r !== null);

	return { items, total, page, pageSize: AUDIT_LOG_PAGE_SIZE };
}

export async function getAuditLogById(id: number): Promise<AuditLogDetail | null> {
	if (isLeaveAuthMockEnabled()) {
		const item = MOCK_AUDIT_LOGS.find((x) => x.id === id);
		if (!item) return null;
		return {
			...item,
			beforeJson: JSON.stringify({ status: "draft", remark: item.summary }),
			afterJson: JSON.stringify({ status: "success", remark: item.summary }),
		};
	}

	const pool = await getDbPool();
	const result = await pool.request().input("id", id).query<{
		id: number | string;
		entity_type: string;
		entity_id: number | string;
		action: string;
		user_id: number | string | null;
		role_code: string | null;
		ip_address: string | null;
		summary: string | null;
		before_json: string | null;
		after_json: string | null;
		created_at: Date | string;
		display_name: string | null;
		username: string | null;
	}>(`
		SELECT
			al.[id],
			al.[entity_type],
			al.[entity_id],
			al.[action],
			al.[user_id],
			al.[role_code],
			al.[ip_address],
			al.[summary],
			al.[before_json],
			al.[after_json],
			al.[created_at],
			COALESCE(e.[first_name_th] || ' ' || e.[last_name_th], u.[username]) AS display_name,
			u.[username]
		FROM [one_leave].[audit_logs] AS al
		LEFT JOIN [one_leave].[users] AS u ON u.[id] = al.[user_id]
		LEFT JOIN [one_leave].[employees] AS e ON e.[id] = u.[employee_id]
		WHERE al.[id] = @id
	`);

	const row = result.recordset[0];
	if (!row) return null;
	const id_ = toInt(row.id);
	const entityId = toInt(row.entity_id);
	if (id_ === null || entityId === null) return null;

	return {
		id: id_,
		entityType: row.entity_type,
		entityId,
		action: row.action,
		userId: toInt(row.user_id),
		roleCode: row.role_code,
		ipAddress: row.ip_address,
		summary: row.summary,
		beforeJson: row.before_json,
		afterJson: row.after_json,
		createdAt: toIsoString(row.created_at) ?? "",
		actorDisplayName: row.display_name,
		actorUsername: row.username,
	};
}

export const AUDIT_ENTITY_TYPES = [
	{ value: "", label: "ทุกประเภท" },
	{ value: "employee", label: "พนักงาน" },
	{ value: "leave_request", label: "ใบลา" },
	{ value: "system_change_request", label: "คำขอเปลี่ยนแปลงระบบ" },
	{ value: "leave_attachment", label: "ไฟล์แนบใบลา" },
	{ value: "org_unit", label: "หน่วยงาน" },
	{ value: "user", label: "บัญชีผู้ใช้" },
	{ value: "fiscal_year", label: "ปีงบประมาณ" },
	{ value: "working_calendar", label: "ปฏิทิน" },
	{ value: "leave_type", label: "ประเภทลา" },
	{ value: "system_settings", label: "ตั้งค่าระบบ" },
] as const;
