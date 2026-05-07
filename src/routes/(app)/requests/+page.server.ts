import type { PageServerLoad } from "./$types.js";
import { assertPermission } from "$lib/server/guards.js";

export type RequestListItem = {
	id: string;
	kind: string;
	title: string;
	status: string;
	updatedAt: string;
};

export const load: PageServerLoad = async ({ locals }) => {
	assertPermission(locals.user, "requests:view_own");
	const items: RequestListItem[] = [];
	return { items };
};
