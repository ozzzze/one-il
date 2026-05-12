import { hasPermission } from "$lib/auth/roles.js";
import { assertPermission } from "$lib/server/guards.js";
import type { LayoutServerLoad } from "./$types.js";

export const load: LayoutServerLoad = async ({ locals }) => {
	assertPermission(locals.user, "asset:view");
	return {
		locale: locals.locale,
		canManageAssets: hasPermission(locals.user.role, "asset:manage"),
	};
};
