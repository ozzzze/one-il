import { fail } from "@sveltejs/kit";
import { z } from "zod";
import { getServiceRoleClient } from "$lib/server/supabase-admin.js";
import { assertPermission } from "$lib/server/guards.js";
import type { Actions, PageServerLoad } from "./$types.js";

const unitTypes = ["DIRECTOR_OFFICE", "SCI_TECH_GROUP", "SUPPORT_SECTION", "ACADEMIC_SECTION"] as const;

const orgUnitFormSchema = z.object({
	id: z.string().uuid().optional(),
	code: z
		.string()
		.trim()
		.min(2)
		.max(80)
		.regex(/^[A-Z0-9_]+$/),
	name: z.string().trim().min(1).max(255),
	nameEn: z.string().trim().max(255).optional().or(z.literal("")),
	unitType: z.enum(unitTypes),
	parentUnitId: z.string().uuid().optional().or(z.literal("")),
	sortOrder: z.coerce.number().int().min(0).max(9999),
	isActive: z.enum(["true", "false"]).default("true"),
});

type OrgUnitHierarchyRow = {
	id: string;
	parent_unit_id: string | null;
};

function toText(value: FormDataEntryValue | null): string {
	return typeof value === "string" ? value : "";
}

function orgUnitCopy(locale: "en" | "th") {
	return locale === "th"
		? {
				invalid: "ข้อมูลหน่วยงานไม่ถูกต้อง",
				selfParent: "หน่วยงานไม่สามารถเป็น parent ของตัวเองได้",
				cycle: "ไม่สามารถเลือก parent นี้ได้ เพราะจะทำให้โครงสร้างวนซ้ำ",
				inUse: "ไม่สามารถลบหน่วยงานนี้ได้ เพราะมีการมอบหมายบุคลากรใช้งานอยู่",
				hasChildren: "ไม่สามารถลบหน่วยงานนี้ได้ เพราะยังมีหน่วยงานย่อยอยู่",
			}
		: {
				invalid: "Org unit data is invalid",
				selfParent: "An org unit cannot be its own parent",
				cycle: "Cannot select this parent because it would create a hierarchy cycle",
				inUse: "Cannot delete this org unit because employee assignments still use it",
				hasChildren: "Cannot delete this org unit because it still has child units",
			};
}

function parseOrgUnitForm(formData: FormData) {
	return orgUnitFormSchema.safeParse({
		id: toText(formData.get("id")) || undefined,
		code: toText(formData.get("code")),
		name: toText(formData.get("name")),
		nameEn: toText(formData.get("nameEn")),
		unitType: toText(formData.get("unitType")),
		parentUnitId: toText(formData.get("parentUnitId")),
		sortOrder: toText(formData.get("sortOrder")),
		isActive: toText(formData.get("isActive")) || "true",
	});
}

function createsCycle(id: string, parentUnitId: string | null, orgUnits: OrgUnitHierarchyRow[]): boolean {
	const parentById = new Map(orgUnits.map((unit) => [unit.id, unit.parent_unit_id]));
	let cursor = parentUnitId;

	while (cursor) {
		if (cursor === id) return true;
		cursor = parentById.get(cursor) ?? null;
	}

	return false;
}

export const load: PageServerLoad = async ({ locals }) => {
	assertPermission(locals.user, "organization:manage");
	const admin = getServiceRoleClient();

	const { data, error } = await admin
		.from("org_units")
		.select("id,code,name,name_en,unit_type,parent_unit_id,sort_order,is_active,created_at,updated_at")
		.order("sort_order", { ascending: true })
		.order("code", { ascending: true });

	return {
		locale: locals.locale,
		orgUnits: data ?? [],
		unitTypes,
		error: error?.message ?? null,
	};
};

export const actions: Actions = {
	createOrgUnit: async ({ request, locals }) => {
		assertPermission(locals.user, "organization:manage");
		const t = orgUnitCopy(locals.locale);
		const admin = getServiceRoleClient();
		const formData = await request.formData();
		const parsed = parseOrgUnitForm(formData);

		if (!parsed.success) return fail(400, { message: t.invalid, action: "createOrgUnit" });

		const { error } = await admin.from("org_units").insert({
			code: parsed.data.code,
			name: parsed.data.name,
			name_en: parsed.data.nameEn || null,
			unit_type: parsed.data.unitType,
			parent_unit_id: parsed.data.parentUnitId || null,
			sort_order: parsed.data.sortOrder,
			is_active: parsed.data.isActive === "true",
		});

		if (error) return fail(400, { message: error.message, action: "createOrgUnit" });
		return { success: true, action: "createOrgUnit" };
	},

	updateOrgUnit: async ({ request, locals }) => {
		assertPermission(locals.user, "organization:manage");
		const t = orgUnitCopy(locals.locale);
		const admin = getServiceRoleClient();
		const formData = await request.formData();
		const parsed = parseOrgUnitForm(formData);

		if (!parsed.success || !parsed.data.id) return fail(400, { message: t.invalid, action: "updateOrgUnit" });

		const parentUnitId = parsed.data.parentUnitId || null;
		if (parentUnitId === parsed.data.id) return fail(400, { message: t.selfParent, action: "updateOrgUnit" });

		const { data: hierarchyRows, error: hierarchyError } = await admin
			.from("org_units")
			.select("id,parent_unit_id");

		if (hierarchyError) return fail(400, { message: hierarchyError.message, action: "updateOrgUnit" });
		if (createsCycle(parsed.data.id, parentUnitId, (hierarchyRows ?? []) as OrgUnitHierarchyRow[])) {
			return fail(400, { message: t.cycle, action: "updateOrgUnit" });
		}

		const { error } = await admin
			.from("org_units")
			.update({
				code: parsed.data.code,
				name: parsed.data.name,
				name_en: parsed.data.nameEn || null,
				unit_type: parsed.data.unitType,
				parent_unit_id: parentUnitId,
				sort_order: parsed.data.sortOrder,
				is_active: parsed.data.isActive === "true",
				updated_at: new Date().toISOString(),
			})
			.eq("id", parsed.data.id);

		if (error) return fail(400, { message: error.message, action: "updateOrgUnit" });
		return { success: true, action: "updateOrgUnit" };
	},

	deleteOrgUnit: async ({ request, locals }) => {
		assertPermission(locals.user, "organization:manage");
		const t = orgUnitCopy(locals.locale);
		const admin = getServiceRoleClient();
		const formData = await request.formData();
		const parsedId = z.string().uuid().safeParse(toText(formData.get("id")));

		if (!parsedId.success) return fail(400, { message: t.invalid, action: "deleteOrgUnit" });

		const [assignmentCount, childCount] = await Promise.all([
			admin
				.from("employee_assignments")
				.select("id", { count: "exact", head: true })
				.eq("org_unit_id", parsedId.data),
			admin.from("org_units").select("id", { count: "exact", head: true }).eq("parent_unit_id", parsedId.data),
		]);

		if (assignmentCount.error) return fail(400, { message: assignmentCount.error.message, action: "deleteOrgUnit" });
		if (childCount.error) return fail(400, { message: childCount.error.message, action: "deleteOrgUnit" });
		if (Number(assignmentCount.count ?? 0) > 0) return fail(400, { message: t.inUse, action: "deleteOrgUnit" });
		if (Number(childCount.count ?? 0) > 0) return fail(400, { message: t.hasChildren, action: "deleteOrgUnit" });

		const { error } = await admin.from("org_units").delete().eq("id", parsedId.data);

		if (error) return fail(400, { message: error.message, action: "deleteOrgUnit" });
		return { success: true, action: "deleteOrgUnit" };
	},
};
