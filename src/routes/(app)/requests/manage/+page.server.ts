import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types.js";
import { hasPermission } from "$lib/auth/roles.js";
import { loadApprovalQueue } from "$lib/server/faculty-requests.js";
import { getServiceRoleClient } from "$lib/server/supabase-admin.js";

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user || !hasPermission(locals.user.role, "requests:manage")) {
		error(403, "You do not have access to this resource");
	}

	const admin = getServiceRoleClient();
	const queue = await loadApprovalQueue(admin, locals.user);
	return {
		locale: locals.locale,
		queue,
	};
};
