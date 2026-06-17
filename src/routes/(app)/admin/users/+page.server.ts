import { fail } from "@sveltejs/kit";
import { z } from "zod";
import { assertPermission } from "$lib/server/guards.js";
import { toAdminActor } from "$lib/server/one-leave/admin/actor.js";
import { AdminActionError } from "$lib/server/one-leave/admin/types.js";
import {
	createLeaveUser,
	listLeaveUsers,
	resetLeaveUserPassword,
	setLeaveUserActive,
	updateLeaveUser,
} from "$lib/server/one-leave/admin/users-admin.js";
import { listLeaveEmployees } from "$lib/server/one-leave/admin/employees-admin.js";
import { isLeaveRoleCode, type LeaveRoleCode } from "$lib/server/one-leave/types.js";
import type { Actions, PageServerLoad } from "./$types.js";

function failFromError(err: unknown) {
	if (err instanceof AdminActionError) {
		return fail(400, { message: err.message, code: err.code });
	}
	console.error("[admin/users]", err);
	return fail(500, { message: "Unexpected error" });
}

function parseRoles(formData: FormData): LeaveRoleCode[] {
	return formData.getAll("roles").map(String).filter(isLeaveRoleCode);
}

export const load: PageServerLoad = async ({ locals }) => {
	assertPermission(locals.user, "users:manage");
	const [users, employees] = await Promise.all([listLeaveUsers(), listLeaveEmployees()]);
	return {
		locale: locals.locale,
		users,
		employees: employees.map((e) => ({
			id: e.id,
			label: `${e.firstNameTh} ${e.lastNameTh}`,
			track: e.employmentTrack,
		})),
		canGrantAdmin: toAdminActor(locals.user!).canGrantAdmin,
		currentLeaveUserId: locals.user!.leaveUserId,
	};
};

const createSchema = z.object({
	username: z.string().trim().min(1),
	password: z.string().min(8),
	employeeId: z.coerce.number().int().positive().optional(),
	isActive: z.boolean().optional(),
	mustChangePassword: z.boolean().optional(),
});

const updateSchema = z.object({
	id: z.coerce.number().int().positive(),
	username: z.string().trim().min(1).optional(),
	employeeId: z.union([z.coerce.number().int().positive(), z.literal(0)]).optional(),
	isActive: z.boolean().optional(),
});

export const actions: Actions = {
	create: async ({ request, locals }) => {
		assertPermission(locals.user, "users:manage");
		const formData = await request.formData();
		const parsed = createSchema.safeParse({
			username: formData.get("username"),
			password: formData.get("password"),
			employeeId: formData.get("employeeId") || undefined,
			isActive: formData.get("isActive") === "on" || formData.get("isActive") === "true",
			mustChangePassword:
				formData.get("mustChangePassword") === "on" ||
				formData.get("mustChangePassword") === "true",
		});
		if (!parsed.success) {
			return fail(400, { message: "Invalid input", code: "validation" });
		}
		try {
			await createLeaveUser(toAdminActor(locals.user!), {
				username: parsed.data.username,
				password: parsed.data.password,
				employeeId: parsed.data.employeeId ?? null,
				isActive: parsed.data.isActive ?? true,
				mustChangePassword: parsed.data.mustChangePassword ?? true,
				roles: parseRoles(formData),
			});
			return { success: true };
		} catch (err) {
			return failFromError(err);
		}
	},

	update: async ({ request, locals }) => {
		assertPermission(locals.user, "users:manage");
		const formData = await request.formData();
		const parsed = updateSchema.safeParse({
			id: formData.get("id"),
			username: formData.get("username") || undefined,
			employeeId: formData.get("employeeId") || undefined,
			isActive: formData.has("isActive") ? formData.get("isActive") === "true" || formData.get("isActive") === "on" : false,
		});
		if (!parsed.success) {
			return fail(400, { message: "Invalid input", code: "validation" });
		}
		try {
			await updateLeaveUser(toAdminActor(locals.user!), parsed.data.id, {
				username: parsed.data.username,
				// employeeId 0 means "unlink"
				employeeId:
					parsed.data.employeeId === undefined
						? undefined
						: parsed.data.employeeId === 0
							? null
							: parsed.data.employeeId,
				isActive: parsed.data.isActive,
			});
			return { success: true };
		} catch (err) {
			return failFromError(err);
		}
	},

	setActive: async ({ request, locals }) => {
		assertPermission(locals.user, "users:manage");
		const formData = await request.formData();
		const id = Number(formData.get("id"));
		const isActive = formData.get("isActive") === "true";
		if (!Number.isInteger(id) || id <= 0) {
			return fail(400, { message: "Invalid user", code: "validation" });
		}
		try {
			await setLeaveUserActive(toAdminActor(locals.user!), id, isActive);
			return { success: true };
		} catch (err) {
			return failFromError(err);
		}
	},

	resetPassword: async ({ request, locals }) => {
		assertPermission(locals.user, "users:manage");
		const formData = await request.formData();
		const id = Number(formData.get("id"));
		const password = String(formData.get("password") ?? "");
		if (!Number.isInteger(id) || id <= 0) {
			return fail(400, { message: "Invalid user", code: "validation" });
		}
		try {
			await resetLeaveUserPassword(toAdminActor(locals.user!), id, password);
			return { success: true };
		} catch (err) {
			return failFromError(err);
		}
	},
};
