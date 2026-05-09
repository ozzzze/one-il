import { fail } from "@sveltejs/kit";
import { z } from "zod";
import { getServiceRoleClient } from "$lib/server/supabase-admin.js";
import { assertPermission } from "$lib/server/guards.js";
import type { Actions, PageServerLoad } from "./$types.js";

const createEmployeeSchema = z.object({
	firstName: z.string().trim().min(1).max(100),
	lastName: z.string().trim().min(1).max(100),
	email: z.string().trim().email().max(255).optional().or(z.literal("")),
	employeeNo: z.string().trim().max(50).optional().or(z.literal("")),
});

const assignmentSchema = z.object({
	employeeId: z.string().uuid(),
	positionId: z.string().uuid(),
	orgUnitId: z.string().uuid(),
	startsAt: z.string().date(),
	isPrimary: z.enum(["true", "false"]).default("true"),
});

const supervisorSchema = z.object({
	employeeId: z.string().uuid(),
	supervisorEmployeeId: z.string().uuid(),
	startsAt: z.string().date(),
});

const programChairSchema = z.object({
	programId: z.string().uuid(),
	employeeId: z.string().uuid(),
	startsAt: z.string().date(),
});

function toText(value: FormDataEntryValue | null): string {
	return typeof value === "string" ? value : "";
}

function firstRelation<T>(value: T[] | T | null | undefined): T | null {
	if (Array.isArray(value)) return value[0] ?? null;
	return value ?? null;
}

type EmployeeRow = {
	id: string;
	employee_no: string | null;
	first_name: string;
	last_name: string;
	email: string | null;
	status: string;
	created_at: string | null;
	employee_assignments:
		| {
				id: string;
				starts_at: string;
				ends_at: string | null;
				is_primary: boolean;
				positions:
					| { id: string; name: string; name_en: string | null; code: string }[]
					| { id: string; name: string; name_en: string | null; code: string }
					| null;
				org_units:
					| { id: string; name: string; name_en: string | null; code: string }[]
					| { id: string; name: string; name_en: string | null; code: string }
					| null;
		  }[]
		| null;
	employee_supervisors:
		| {
				id: string;
				starts_at: string;
				ends_at: string | null;
				supervisor: { id: string; first_name: string; last_name: string } | null;
		  }[]
		| null;
};

export const load: PageServerLoad = async ({ locals }) => {
	assertPermission(locals.user, "employees:manage");
	const admin = getServiceRoleClient();

	const [employeesRes, positionsRes, orgUnitsRes, programsRes] = await Promise.all([
		admin
			.from("employees")
			.select(
				`
				id, employee_no, first_name, last_name, email, status, created_at,
				employee_assignments(
					id, starts_at, ends_at, is_primary,
					positions(id, name, name_en, code),
					org_units(id, name, name_en, code)
				),
				employee_supervisors(
					id, starts_at, ends_at,
					supervisor:employees!employee_supervisors_supervisor_employee_id_fkey(id, first_name, last_name)
				)
			`
			)
			.order("created_at", { ascending: true }),
		admin.from("positions").select("id,code,name,name_en,role_level").order("role_level", { ascending: true }),
		admin.from("org_units").select("id,code,name,name_en,unit_type,sort_order").order("sort_order", { ascending: true }),
		admin.from("programs").select("id,code,name,is_active").order("name", { ascending: true }),
	]);

	const employees = (employeesRes.data ?? []) as unknown as EmployeeRow[];

	return {
		locale: locals.locale,
		employees: employees.map((row) => {
			const activeAssignment =
				row.employee_assignments?.find((assignment) => assignment.is_primary && assignment.ends_at === null) ?? null;
			return {
				id: row.id,
				employeeNo: row.employee_no,
				firstName: row.first_name,
				lastName: row.last_name,
				fullName: `${row.first_name} ${row.last_name}`,
				email: row.email,
				status: row.status,
				createdAt: row.created_at,
				primaryAssignment: activeAssignment
					? {
							...activeAssignment,
							positions: firstRelation(activeAssignment.positions),
							org_units: firstRelation(activeAssignment.org_units),
						}
					: null,
				activeSupervisor:
					row.employee_supervisors?.find((supervisor) => supervisor.ends_at === null && supervisor.supervisor) ?? null,
			};
		}),
		positions: positionsRes.data ?? [],
		orgUnits: orgUnitsRes.data ?? [],
		programs: programsRes.data ?? [],
		errors: {
			employees: employeesRes.error?.message ?? null,
			positions: positionsRes.error?.message ?? null,
			orgUnits: orgUnitsRes.error?.message ?? null,
			programs: programsRes.error?.message ?? null,
		},
	};
};

export const actions: Actions = {
	createEmployee: async ({ request, locals }) => {
		const invalidMsg = locals.locale === "th" ? "ข้อมูลพนักงานไม่ถูกต้อง" : "Employee data is invalid";
		assertPermission(locals.user, "employees:manage");
		const admin = getServiceRoleClient();
		const formData = await request.formData();
		const parsed = createEmployeeSchema.safeParse({
			firstName: toText(formData.get("firstName")),
			lastName: toText(formData.get("lastName")),
			email: toText(formData.get("email")),
			employeeNo: toText(formData.get("employeeNo")),
		});
		if (!parsed.success) return fail(400, { message: invalidMsg });

		const { error } = await admin.from("employees").insert({
			first_name: parsed.data.firstName,
			last_name: parsed.data.lastName,
			email: parsed.data.email || null,
			employee_no: parsed.data.employeeNo || null,
		});
		if (error) return fail(400, { message: error.message });
		return { success: true, action: "createEmployee" };
	},

	assignPrimary: async ({ request, locals }) => {
		const invalidMsg = locals.locale === "th" ? "ข้อมูลการมอบหมายไม่ถูกต้อง" : "Assignment data is invalid";
		assertPermission(locals.user, "employees:manage");
		const admin = getServiceRoleClient();
		const formData = await request.formData();
		const parsed = assignmentSchema.safeParse({
			employeeId: toText(formData.get("employeeId")),
			positionId: toText(formData.get("positionId")),
			orgUnitId: toText(formData.get("orgUnitId")),
			startsAt: toText(formData.get("startsAt")),
			isPrimary: toText(formData.get("isPrimary")) || "true",
		});
		if (!parsed.success) return fail(400, { message: invalidMsg });

		const { error } = await admin.from("employee_assignments").insert({
			employee_id: parsed.data.employeeId,
			position_id: parsed.data.positionId,
			org_unit_id: parsed.data.orgUnitId,
			starts_at: parsed.data.startsAt,
			is_primary: parsed.data.isPrimary === "true",
		});
		if (error) return fail(400, { message: error.message });
		return { success: true, action: "assignPrimary" };
	},

	setSupervisor: async ({ request, locals }) => {
		const invalidMsg = locals.locale === "th" ? "ข้อมูลหัวหน้างานไม่ถูกต้อง" : "Supervisor data is invalid";
		assertPermission(locals.user, "employees:manage");
		const admin = getServiceRoleClient();
		const formData = await request.formData();
		const parsed = supervisorSchema.safeParse({
			employeeId: toText(formData.get("employeeId")),
			supervisorEmployeeId: toText(formData.get("supervisorEmployeeId")),
			startsAt: toText(formData.get("startsAt")),
		});
		if (!parsed.success) return fail(400, { message: invalidMsg });

		const { error } = await admin.from("employee_supervisors").insert({
			employee_id: parsed.data.employeeId,
			supervisor_employee_id: parsed.data.supervisorEmployeeId,
			starts_at: parsed.data.startsAt,
			relation_type: "LINE",
		});
		if (error) return fail(400, { message: error.message });
		return { success: true, action: "setSupervisor" };
	},

	assignProgramChair: async ({ request, locals }) => {
		const invalidMsg =
			locals.locale === "th" ? "ข้อมูลการกำหนดหัวหน้าหลักสูตรไม่ถูกต้อง" : "Program chair data is invalid";
		assertPermission(locals.user, "employees:manage");
		const admin = getServiceRoleClient();
		const formData = await request.formData();
		const parsed = programChairSchema.safeParse({
			programId: toText(formData.get("programId")),
			employeeId: toText(formData.get("employeeId")),
			startsAt: toText(formData.get("startsAt")),
		});
		if (!parsed.success) return fail(400, { message: invalidMsg });

		const { error } = await admin.from("program_chairs").insert({
			program_id: parsed.data.programId,
			employee_id: parsed.data.employeeId,
			starts_at: parsed.data.startsAt,
		});
		if (error) return fail(400, { message: error.message });
		return { success: true, action: "assignProgramChair" };
	},
};

