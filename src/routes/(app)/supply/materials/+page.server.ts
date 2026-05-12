import { fail } from "@sveltejs/kit";
import { z } from "zod";
import { getServiceRoleClient } from "$lib/server/supabase-admin.js";
import { assertPermission } from "$lib/server/guards.js";
import { localizedActionMessage, optionalText, toText, writeSupplyAudit, currentEmployeeId } from "$lib/server/supply-asset.js";
import type { Actions, PageServerLoad } from "./$types.js";

const materialSchema = z.object({
	code: z.string().trim().min(2).max(80).regex(/^[A-Z0-9_-]+$/),
	name: z.string().trim().min(1).max(255),
	nameEn: z.string().trim().max(255).optional().or(z.literal("")),
	categoryId: z.string().uuid(),
	unitId: z.string().uuid(),
	specification: z.string().trim().max(1000).optional().or(z.literal("")),
	reorderLevel: z.coerce.number().min(0).max(999999),
	isActive: z.enum(["true", "false"]).default("true"),
});

const locationSchema = z.object({
	code: z.string().trim().min(2).max(80).regex(/^[A-Z0-9_-]+$/),
	name: z.string().trim().min(1).max(255),
	nameEn: z.string().trim().max(255).optional().or(z.literal("")),
	orgUnitId: z.string().uuid().optional().or(z.literal("")),
	description: z.string().trim().max(1000).optional().or(z.literal("")),
});

export const load: PageServerLoad = async ({ locals }) => {
	assertPermission(locals.user, "supply:view");
	const admin = getServiceRoleClient();

	const [itemsRes, balancesRes, categoriesRes, unitsRes, locationsRes, orgUnitsRes] = await Promise.all([
		admin
			.from("material_items")
			.select("id,code,name,name_en,specification,reorder_level,is_active, category:supply_categories(id,code,label_th,label_en), unit:supply_units(id,code,label_th,label_en)")
			.order("code", { ascending: true }),
		admin
			.from("material_stock_balances")
			.select("item_id,location_id,quantity_on_hand, material_items(code,name,name_en,reorder_level), stock_locations(name,name_en)")
			.order("updated_at", { ascending: false }),
		admin.from("supply_categories").select("id,code,label_th,label_en,sort_order").order("sort_order", { ascending: true }),
		admin.from("supply_units").select("id,code,label_th,label_en,sort_order").order("sort_order", { ascending: true }),
		admin.from("stock_locations").select("id,code,name,name_en,org_unit_id,is_active,sort_order").order("sort_order", { ascending: true }),
		admin.from("org_units").select("id,code,name,name_en,sort_order").order("sort_order", { ascending: true }),
	]);

	return {
		locale: locals.locale,
		items: itemsRes.data ?? [],
		balances: balancesRes.data ?? [],
		categories: categoriesRes.data ?? [],
		units: unitsRes.data ?? [],
		locations: locationsRes.data ?? [],
		orgUnits: orgUnitsRes.data ?? [],
		errors: {
			items: itemsRes.error?.message ?? null,
			balances: balancesRes.error?.message ?? null,
			categories: categoriesRes.error?.message ?? null,
			units: unitsRes.error?.message ?? null,
			locations: locationsRes.error?.message ?? null,
			orgUnits: orgUnitsRes.error?.message ?? null,
		},
	};
};

export const actions: Actions = {
	createMaterial: async ({ request, locals }) => {
		assertPermission(locals.user, "supply:manage");
		const admin = getServiceRoleClient();
		const formData = await request.formData();
		const parsed = materialSchema.safeParse({
			code: toText(formData.get("code")),
			name: toText(formData.get("name")),
			nameEn: toText(formData.get("nameEn")),
			categoryId: toText(formData.get("categoryId")),
			unitId: toText(formData.get("unitId")),
			specification: toText(formData.get("specification")),
			reorderLevel: toText(formData.get("reorderLevel")),
			isActive: toText(formData.get("isActive")) || "true",
		});

		if (!parsed.success) {
			return fail(400, {
				action: "createMaterial",
				message: localizedActionMessage(locals.locale, "Material data is invalid", "ข้อมูลวัสดุไม่ถูกต้อง"),
			});
		}

		const { data, error } = await admin
			.from("material_items")
			.insert({
				code: parsed.data.code,
				name: parsed.data.name,
				name_en: parsed.data.nameEn || null,
				category_id: parsed.data.categoryId,
				unit_id: parsed.data.unitId,
				specification: parsed.data.specification || null,
				reorder_level: parsed.data.reorderLevel,
				is_active: parsed.data.isActive === "true",
			})
			.select("id")
			.single();

		if (error) return fail(400, { action: "createMaterial", message: error.message });
		const actorEmployeeId = await currentEmployeeId(admin, locals.user);
		await writeSupplyAudit(admin, {
			entityType: "material_item",
			entityId: String((data as { id: string }).id),
			eventType: "created",
			actorUserId: locals.user.id,
			actorEmployeeId,
			summary: `Created material item ${parsed.data.code}`,
		});
		return { success: true, action: "createMaterial" };
	},

	createLocation: async ({ request, locals }) => {
		assertPermission(locals.user, "supply:manage");
		const admin = getServiceRoleClient();
		const formData = await request.formData();
		const parsed = locationSchema.safeParse({
			code: toText(formData.get("code")),
			name: toText(formData.get("name")),
			nameEn: toText(formData.get("nameEn")),
			orgUnitId: toText(formData.get("orgUnitId")),
			description: toText(formData.get("description")),
		});

		if (!parsed.success) {
			return fail(400, {
				action: "createLocation",
				message: localizedActionMessage(locals.locale, "Location data is invalid", "ข้อมูลคลัง/สถานที่ไม่ถูกต้อง"),
			});
		}

		const { error } = await admin.from("stock_locations").insert({
			code: parsed.data.code,
			name: parsed.data.name,
			name_en: parsed.data.nameEn || null,
			org_unit_id: parsed.data.orgUnitId || null,
			description: optionalText(formData.get("description")),
		});

		if (error) return fail(400, { action: "createLocation", message: error.message });
		return { success: true, action: "createLocation" };
	},
};
