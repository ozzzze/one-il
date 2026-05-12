import { assertPermission } from "$lib/server/guards.js";
import type { LayoutServerLoad } from "./$types.js";

export const load: LayoutServerLoad = async ({ locals }) => {
	assertPermission(locals.user, "asset:manage");
	return {};
};
