import { fail } from "@sveltejs/kit";
import { z } from "zod";
import { getServiceRoleClient } from "$lib/server/supabase-admin.js";
import { assertPermission } from "$lib/server/guards.js";
import type { Actions, PageServerLoad } from "./$types.js";

const deputyCategories = ["ADMIN", "RESEARCH", "EDU_NETWORK"] as const;

const positionFormSchema = z.object({
	id: z.string().uuid().optional(),
	code: z
		.string()
		.trim()
		.min(2)
		.max(80)
		.regex(/^[A-Z0-9_]+$/),
	name: z.string().trim().min(1).max(255),
	nameEn: z.string().trim().max(255).optional().or(z.literal("")),
	roleLevel: z.coerce.number().int().min(1).max(4),
	canCommandStaff: z.enum(["true", "false"]).default("false"),
	deputyCategory: z.enum(deputyCategories).optional().or(z.literal("")),
});

type PositionInput = z.infer<typeof positionFormSchema>;

function toText(value: FormDataEntryValue | null): string {
	return typeof value === "string" ? value : "";
}

function positionCopy(locale: "en" | "th") {
	return locale === "th"
		? {
				invalid: "ข้อมูลตำแหน่งไม่ถูกต้อง",
				deputyCategoryRequired: "ตำแหน่งรองผู้อำนวยการต้องระบุประเภทงาน",
				deputyCategoryMustBeEmpty: "ตำแหน่งที่ไม่ใช่รองผู้อำนวยการไม่ควรระบุประเภทงาน",
				inUse: "ไม่สามารถลบตำแหน่งนี้ได้ เพราะมีการมอบหมายบุคลากรใช้งานอยู่",
			}
		: {
				invalid: "Position data is invalid",
				deputyCategoryRequired: "Deputy director positions must include a deputy category",
				deputyCategoryMustBeEmpty: "Only deputy director positions can use a deputy category",
				inUse: "Cannot delete this position because employee assignments still use it",
			};
}

function validateDeputyCategory(input: PositionInput, locale: "en" | "th"): string | null {
	const t = positionCopy(locale);
	const hasDeputyCode = input.code.startsWith("DEPUTY_DIRECTOR");
	const hasDeputyCategory = Boolean(input.deputyCategory);

	if (hasDeputyCode && !hasDeputyCategory) return t.deputyCategoryRequired;
	if (!hasDeputyCode && hasDeputyCategory) return t.deputyCategoryMustBeEmpty;

	return null;
}

function parsePositionForm(formData: FormData) {
	return positionFormSchema.safeParse({
		id: toText(formData.get("id")) || undefined,
		code: toText(formData.get("code")),
		name: toText(formData.get("name")),
		nameEn: toText(formData.get("nameEn")),
		roleLevel: toText(formData.get("roleLevel")),
		canCommandStaff: toText(formData.get("canCommandStaff")) || "false",
		deputyCategory: toText(formData.get("deputyCategory")),
	});
}

export const load: PageServerLoad = async ({ locals }) => {
	assertPermission(locals.user, "organization:manage");
	const admin = getServiceRoleClient();

	const { data, error } = await admin
		.from("positions")
		.select("id,code,name,name_en,role_level,can_command_staff,deputy_category,created_at,updated_at")
		.order("role_level", { ascending: true })
		.order("code", { ascending: true });

	return {
		locale: locals.locale,
		positions: data ?? [],
		error: error?.message ?? null,
	};
};

export const actions: Actions = {
	createPosition: async ({ request, locals }) => {
		assertPermission(locals.user, "organization:manage");
		const t = positionCopy(locals.locale);
		const admin = getServiceRoleClient();
		const formData = await request.formData();
		const parsed = parsePositionForm(formData);

		if (!parsed.success) return fail(400, { message: t.invalid, action: "createPosition" });
		const deputyError = validateDeputyCategory(parsed.data, locals.locale);
		if (deputyError) return fail(400, { message: deputyError, action: "createPosition" });

		const { error } = await admin.from("positions").insert({
			code: parsed.data.code,
			name: parsed.data.name,
			name_en: parsed.data.nameEn || null,
			role_level: parsed.data.roleLevel,
			can_command_staff: parsed.data.canCommandStaff === "true",
			deputy_category: parsed.data.deputyCategory || null,
		});

		if (error) return fail(400, { message: error.message, action: "createPosition" });
		return { success: true, action: "createPosition" };
	},

	updatePosition: async ({ request, locals }) => {
		assertPermission(locals.user, "organization:manage");
		const t = positionCopy(locals.locale);
		const admin = getServiceRoleClient();
		const formData = await request.formData();
		const parsed = parsePositionForm(formData);

		if (!parsed.success || !parsed.data.id) return fail(400, { message: t.invalid, action: "updatePosition" });
		const deputyError = validateDeputyCategory(parsed.data, locals.locale);
		if (deputyError) return fail(400, { message: deputyError, action: "updatePosition" });

		const { error } = await admin
			.from("positions")
			.update({
				code: parsed.data.code,
				name: parsed.data.name,
				name_en: parsed.data.nameEn || null,
				role_level: parsed.data.roleLevel,
				can_command_staff: parsed.data.canCommandStaff === "true",
				deputy_category: parsed.data.deputyCategory || null,
				updated_at: new Date().toISOString(),
			})
			.eq("id", parsed.data.id);

		if (error) return fail(400, { message: error.message, action: "updatePosition" });
		return { success: true, action: "updatePosition" };
	},

	deletePosition: async ({ request, locals }) => {
		assertPermission(locals.user, "organization:manage");
		const t = positionCopy(locals.locale);
		const admin = getServiceRoleClient();
		const formData = await request.formData();
		const id = toText(formData.get("id"));
		const parsedId = z.string().uuid().safeParse(id);

		if (!parsedId.success) return fail(400, { message: t.invalid, action: "deletePosition" });

		const { count, error: countError } = await admin
			.from("employee_assignments")
			.select("id", { count: "exact", head: true })
			.eq("position_id", parsedId.data);

		if (countError) return fail(400, { message: countError.message, action: "deletePosition" });
		if (Number(count ?? 0) > 0) return fail(400, { message: t.inUse, action: "deletePosition" });

		const { error } = await admin.from("positions").delete().eq("id", parsedId.data);

		if (error) return fail(400, { message: error.message, action: "deletePosition" });
		return { success: true, action: "deletePosition" };
	},
};
