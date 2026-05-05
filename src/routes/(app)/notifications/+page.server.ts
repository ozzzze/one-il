import { getServiceRoleClient } from "$lib/server/supabase-admin.js";
import { fail } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types.js";

export const load: PageServerLoad = async ({ locals }) => {
	const admin = getServiceRoleClient();
	const { data: items } = await admin
		.from("notifications")
		.select("*")
		.or(`user_id.eq.${locals.user!.id},user_id.is.null`)
		.order("created_at", { ascending: false });

	return { notifications: items ?? [] };
};

export const actions: Actions = {
	markRead: async ({ request, locals }) => {
		const admin = getServiceRoleClient();
		const formData = await request.formData();
		const id = formData.get("id");

		if (typeof id !== "string") {
			return fail(400, { message: "Notification ID is required" });
		}

		await admin
			.from("notifications")
			.update({ read: true })
			.eq("id", id)
			.or(`user_id.eq.${locals.user!.id},user_id.is.null`);

		return { success: true };
	},

	markAllRead: async ({ locals }) => {
		const admin = getServiceRoleClient();
		await admin
			.from("notifications")
			.update({ read: true })
			.eq("read", false)
			.or(`user_id.eq.${locals.user!.id},user_id.is.null`);

		return { success: true };
	},

	delete: async ({ request, locals }) => {
		const admin = getServiceRoleClient();
		const formData = await request.formData();
		const id = formData.get("id");

		if (typeof id !== "string") {
			return fail(400, { message: "Notification ID is required" });
		}

		await admin
			.from("notifications")
			.delete()
			.eq("id", id)
			.or(`user_id.eq.${locals.user!.id},user_id.is.null`);

		return { success: true };
	},
};
