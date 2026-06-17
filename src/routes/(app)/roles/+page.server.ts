import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types.js";

/** Legacy gateway path — role management lives on one-leave Postgres via /admin/roles. */
export const load: PageServerLoad = () => {
	redirect(308, "/admin/roles");
};
