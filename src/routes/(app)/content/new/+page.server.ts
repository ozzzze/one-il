import { getServiceRoleClient } from "$lib/server/supabase-admin.js";
import { fail, redirect } from "@sveltejs/kit";
import { generateId } from "$lib/server/auth.js";
import { assertPermission } from "$lib/server/guards.js";
import type { Actions, PageServerLoad } from "./$types.js";

export const load: PageServerLoad = async ({ locals }) => {
	assertPermission(locals.user, "content:manage");
	return { locale: locals.locale };
};

function slugify(text: string): string {
	return text
		.toLowerCase()
		.replace(/[^\w\s-]/g, "")
		.replace(/[\s_]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, 200);
}

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const t =
			locals.locale === "th"
				? {
						titleRequired: "ต้องระบุชื่อเรื่อง (1-200 ตัวอักษร)",
						invalidSlug: "ไม่สามารถสร้าง slug ที่ถูกต้องได้",
						contentRequired: "ต้องระบุเนื้อหา",
						invalidTemplate: "เทมเพลตไม่ถูกต้อง",
						invalidStatus: "สถานะไม่ถูกต้อง",
						slugExists: "มีหน้าอื่นใช้ slug นี้อยู่แล้ว",
					}
				: {
						titleRequired: "Title is required (1-200 characters)",
						invalidSlug: "Could not generate a valid slug",
						contentRequired: "Content is required",
						invalidTemplate: "Invalid template",
						invalidStatus: "Invalid status",
						slugExists: "A page with this slug already exists",
					};
		assertPermission(locals.user, "content:manage");
		const formData = await request.formData();
		const title = formData.get("title");
		const slug = formData.get("slug");
		const content = formData.get("content");
		const template = formData.get("template");
		const status = formData.get("status");

		if (typeof title !== "string" || title.length < 1 || title.length > 200) {
			return fail(400, { message: t.titleRequired });
		}

		const finalSlug = typeof slug === "string" && slug.length > 0 ? slugify(slug) : slugify(title);
		if (!finalSlug) {
			return fail(400, { message: t.invalidSlug });
		}

		if (typeof content !== "string") {
			return fail(400, { message: t.contentRequired });
		}
		if (typeof template !== "string" || !["default", "landing", "blog"].includes(template)) {
			return fail(400, { message: t.invalidTemplate });
		}
		if (typeof status !== "string" || !["draft", "published", "archived"].includes(status)) {
			return fail(400, { message: t.invalidStatus });
		}

		const id = generateId(10);
		const admin = getServiceRoleClient();

		const { error } = await admin.from("pages").insert({
			id,
			title,
			slug: finalSlug,
			content,
			template: template as "default" | "landing" | "blog",
			status: status as "draft" | "published" | "archived",
			author_id: locals.user!.id,
			published_at: status === "published" ? new Date().toISOString() : null,
		});
		if (error) {
			return fail(400, { message: t.slugExists });
		}

		redirect(302, "/content");
	},
};
