import { getServiceRoleClient } from "$lib/server/supabase-admin.js";
import { fail } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types.js";

const roleDefinitions = [
	{
		name: "admin" as const,
		description: "Full system access. Can manage users, content, settings, and view database info.",
		permissions: ["Manage users", "Manage content", "Manage settings", "View database", "Manage roles"],
	},
	{
		name: "editor" as const,
		description: "Can create and edit content. Cannot manage users or system settings.",
		permissions: ["Create content", "Edit content", "Delete own content", "View analytics"],
	},
	{
		name: "viewer" as const,
		description: "Read-only access. Can view content and their own profile.",
		permissions: ["View content", "View dashboard", "Edit own profile"],
	},
];

export const load: PageServerLoad = async () => {
	const admin = getServiceRoleClient();
	const { data: allUsers } = await admin.from("users").select("id,name,email,role").order("name", {
		ascending: true,
	});

	const roles = roleDefinitions.map((role) => ({
		...role,
		users: (allUsers ?? []).filter((u) => u.role === role.name),
		count: (allUsers ?? []).filter((u) => u.role === role.name).length,
	}));

	return { roles };
};

export const actions: Actions = {
	changeRole: async ({ request }) => {
		const admin = getServiceRoleClient();
		const formData = await request.formData();
		const userId = formData.get("userId");
		const newRole = formData.get("newRole");

		if (typeof userId !== "string") {
			return fail(400, { message: "User ID is required" });
		}
		if (typeof newRole !== "string" || !["admin", "editor", "viewer"].includes(newRole)) {
			return fail(400, { message: "Invalid role" });
		}

		// Prevent demotion of last admin
		const { data: target } = await admin.from("users").select("role").eq("id", userId).maybeSingle();
		if (target?.role === "admin" && newRole !== "admin") {
			const { count: adminCount } = await admin
				.from("users")
				.select("id", { count: "exact", head: true })
				.eq("role", "admin");
			if ((adminCount ?? 0) <= 1) {
				return fail(400, { message: "Cannot demote the last admin" });
			}
		}

		await admin
			.from("users")
			.update({
				role: newRole as "admin" | "editor" | "viewer",
				updated_at: new Date().toISOString(),
			})
			.eq("id", userId);

		return { success: true };
	},
};
