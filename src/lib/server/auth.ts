import { getServiceRoleClient } from "./supabase-admin.js";
import type { Role } from "$lib/auth/roles.js";
import { parseRole } from "$lib/auth/roles.js";

export { generateId } from "./id.js";

export type SessionEmployee = {
	id: string;
	firstName: string;
	lastName: string;
	employeeNo: string | null;
	email: string | null;
	status: string;
	appRole: Role | null;
};

export type SessionUser = {
	id: string;
	email: string;
	username: string;
	name: string;
	role: Role;
	avatarUrl: string | null;
	employee: SessionEmployee | null;
};

type EmployeeJoinRow = {
	id: string;
	first_name: string;
	last_name: string;
	employee_no: string | null;
	email: string | null;
	status: string;
	app_role: string | null;
};

function normalizeEmployeeJoin(raw: EmployeeJoinRow[] | EmployeeJoinRow | null): SessionEmployee | null {
	if (raw == null) return null;
	const row = Array.isArray(raw) ? raw[0] : raw;
	if (!row?.id) return null;
	return {
		id: row.id,
		firstName: row.first_name,
		lastName: row.last_name,
		employeeNo: row.employee_no,
		email: row.email,
		status: row.status,
		appRole: row.app_role ? parseRole(row.app_role) : null,
	};
}

export async function loadSessionUser(userId: string): Promise<SessionUser | null> {
	const admin = getServiceRoleClient();
	const { data, error } = await admin
		.from("users")
		.select(
			`
			id,
			email,
			username,
			name,
			role,
			avatar_url,
			employees (
				id,
				first_name,
				last_name,
				employee_no,
				email,
				status,
				app_role
			)
		`
		)
		.eq("id", userId)
		.maybeSingle();

	if (error || !data) return null;

	return {
		id: data.id,
		email: data.email,
		username: data.username,
		name: data.name,
		role: parseRole(data.role),
		avatarUrl: data.avatar_url,
		employee: normalizeEmployeeJoin(data.employees as EmployeeJoinRow[] | EmployeeJoinRow | null),
	} satisfies SessionUser;
}
