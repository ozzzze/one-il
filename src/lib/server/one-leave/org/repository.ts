import { getDbPool } from "$lib/server/one-leave/db/pool.js";

export async function getEmployeeById(id: number): Promise<{
	id: number;
	supervisorEmployeeId: number | null;
	titleTh: string | null;
	firstNameTh: string;
	lastNameTh: string;
	orgUnitName: string;
	affiliationOrgUnitName: string | null;
} | null> {
	const pool = await getDbPool();
	const result = await pool.request().input("id", id).query<{
		id: string | number;
		supervisor_employee_id: string | number | null;
		title_th: string | null;
		first_name_th: string;
		last_name_th: string;
		org_unit_name: string;
		affiliation_org_unit_name: string | null;
	}>(`
		SELECT
			e.[id],
			e.[supervisor_employee_id],
			e.[title_th],
			e.[first_name_th],
			e.[last_name_th],
			ou.[name_th] AS [org_unit_name],
			aff.[name_th] AS [affiliation_org_unit_name]
		FROM [one_leave].[employees] AS e
		INNER JOIN [one_leave].[org_units] AS ou ON ou.[id] = e.[org_unit_id]
		LEFT JOIN [one_leave].[org_units] AS aff ON aff.[id] = e.[affiliation_org_unit_id]
		WHERE e.[id] = @id
	`);
	const row = result.recordset[0];
	if (!row) return null;
	return {
		id: Number(row.id),
		supervisorEmployeeId: row.supervisor_employee_id ? Number(row.supervisor_employee_id) : null,
		titleTh: row.title_th,
		firstNameTh: row.first_name_th,
		lastNameTh: row.last_name_th,
		orgUnitName: row.org_unit_name,
		affiliationOrgUnitName: row.affiliation_org_unit_name,
	};
}
