import { fail } from "@sveltejs/kit";
import { z } from "zod";
import { getServiceRoleClient } from "$lib/server/supabase-admin.js";
import { assertPermission } from "$lib/server/guards.js";
import { isRole } from "$lib/auth/roles.js";
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

/** Nested FK embeds may return one object or a single-element array from PostgREST */
function embedOne<T>(value: T | T[] | null | undefined): T | null {
	if (value == null) return null;
	return Array.isArray(value) ? (value[0] ?? null) : value;
}

type LinkedUserRow = { id: string; email: string; name: string };

type HrLookupEmbed = { id: string; code: string; label_th: string };

type EmployeeRow = {
	id: string;
	employee_no: string | null;
	first_name: string;
	last_name: string;
	email: string | null;
	user_id: string | null;
	app_role: string | null;
	status: string;
	created_at: string | null;
	updated_at: string | null;
	person_title_th: string | null;
	academic_title_th: string | null;
	person_title_en: string | null;
	academic_title_en: string | null;
	first_name_en: string | null;
	last_name_en: string | null;
	nickname: string | null;
	address: string | null;
	gender: string | null;
	duty_kind: string | null;
	professional_teacher_license: boolean;
	professional_recognition_status: string | null;
	birth_date: string | null;
	employment_started_at: string | null;
	employment_ended_at: string | null;
	photo_object_key: string | null;
	employment_contract_types: HrLookupEmbed | HrLookupEmbed[] | null;
	personnel_categories: HrLookupEmbed | HrLookupEmbed[] | null;
	hr_employment_statuses: HrLookupEmbed | HrLookupEmbed[] | null;
	employee_emergency_contacts:
		| {
				slot: number;
				contact_name: string | null;
				relationship: string | null;
				phone: string | null;
		  }[]
		| null;
	employee_deductions:
		| {
				deduction_type_id: string;
				deduction_types: HrLookupEmbed | HrLookupEmbed[] | null;
		  }[]
		| null;
	users: LinkedUserRow | LinkedUserRow[] | null;
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

function firstLinkedUser(users: LinkedUserRow | LinkedUserRow[] | null): LinkedUserRow | null {
	if (users == null) return null;
	return Array.isArray(users) ? users[0] ?? null : users;
}

function mapLookupEmbed(value: HrLookupEmbed | HrLookupEmbed[] | null): {
	id: string;
	code: string;
	labelTh: string;
} | null {
	const row = embedOne(value);
	if (!row) return null;
	return { id: row.id, code: row.code, labelTh: row.label_th };
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
		admin
			.from("employees")
			.select(
				`
				id, employee_no, first_name, last_name, email, user_id, app_role, status, created_at, updated_at,
				person_title_th, academic_title_th, person_title_en, academic_title_en,
				first_name_en, last_name_en, nickname, address, gender, duty_kind,
				professional_teacher_license, professional_recognition_status, birth_date,
				employment_started_at, employment_ended_at, photo_object_key,
				employment_contract_types(id, code, label_th),
				personnel_categories(id, code, label_th),
				hr_employment_statuses(id, code, label_th),
				employee_emergency_contacts(slot, contact_name, relationship, phone),
				employee_deductions(
					deduction_type_id,
					deduction_types(id, code, label_th)
				),
				users:user_id ( id, email, name ),
				employee_assignments(
					id, starts_at, ends_at, is_primary,
					positions(id, name, name_en, code),
					org_units(id, name, name_en, code)
				),
				employee_supervisors!employee_supervisors_employee_id_fkey(
					id, starts_at, ends_at,
					supervisor:employees!employee_supervisors_supervisor_employee_id_fkey(id, first_name, last_name)
				)
			`
			)
			.order("created_at", { ascending: true }),
		admin.from("positions").select("id,code,name,name_en,role_level").order("role_level", { ascending: true }),
		admin.from("org_units").select("id,code,name,name_en,unit_type,sort_order").order("sort_order", { ascending: true }),
		admin.from("programs").select("id,code,name,is_active").order("name", { ascending: true }),
		admin.from("users").select("id,email,name,username").order("email", { ascending: true }),
		admin.from("employment_contract_types").select("id,code,label_th,sort_order").order("sort_order", { ascending: true }),
		admin.from("personnel_categories").select("id,code,label_th,sort_order").order("sort_order", { ascending: true }),
		admin.from("hr_employment_statuses").select("id,code,label_th,sort_order").order("sort_order", { ascending: true }),
		admin.from("deduction_types").select("id,code,label_th,sort_order").order("sort_order", { ascending: true }),
	]);

	const employees = (employeesRes.data ?? []) as unknown as EmployeeRow[];
	const linkedUserIds = new Set(
		employees.map((row) => row.user_id).filter((id): id is string => typeof id === "string" && id.length > 0),
	);
	const allUsers = usersRes.data ?? [];
	const usersAvailableForLink = allUsers.filter((u) => !linkedUserIds.has(u.id));

	return {
		locale: locals.locale,
		employees: employees.map((row) => {
			const activeAssignment =
				row.employee_assignments?.find((assignment) => assignment.is_primary && assignment.ends_at === null) ?? null;
			const linkedUser = firstLinkedUser(row.users);
			return {
				id: row.id,
				employeeNo: row.employee_no,
				firstName: row.first_name,
				lastName: row.last_name,
				fullName: `${row.first_name} ${row.last_name}`,
				email: row.email,
				userId: row.user_id,
				appRole: row.app_role,
				linkedAccountEmail: linkedUser?.email ?? null,
				linkedAccountName: linkedUser?.name ?? null,
				status: row.status,
				createdAt: row.created_at,
				updatedAt: row.updated_at,
				hrProfile: {
					personTitleTh: row.person_title_th,
					academicTitleTh: row.academic_title_th,
					personTitleEn: row.person_title_en,
					academicTitleEn: row.academic_title_en,
					firstNameEn: row.first_name_en,
					lastNameEn: row.last_name_en,
					nickname: row.nickname,
					address: row.address,
					gender: row.gender,
					dutyKind: row.duty_kind,
					professionalTeacherLicense: row.professional_teacher_license,
					professionalRecognitionStatus: row.professional_recognition_status,
					birthDate: row.birth_date,
					employmentStartedAt: row.employment_started_at,
					employmentEndedAt: row.employment_ended_at,
					photoObjectKey: row.photo_object_key,
					employmentContractType: mapLookupEmbed(row.employment_contract_types),
					personnelCategory: mapLookupEmbed(row.personnel_categories),
					hrEmploymentStatus: mapLookupEmbed(row.hr_employment_statuses),
					emergencyContacts: [...(row.employee_emergency_contacts ?? [])]
						.sort((a, b) => a.slot - b.slot)
						.map((c) => ({
							slot: c.slot,
							contactName: c.contact_name,
							relationship: c.relationship,
							phone: c.phone,
						})),
					deductions: (row.employee_deductions ?? [])
						.map((d) => {
							const dt = embedOne(d.deduction_types);
							return {
								deductionTypeId: d.deduction_type_id,
								code: dt?.code ?? "",
								labelTh: dt?.label_th ?? "",
							};
						})
						.sort((a, b) => a.code.localeCompare(b.code)),
				},
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

		const { error } = await admin.from("employees").insert({
			first_name: parsed.data.firstName,
			last_name: parsed.data.lastName,
			email: parsed.data.email || null,
			employee_no: parsed.data.employeeNo || null,
			app_role: appRole,
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
		let nextAppRole: string | null | undefined = undefined;
		if (parsed.data.appRole === "__keep__") {
			nextAppRole = undefined;
		} else if (parsed.data.appRole === "") {
			nextAppRole = null;
		} else if (isRole(parsed.data.appRole)) {
			nextAppRole = parsed.data.appRole;
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

