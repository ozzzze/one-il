import { fail } from "@sveltejs/kit";
import { z } from "zod";
import { assertPermission } from "$lib/server/guards.js";
import { toAdminActor } from "$lib/server/one-leave/admin/actor.js";
import { AdminActionError } from "$lib/server/one-leave/admin/types.js";
import { listLeaveUsers } from "$lib/server/one-leave/admin/users-admin.js";
import { assignLeaveRole, revokeLeaveRole } from "$lib/server/one-leave/admin/roles-admin.js";
import type { Actions, PageServerLoad } from "./$types.js";

function failFromError(err: unknown) {
	if (err instanceof AdminActionError) {
		return fail(400, { message: err.message, code: err.code });
	}
	console.error("[admin/roles]", err);
	return fail(500, { message: "Unexpected error" });
}

export const load: PageServerLoad = async ({ locals }) => {
	assertPermission(locals.user, "roles:manage");
	const users = await listLeaveUsers({ workingOnly: true });
	return {
		locale: locals.locale,
		users,
		canGrantAdmin: toAdminActor(locals.user!).canGrantAdmin,
		currentLeaveUserId: locals.user!.leaveUserId,
	};
};

const roleSchema = z.object({
	userId: z.coerce.number().int().positive(),
	roleCode: z.string().trim().min(1),
});

export const actions: Actions = {
	assign: async ({ request, locals }) => {
		assertPermission(locals.user, "roles:manage");
		const formData = await request.formData();
		const parsed = roleSchema.safeParse({
			userId: formData.get("userId"),
			roleCode: formData.get("roleCode"),
		});
		if (!parsed.success) {
			const msg = locals.locale === "th" ? "กรุณาเลือกบทบาท" : "Please select a role";
			return fail(400, { message: msg, code: "validation" });
		}
		try {
			await assignLeaveRole(toAdminActor(locals.user!), parsed.data.userId, parsed.data.roleCode);
			return { success: true };
		} catch (err) {
			return failFromError(err);
		}
	},

	revoke: async ({ request, locals }) => {
		assertPermission(locals.user, "roles:manage");
		const formData = await request.formData();
		const parsed = roleSchema.safeParse({
			userId: formData.get("userId"),
			roleCode: formData.get("roleCode"),
		});
		if (!parsed.success) {
			return fail(400, { message: "Invalid input", code: "validation" });
		}
		try {
			await revokeLeaveRole(toAdminActor(locals.user!), parsed.data.userId, parsed.data.roleCode);
			return { success: true };
		} catch (err) {
			return failFromError(err);
		}
	},
};
