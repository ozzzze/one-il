import { fail, redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types.js";
import { newFacultyRequestFormSchema, requestKindSchema } from "$lib/requests/request-schema.js";
import { requestKindMeta } from "$lib/requests/request-meta.js";
import { assertPermission } from "$lib/server/guards.js";

export const load: PageServerLoad = async ({ url, locals }) => {
	assertPermission(locals.user, "requests:create");
	const rawKind = url.searchParams.get("kind");
	const parsedKind = requestKindSchema.safeParse(rawKind);
	if (!parsedKind.success) {
		redirect(302, "/requests");
	}
	const kind = parsedKind.data;
	const meta = requestKindMeta[kind];
	return { kind, label: meta.label, description: meta.description };
};

export const actions = {
	default: async ({ request, locals }) => {
		assertPermission(locals.user, "requests:create");
		const formData = await request.formData();
		function field(name: string): string {
			const v = formData.get(name);
			return typeof v === "string" ? v : "";
		}
		const raw = {
			kind: field("kind"),
			title: field("title"),
			details: field("details"),
		};
		const parsed = newFacultyRequestFormSchema.safeParse(raw);
		if (!parsed.success) {
			const flat = parsed.error.flatten();
			return fail(400, {
				message: "Please fix the highlighted fields.",
				fieldErrors: flat.fieldErrors,
			});
		}

		return {
			success: true as const,
			preview: true as const,
			summary: parsed.data.title,
		};
	},
} satisfies Actions;
