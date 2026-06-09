import { leaveQuery, withLeaveTransaction } from "$lib/server/one-leave/pg.js";
import { writeAdminAudit } from "$lib/server/one-leave/admin/audit.js";
import {
	AdminActionError,
	type AdminActor,
	type AdminEmployeeRow,
	type CreateEmployeeInput,
	type OrgUnitOption,
	type UpdateEmployeeInput,
} from "$lib/server/one-leave/admin/types.js";

type EmployeeDbRow = {
	id: string | number;
	employee_code: string;
	title_th: string | null;
	first_name_th: string;
	last_name_th: string;
	org_unit_id: string | number | null;
	org_unit_name: string | null;
	org_unit_name_en: string | null;
	job_position_title: string | null;
	employee_line: string;
	employment_category: string;
	email: string | null;
	is_active: boolean;
};

function toInt(value: string | number | null | undefined): number | null {
	if (value === null || value === undefined) return null;
	const n = typeof value === "number" ? value : Number.parseInt(String(value), 10);
	return Number.isFinite(n) ? n : null;
}

function mapEmployeeRow(row: EmployeeDbRow): AdminEmployeeRow {
	const id = toInt(row.id);
	if (id === null) throw new Error("Invalid one_leave.employees id");
	return {
		id,
		employeeCode: row.employee_code,
		titleTh: row.title_th,
		firstNameTh: row.first_name_th,
		lastNameTh: row.last_name_th,
		orgUnitId: toInt(row.org_unit_id),
		orgUnitName: row.org_unit_name,
		orgUnitNameEn: row.org_unit_name_en,
		positionTitle: row.job_position_title,
		employeeLine: row.employee_line,
		employmentCategory: row.employment_category,
		email: row.email,
		isActive: Boolean(row.is_active),
	};
}

export async function listLeaveEmployees(): Promise<AdminEmployeeRow[]> {
	const { rows } = await leaveQuery<EmployeeDbRow>(
		`
		SELECT
			e.id,
			e.employee_code,
			e.title_th,
			e.first_name_th,
			e.last_name_th,
			e.org_unit_id,
			o.name_th AS org_unit_name,
			o.name_en AS org_unit_name_en,
			e.job_position_title,
			e.employee_line,
			e.employment_category,
			e.email,
			e.is_active
		FROM one_leave.employees AS e
		LEFT JOIN one_leave.org_units AS o ON o.id = e.org_unit_id
		ORDER BY e.first_name_th, e.last_name_th
		`
	);
	return rows.map(mapEmployeeRow);
}

export async function listOrgUnits(): Promise<OrgUnitOption[]> {
	const { rows } = await leaveQuery<{
		id: string | number;
		code: string | null;
		name_th: string | null;
		name_en: string | null;
	}>(
		`SELECT id, code, name_th, name_en
		 FROM one_leave.org_units
		 WHERE is_active = true
		 ORDER BY sort_order, name_th`
	);
	return rows.map((r) => ({
		id: toInt(r.id) ?? 0,
		code: r.code,
		name: r.name_th,
		nameEn: r.name_en,
	}));
}

async function employeeCodeExists(code: string, excludeId?: number): Promise<boolean> {
	const { rows } = await leaveQuery<{ id: number }>(
		`SELECT id FROM one_leave.employees WHERE employee_code = $1 AND ($2::bigint IS NULL OR id <> $2) LIMIT 1`,
		[code, excludeId ?? null]
	);
	return rows.length > 0;
}

export async function createLeaveEmployee(
	actor: AdminActor,
	input: CreateEmployeeInput
): Promise<{ id: number }> {
	const code = input.employeeCode.trim();
	if (!code) throw new AdminActionError("invalid_code", "Employee code is required");
	if (!input.firstNameTh.trim() || !input.lastNameTh.trim()) {
		throw new AdminActionError("invalid_name", "First and last name are required");
	}
	if (await employeeCodeExists(code)) {
		throw new AdminActionError("duplicate_code", "Employee code already exists");
	}

	return withLeaveTransaction(async (client) => {
		const inserted = await client.query<{ id: string | number }>(
			`INSERT INTO one_leave.employees
				(employee_code, title_th, first_name_th, last_name_th, org_unit_id,
				 job_position_title, employee_line, employment_category, hire_date, email, is_active)
			 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
			 RETURNING id`,
			[
				code,
				input.titleTh ?? null,
				input.firstNameTh.trim(),
				input.lastNameTh.trim(),
				input.orgUnitId,
				input.positionTitle ?? null,
				input.employeeLine,
				input.employmentCategory,
				input.hireDate,
				input.email ?? null,
				input.isActive ?? true,
			]
		);
		const id = toInt(inserted.rows[0]?.id);
		if (id === null) throw new Error("Failed to create employee");

		await writeAdminAudit(client, {
			actorUserId: actor.leaveUserId,
			actorUsername: actor.username,
			action: "employee.create",
			targetUserId: null,
			detail: { employeeId: id, employeeCode: code },
		});

		return { id };
	});
}

export async function updateLeaveEmployee(
	actor: AdminActor,
	employeeId: number,
	input: UpdateEmployeeInput
): Promise<void> {
	await withLeaveTransaction(async (client) => {
		await client.query(
			`UPDATE one_leave.employees SET
				title_th = CASE WHEN $2::boolean THEN $3 ELSE title_th END,
				first_name_th = COALESCE($4, first_name_th),
				last_name_th = COALESCE($5, last_name_th),
				org_unit_id = COALESCE($6, org_unit_id),
				job_position_title = CASE WHEN $7::boolean THEN $8 ELSE job_position_title END,
				employee_line = COALESCE($9, employee_line),
				employment_category = COALESCE($10, employment_category),
				email = CASE WHEN $11::boolean THEN $12 ELSE email END,
				is_active = COALESCE($13, is_active),
				updated_at = now()
			 WHERE id = $1`,
			[
				employeeId,
				input.titleTh !== undefined,
				input.titleTh ?? null,
				input.firstNameTh?.trim() ?? null,
				input.lastNameTh?.trim() ?? null,
				input.orgUnitId ?? null,
				input.positionTitle !== undefined,
				input.positionTitle ?? null,
				input.employeeLine ?? null,
				input.employmentCategory ?? null,
				input.email !== undefined,
				input.email ?? null,
				input.isActive ?? null,
			]
		);
		await writeAdminAudit(client, {
			actorUserId: actor.leaveUserId,
			actorUsername: actor.username,
			action: "employee.update",
			targetUserId: null,
			detail: { employeeId, ...input },
		});
	});
}
