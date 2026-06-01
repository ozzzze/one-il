import { fail } from "@sveltejs/kit";
import { z } from "zod";
import { getServiceRoleClient } from "$lib/server/supabase-admin.js";
import { assertPermission } from "$lib/server/guards.js";
import { permissionKeys } from "$lib/auth/roles.js";
import { loadMenuCatalogRows } from "$lib/server/navigation-menu-load.js";
import type { Actions, PageServerLoad } from "./$types.js";

const permissionKeySet = new Set<string>(permissionKeys);

const updateItemSchema = z.object({
	id: z.string().min(1),
	label_th: z.string().min(1).max(120),
	label_en: z.string().min(1).max(120),
	href: z
		.string()
		.trim()
		.max(255)
		.transform((value) => (value.length === 0 ? null : value)),
	icon_key: z
		.string()
		.trim()
		.max(60)
		.transform((value) => (value.length === 0 ? null : value)),
	visibility: z.enum(["standard", "admin_only"]),
	implementation_status: z.enum(["live", "planned"]),
	sort_order: z.coerce.number().int().min(0).max(9999),
	required_permission_keys: z
		.string()
		.trim()
		.transform((value) =>
			value
				.split(",")
				.map((key) => key.trim())
				.filter((key) => key.length > 0 && permissionKeySet.has(key)),
		),
});

export const load: PageServerLoad = async ({ locals }) => {
	assertPermission(locals.user, "roles:manage");
	const { groups, items } = await loadMenuCatalogRows();
	return {
		groups,
		items,
		permissionKeys: [...permissionKeys],
		locale: locals.locale,
	};
};

export const actions: Actions = {
	updateItem: async ({ request, locals }) => {
		assertPermission(locals.user, "roles:manage");
		const invalid = locals.locale === "th" ? "ข้อมูลไม่ถูกต้อง" : "Invalid data";
		const fd = await request.formData();
		const parsed = updateItemSchema.safeParse({
			id: fd.get("id"),
			label_th: fd.get("label_th"),
			label_en: fd.get("label_en"),
			href: fd.get("href") ?? "",
			icon_key: fd.get("icon_key") ?? "",
			visibility: fd.get("visibility"),
			implementation_status: fd.get("implementation_status"),
			sort_order: fd.get("sort_order") ?? 0,
			required_permission_keys: fd.get("required_permission_keys") ?? "",
		});
		if (!parsed.success) {
			return fail(400, { message: invalid });
		}

		const { id, ...fields } = parsed.data;
		const admin = getServiceRoleClient();
		const { error } = await admin.from("menu_items").update(fields).eq("id", id);
		if (error) {
			return fail(400, { message: error.message });
		}
		return { success: true, id };
	},

	toggleGroupActive: async ({ request, locals }) => {
		assertPermission(locals.user, "roles:manage");
		const invalid = locals.locale === "th" ? "ข้อมูลไม่ถูกต้อง" : "Invalid data";
		const fd = await request.formData();
		const parsed = z
			.object({ code: z.string().min(1), is_active: z.union([z.literal("true"), z.literal("false")]) })
			.safeParse({ code: fd.get("code"), is_active: fd.get("is_active") });
		if (!parsed.success) {
			return fail(400, { message: invalid });
		}
		const admin = getServiceRoleClient();
		const { error } = await admin
			.from("menu_groups")
			.update({ is_active: parsed.data.is_active === "true" })
			.eq("code", parsed.data.code);
		if (error) {
			return fail(400, { message: error.message });
		}
		return { success: true, code: parsed.data.code };
	},
};
