import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types.js";

/** The app launcher now lives at the gateway home ("/"). Keep this path as an alias. */
export const load: PageServerLoad = async () => {
	redirect(307, "/");
};
