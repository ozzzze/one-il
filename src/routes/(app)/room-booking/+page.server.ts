import { assertPermission } from "$lib/server/guards.js";
import type { PageServerLoad } from "./$types.js";

export const load: PageServerLoad = async ({ locals }) => {
	assertPermission(locals.user, "requests:create");
	return {
		locale: locals.locale,
		moduleName: "Room Booking",
		status: "mockup",
	};
};

