import { getServiceRoleClient } from "$lib/server/supabase-admin.js";
import { fail } from "@sveltejs/kit";
import { getRoleDefinitions, isRole, parseRole } from "$lib/auth/roles.js";
import { assertPermission } from "$lib/server/guards.js";
import type { Actions, PageServerLoad } from "./$types.js";

export const load: PageServerLoad = async ({ locals }) => {
	assertPermission(locals.user, "roles:manage");
	const admin = getServiceRoleClient();
	const { data: allUsers } = await admin.from("users").select("id,name,email,role").order("name", {
		ascending: true,
	});

	const roleDefinitions = getRoleDefinitions(locals.locale);
	const roles = roleDefinitions.map((role) => ({
		...role,
		users: (allUsers ?? []).filter((u) => parseRole(u.role) === role.name),
		count: (allUsers ?? []).filter((u) => parseRole(u.role) === role.name).length,
	}));

	return { roles, locale: locals.locale };
};

export const actions: Actions = {
	changeRole: async ({ request, locals }) => {
		const t =
			locals.locale === "th"
				? {
						userIdRequired: "ต้องระบุรหัสผู้ใช้",
						invalidRole: "บทบาทไม่ถูกต้อง",
						lastAdmin: "ไม่สามารถลดสิทธิ์แอดมินคนสุดท้ายได้",
					}
				: {
						userIdRequired: "User ID is required",
						invalidRole: "Invalid role",
						lastAdmin: "Cannot demote the last admin",
					};
		assertPermission(locals.user, "roles:manage");
		const admin = getServiceRoleClient();
		const formData = await request.formData();
		const userId = formData.get("userId");
		const newRole = formData.get("newRole");

		if (typeof userId !== "string") {
			return fail(400, { message: t.userIdRequired });
		}
		if (!isRole(newRole)) {
			return fail(400, { message: t.invalidRole });
		}

		// Prevent demotion of last admin
		const { data: target } = await admin
			.from("users")
			.select("role")
			.eq("id", userId)
			.maybeSingle();
		if (target?.role === "admin" && newRole !== "admin") {
			const { count: adminCount } = await admin
				.from("users")
				.select("id", { count: "exact", head: true })
				.eq("role", "admin");
			if ((adminCount ?? 0) <= 1) {
				return fail(400, { message: t.lastAdmin });
			}
		}

		await admin
			.from("users")
			.update({
				role: newRole,
				updated_at: new Date().toISOString(),
			})
			.eq("id", userId);

		return { success: true };
	},
};
