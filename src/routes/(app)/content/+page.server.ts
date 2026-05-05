import { getServiceRoleClient } from "$lib/server/supabase-admin.js";
import { fail } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types.js";

export const load: PageServerLoad = async () => {
	const admin = getServiceRoleClient();
	const { data: allPages } = await admin
		.from("pages")
		.select("id,title,slug,template,status,created_at,updated_at,published_at,users:author_id(name)")
		.order("updated_at", { ascending: true });

	return {
		pages:
			allPages?.map((page) => ({
				id: page.id,
				title: page.title,
				slug: page.slug,
				template: page.template,
				status: page.status,
				authorName: Array.isArray(page.users) ? (page.users[0]?.name ?? "Unknown") : "Unknown",
				createdAt: page.created_at,
				updatedAt: page.updated_at,
				publishedAt: page.published_at,
			})) ?? [],
	};
};

export const actions: Actions = {
	delete: async ({ request }) => {
		const admin = getServiceRoleClient();
		const formData = await request.formData();
		const id = formData.get("id");

		if (typeof id !== "string") {
			return fail(400, { message: "Page ID is required" });
		}

		await admin.from("pages").delete().eq("id", id);

		return { success: true };
	},

	bulkDelete: async ({ request }) => {
		const admin = getServiceRoleClient();
		const formData = await request.formData();
		const idsRaw = formData.get("ids");

		if (typeof idsRaw !== "string" || !idsRaw.trim()) {
			return fail(400, { message: "No pages selected" });
		}

		const ids = idsRaw.split(",").filter(Boolean);
		await admin.from("pages").delete().in("id", ids);

		return { success: true };
	},
};
