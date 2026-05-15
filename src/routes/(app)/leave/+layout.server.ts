import { hasPermission } from "$lib/auth/roles.js";
import { assertPermission } from "$lib/server/guards.js";
import type { LayoutServerLoad } from "./$types.js";

export const load: LayoutServerLoad = async ({ locals }) => {
	assertPermission(locals.user, "leave:view");

	return {
		canManageLeave: hasPermission(locals.user!.role, "leave:manage"),
	};
};
