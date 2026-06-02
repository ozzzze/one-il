import { fail } from "@sveltejs/kit";
import { z } from "zod";
import { assertPermission } from "$lib/server/guards.js";
import { toAdminActor } from "$lib/server/one-leave/admin/actor.js";
import {
	AdminActionError,
	EMPLOYEE_LINES,
	EMPLOYMENT_CATEGORIES,
} from "$lib/server/one-leave/admin/types.js";
import {
	createLeaveEmployee,
	listLeaveEmployees,
	listOrgUnits,
	updateLeaveEmployee,
} from "$lib/server/one-leave/admin/employees-admin.js";
import type { Actions, PageServerLoad } from "./$types.js";

function failFromError(err: unknown) {
	if (err instanceof AdminActionError) {
		return fail(400, { message: err.message, code: err.code });
	}
	console.error("[admin/employees]", err);
	return fail(500, { message: "Unexpected error" });
}

export const load: PageServerLoad = async ({ locals }) => {
	assertPermission(locals.user, "employees:manage");
	const [employees, orgUnits] = await Promise.all([listLeaveEmployees(), listOrgUnits()]);
	return { locale: locals.locale, employees, orgUnits };
};

const createSchema = z.object({
	employeeCode: z.string().trim().min(1),
	titleTh: z.string().trim().optional(),
	firstNameTh: z.string().trim().min(1),
	lastNameTh: z.string().trim().min(1),
	orgUnitId: z.coerce.number().int().positive(),
	positionTitle: z.string().trim().optional(),
	employeeLine: z.enum(EMPLOYEE_LINES),
	employmentCategory: z.enum(EMPLOYMENT_CATEGORIES),
	hireDate: z.string().trim().min(1),
	email: z.string().trim().optional(),
	isActive: z.boolean().optional(),
});

const updateSchema = z.object({
	id: z.coerce.number().int().positive(),
	titleTh: z.string().trim().optional(),
	firstNameTh: z.string().trim().min(1),
	lastNameTh: z.string().trim().min(1),
	orgUnitId: z.coerce.number().int().positive(),
	positionTitle: z.string().trim().optional(),
	employeeLine: z.enum(EMPLOYEE_LINES),
	employmentCategory: z.enum(EMPLOYMENT_CATEGORIES),
	email: z.string().trim().optional(),
	isActive: z.boolean().optional(),
});

export const actions: Actions = {
	create: async ({ request, locals }) => {
		assertPermission(locals.user, "employees:manage");
		const formData = await request.formData();
		const parsed = createSchema.safeParse({
			employeeCode: formData.get("employeeCode"),
			titleTh: formData.get("titleTh") || undefined,
			firstNameTh: formData.get("firstNameTh"),
			lastNameTh: formData.get("lastNameTh"),
			orgUnitId: formData.get("orgUnitId"),
			positionTitle: formData.get("positionTitle") || undefined,
			employeeLine: formData.get("employeeLine"),
			employmentCategory: formData.get("employmentCategory"),
			hireDate: formData.get("hireDate"),
			email: formData.get("email") || undefined,
			isActive: formData.get("isActive") !== "false",
		});
		if (!parsed.success) {
			return fail(400, { message: "Invalid input", code: "validation" });
		}
		try {
			await createLeaveEmployee(toAdminActor(locals.user!), {
				employeeCode: parsed.data.employeeCode,
				titleTh: parsed.data.titleTh ?? null,
				firstNameTh: parsed.data.firstNameTh,
				lastNameTh: parsed.data.lastNameTh,
				orgUnitId: parsed.data.orgUnitId,
				positionTitle: parsed.data.positionTitle ?? null,
				employeeLine: parsed.data.employeeLine,
				employmentCategory: parsed.data.employmentCategory,
				hireDate: parsed.data.hireDate,
				email: parsed.data.email ?? null,
				isActive: parsed.data.isActive ?? true,
			});
			return { success: true };
		} catch (err) {
			return failFromError(err);
		}
	},

	update: async ({ request, locals }) => {
		assertPermission(locals.user, "employees:manage");
		const formData = await request.formData();
		const parsed = updateSchema.safeParse({
			id: formData.get("id"),
			titleTh: formData.get("titleTh") || undefined,
			firstNameTh: formData.get("firstNameTh"),
			lastNameTh: formData.get("lastNameTh"),
			orgUnitId: formData.get("orgUnitId"),
			positionTitle: formData.get("positionTitle") || undefined,
			employeeLine: formData.get("employeeLine"),
			employmentCategory: formData.get("employmentCategory"),
			email: formData.get("email") || undefined,
			isActive: formData.get("isActive") !== "false",
		});
		if (!parsed.success) {
			return fail(400, { message: "Invalid input", code: "validation" });
		}
		try {
			await updateLeaveEmployee(toAdminActor(locals.user!), parsed.data.id, {
				titleTh: parsed.data.titleTh ?? null,
				firstNameTh: parsed.data.firstNameTh,
				lastNameTh: parsed.data.lastNameTh,
				orgUnitId: parsed.data.orgUnitId,
				positionTitle: parsed.data.positionTitle ?? null,
				employeeLine: parsed.data.employeeLine,
				employmentCategory: parsed.data.employmentCategory,
				email: parsed.data.email ?? null,
				isActive: parsed.data.isActive ?? true,
			});
			return { success: true };
		} catch (err) {
			return failFromError(err);
		}
	},
};
