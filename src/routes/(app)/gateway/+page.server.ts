import { assertPermission } from "$lib/server/guards.js";
import { hasPermission } from "$lib/auth/roles.js";
import type { PageServerLoad } from "./$types.js";

export const load: PageServerLoad = async ({ locals }) => {
	assertPermission(locals.user, "gateway:access");
	return {
		canManageAccess: hasPermission(locals.user.role, "roles:manage"),
	};
};
