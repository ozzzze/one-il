import { fail, redirect } from "@sveltejs/kit";
import { z } from "zod";
import { getServiceRoleClient } from "$lib/server/supabase-admin.js";
import { assertPermission } from "$lib/server/guards.js";
import { isRole } from "$lib/auth/roles.js";
import { employeeEmbeddedSelect, mapEmployeeRowToView, type EmployeeRow } from "$lib/server/employees-load.js";
import {
	assignmentSchema,
	mutateAssignPrimary,
	mutateAssignProgramChair,
	mutateSetSupervisor,
	programChairSchema,
	supervisorSchema,
} from "$lib/server/employee-org-mutations.js";
import type { Actions, PageServerLoad } from "./$types.js";

const appRoleSchema = z.enum(["admin", "editor", "viewer", "user"]);

const createEmployeeSchema = z.object({
	firstName: z.string().trim().min(1).max(100),
	lastName: z.string().trim().min(1).max(100),
	email: z.string().trim().email().max(255).optional().or(z.literal("")),
	employeeNo: z.string().trim().max(50).optional().or(z.literal("")),
	appRole: z.union([z.literal(""), appRoleSchema]).optional(),
});

const updateEmployeeAccountSchema = z.object({
	employeeId: z.string().uuid(),
	appRole: z.union([z.literal("__keep__"), z.literal(""), appRoleSchema]),
});

const linkEmployeeUserSchema = z.object({
	employeeId: z.string().uuid(),
	userId: z.string().uuid(),
});

function toText(value: FormDataEntryValue | null): string {
	return typeof value === "string" ? value : "";
}

export const load: PageServerLoad = async ({ locals }) => {
	assertPermission(locals.user, "employees:manage");
	const admin = getServiceRoleClient();

	const [
		employeesRes,
		positionsRes,
		orgUnitsRes,
		programsRes,
		usersRes,
		employmentContractTypesRes,
		personnelCategoriesRes,
		hrEmploymentStatusesRes,
		deductionTypesRes,
	] = await Promise.all([
		admin.from("employees").select(employeeEmbeddedSelect).order("created_at", { ascending: true }),
		admin.from("positions").select("id,code,name,name_en,role_level").order("role_level", { ascending: true }),
		admin.from("org_units").select("id,code,name,name_en,unit_type,sort_order").order("sort_order", { ascending: true }),
		admin.from("programs").select("id,code,name,is_active").order("name", { ascending: true }),
		admin.from("users").select("id,email,name,username").order("email", { ascending: true }),
		admin.from("employment_contract_types").select("id,code,label_th,label_en,sort_order").order("sort_order", { ascending: true }),
		admin.from("personnel_categories").select("id,code,label_th,label_en,sort_order").order("sort_order", { ascending: true }),
		admin.from("hr_employment_statuses").select("id,code,label_th,label_en,sort_order").order("sort_order", { ascending: true }),
		admin.from("deduction_types").select("id,code,label_th,label_en,sort_order").order("sort_order", { ascending: true }),
	]);

	const employees = (employeesRes.data ?? []) as unknown as EmployeeRow[];
	const linkedUserIds = new Set(
		employees.map((row) => row.user_id).filter((id): id is string => typeof id === "string" && id.length > 0),
	);
	const allUsers = usersRes.data ?? [];
	const usersAvailableForLink = allUsers.filter((u) => !linkedUserIds.has(u.id));

	return {
		locale: locals.locale,
		employees: employees.map((row) => mapEmployeeRowToView(row)),
		positions: positionsRes.data ?? [],
		orgUnits: orgUnitsRes.data ?? [],
		programs: programsRes.data ?? [],
		usersAvailableForLink,
		hrLookups: {
			employmentContractTypes: employmentContractTypesRes.data ?? [],
			personnelCategories: personnelCategoriesRes.data ?? [],
			hrEmploymentStatuses: hrEmploymentStatusesRes.data ?? [],
			deductionTypes: deductionTypesRes.data ?? [],
		},
		errors: {
			employees: employeesRes.error?.message ?? null,
			positions: positionsRes.error?.message ?? null,
			orgUnits: orgUnitsRes.error?.message ?? null,
			programs: programsRes.error?.message ?? null,
			users: usersRes.error?.message ?? null,
			employmentContractTypes: employmentContractTypesRes.error?.message ?? null,
			personnelCategories: personnelCategoriesRes.error?.message ?? null,
			hrEmploymentStatuses: hrEmploymentStatusesRes.error?.message ?? null,
			deductionTypes: deductionTypesRes.error?.message ?? null,
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
			appRole: toText(formData.get("appRole")),
		});
		if (!parsed.success) return fail(400, { message: invalidMsg });

		const appRole =
			parsed.data.appRole && parsed.data.appRole.length > 0 && isRole(parsed.data.appRole)
				? parsed.data.appRole
				: null;

		const { data: inserted, error } = await admin
			.from("employees")
			.insert({
				first_name: parsed.data.firstName,
				last_name: parsed.data.lastName,
				email: parsed.data.email || null,
				employee_no: parsed.data.employeeNo || null,
				app_role: appRole,
			})
			.select("id")
			.single();
		if (error) return fail(400, { message: error.message });
		if (!inserted?.id) return fail(400, { message: invalidMsg });
		throw redirect(303, `/employees/${inserted.id}`);
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

		const result = await mutateAssignPrimary(admin, parsed.data);
		if (!result.ok) return fail(400, { message: result.message });
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

		const supResult = await mutateSetSupervisor(admin, parsed.data);
		if (!supResult.ok) return fail(400, { message: supResult.message });
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

		const chairResult = await mutateAssignProgramChair(admin, parsed.data);
		if (!chairResult.ok) return fail(400, { message: chairResult.message });
		return { success: true, action: "assignProgramChair" };
	},

	updateEmployeeAccount: async ({ request, locals }) => {
		const invalidMsg =
			locals.locale === "th"
				? "ข้อมูลบัญชีผู้ใช้ของพนักงานไม่ถูกต้อง"
				: "Employee account fields are invalid";
		const invalidEmailMsg =
			locals.locale === "th" ? "รูปแบบอีเมลไม่ถูกต้อง" : "Invalid email format";
		assertPermission(locals.user, "employees:manage");
		const admin = getServiceRoleClient();
		const formData = await request.formData();
		const parsed = updateEmployeeAccountSchema.safeParse({
			employeeId: toText(formData.get("employeeId")),
			appRole: toText(formData.get("appRole")) || "__keep__",
		});
		if (!parsed.success) return fail(400, { message: invalidMsg });

		const rawEmail = toText(formData.get("email")).trim();
		let nextAppRole: string | null | undefined;
		if (parsed.data.appRole === "") {
			nextAppRole = null;
		} else if (isRole(parsed.data.appRole)) {
			nextAppRole = parsed.data.appRole;
		} else if (parsed.data.appRole === "__keep__") {
			nextAppRole = undefined;
		} else {
			return fail(400, { message: invalidMsg });
		}

		const updatePayload: { app_role?: string | null; email?: string | null } = {};
		if (nextAppRole !== undefined) updatePayload.app_role = nextAppRole;
		if (rawEmail.length > 0) {
			const emailOk = z.string().email().max(255).safeParse(rawEmail);
			if (!emailOk.success) return fail(400, { message: invalidEmailMsg });
			updatePayload.email = rawEmail.toLowerCase();
		}

		if (Object.keys(updatePayload).length === 0) {
			return { success: true, action: "updateEmployeeAccount" };
		}

		const { data: updatedRow, error } = await admin
			.from("employees")
			.update(updatePayload)
			.eq("id", parsed.data.employeeId)
			.select("user_id, app_role")
			.maybeSingle();

		if (error) return fail(400, { message: error.message });

		const uid = updatedRow?.user_id;
		if (uid && nextAppRole !== undefined && nextAppRole !== null && isRole(nextAppRole)) {
			const { error: roleErr } = await admin.from("users").update({ role: nextAppRole }).eq("id", uid);
			if (roleErr) return fail(400, { message: roleErr.message });
		}

		return { success: true, action: "updateEmployeeAccount" };
	},

	linkEmployeeUser: async ({ request, locals }) => {
		const invalidMsg =
			locals.locale === "th" ? "ข้อมูลการผูกบัญชีไม่ถูกต้อง" : "Account link payload is invalid";
		const conflictMsg =
			locals.locale === "th"
				? "พนักงานมีบัญชีผูกอยู่แล้ว หรือผู้ใช้ถูกผูกกับพนักงานอื่นแล้ว"
				: "Employee already linked or user already linked to another employee";
		assertPermission(locals.user, "employees:manage");
		const admin = getServiceRoleClient();
		const formData = await request.formData();
		const parsed = linkEmployeeUserSchema.safeParse({
			employeeId: toText(formData.get("employeeId")),
			userId: toText(formData.get("userId")),
		});
		if (!parsed.success) return fail(400, { message: invalidMsg });

		const { data: employee, error: empErr } = await admin
			.from("employees")
			.select("id,first_name,last_name,user_id,app_role")
			.eq("id", parsed.data.employeeId)
			.maybeSingle();
		if (empErr || !employee) return fail(400, { message: invalidMsg });
		if (employee.user_id) return fail(400, { message: conflictMsg });

		const { data: userTaken } = await admin
			.from("employees")
			.select("id")
			.eq("user_id", parsed.data.userId)
			.maybeSingle();
		if (userTaken) return fail(400, { message: conflictMsg });

		const { error: linkErr } = await admin
			.from("employees")
			.update({ user_id: parsed.data.userId })
			.eq("id", employee.id);
		if (linkErr) return fail(400, { message: linkErr.message });

		const displayName = `${employee.first_name} ${employee.last_name}`.trim();
		const rolePatch =
			employee.app_role && isRole(employee.app_role) ? { role: employee.app_role as string } : {};

		const { error: profileErr } = await admin
			.from("users")
			.update({
				...rolePatch,
				...(displayName.length > 0 ? { name: displayName } : {}),
			})
			.eq("id", parsed.data.userId);
		if (profileErr) return fail(400, { message: profileErr.message });

		return { success: true, action: "linkEmployeeUser" };
	},
};
