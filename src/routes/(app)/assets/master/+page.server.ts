import { fail } from "@sveltejs/kit";
import { z } from "zod";
import type { Locale } from "$lib/i18n/locales.js";
import { getServiceRoleClient } from "$lib/server/supabase-admin.js";
import { assertPermission } from "$lib/server/guards.js";
import type { AppSupabaseClient } from "$lib/server/supply-asset.js";
import {
	currentEmployeeId,
	localizedActionMessage,
	optionalText,
	toText,
	writeSupplyAudit,
} from "$lib/server/supply-asset.js";
import type { Actions, PageServerLoad } from "./$types.js";

const codeSchema = z.string().trim().min(2).max(80).regex(/^[A-Z0-9_-]+$/);

const lookupCreateSchema = z.object({
	code: codeSchema,
	labelTh: z.string().trim().min(1).max(255),
	labelEn: z.string().trim().max(255).optional().or(z.literal("")),
	sortOrder: z.coerce.number().int().min(0).max(99999).optional(),
});

const lookupUpdateSchema = z.object({
	id: z.string().uuid(),
	labelTh: z.string().trim().min(1).max(255),
	labelEn: z.string().trim().max(255).optional().or(z.literal("")),
	sortOrder: z.coerce.number().int().min(0).max(99999),
	isActive: z.enum(["true", "false"]),
});

const locationCreateSchema = z.object({
	code: codeSchema,
	name: z.string().trim().min(1).max(255),
	nameEn: z.string().trim().max(255).optional().or(z.literal("")),
	orgUnitId: z.string().uuid().optional().or(z.literal("")),
	sortOrder: z.coerce.number().int().min(0).max(99999).optional(),
});

const locationUpdateSchema = z.object({
	id: z.string().uuid(),
	name: z.string().trim().min(1).max(255),
	nameEn: z.string().trim().max(255).optional().or(z.literal("")),
	orgUnitId: z.string().uuid().optional().or(z.literal("")),
	sortOrder: z.coerce.number().int().min(0).max(99999),
	isActive: z.enum(["true", "false"]),
});

const deleteIdSchema = z.object({
	id: z.string().uuid(),
});

function deleteBlockedMessage(locale: Locale): string {
	return localizedActionMessage(
		locale,
		"This record is still referenced elsewhere and cannot be deleted.",
		"ไม่สามารถลบได้ เนื่องจากยังมีข้อมูลอื่นอ้างอิงอยู่",
	);
}

function mapDeleteError(locale: Locale, err: { code?: string; message?: string }): string {
	if (err.code === "23503" || err.message?.toLowerCase().includes("foreign key")) {
		return deleteBlockedMessage(locale);
	}
	return err.message ?? deleteBlockedMessage(locale);
}

type LookupTable = "asset_categories" | "asset_statuses" | "asset_conditions";

/** DB columns use label_en NOT NULL; mirror Thai when the optional EN field is empty. */
function resolvedLookupLabelEn(labelTh: string, labelEn: string | undefined): string {
	const trimmed = labelEn?.trim();
	return trimmed && trimmed.length > 0 ? trimmed : labelTh;
}

async function insertLookupRow(
	admin: AppSupabaseClient,
	table: LookupTable,
	input: z.infer<typeof lookupCreateSchema>,
): Promise<{ error: { message: string } | null; data: { id: string } | null }> {
	const sortOrder = input.sortOrder ?? 0;
	const labelEn = resolvedLookupLabelEn(input.labelTh, input.labelEn);
	const res = await admin
		.from(table)
		.insert({
			code: input.code,
			label_th: input.labelTh,
			label_en: labelEn,
			sort_order: sortOrder,
		})
		.select("id")
		.single();
	return { error: res.error, data: res.data as { id: string } | null };
}

async function updateLookupRow(
	admin: AppSupabaseClient,
	table: LookupTable,
	input: z.infer<typeof lookupUpdateSchema>,
): Promise<{ error: { message: string } | null }> {
	const labelEn = resolvedLookupLabelEn(input.labelTh, input.labelEn);
	const { error } = await admin
		.from(table)
		.update({
			label_th: input.labelTh,
			label_en: labelEn,
			sort_order: input.sortOrder,
			is_active: input.isActive === "true",
			updated_at: new Date().toISOString(),
		})
		.eq("id", input.id);
	return { error };
}

export const load: PageServerLoad = async ({ locals }) => {
	const admin = getServiceRoleClient();

	const [categoriesRes, statusesRes, conditionsRes, locationsRes, orgUnitsRes] = await Promise.all([
		admin.from("asset_categories").select("id,code,label_th,label_en,sort_order,is_active").order("sort_order", { ascending: true }),
		admin.from("asset_statuses").select("id,code,label_th,label_en,sort_order,is_active").order("sort_order", { ascending: true }),
		admin.from("asset_conditions").select("id,code,label_th,label_en,sort_order,is_active").order("sort_order", { ascending: true }),
		admin
			.from("stock_locations")
			.select("id,code,name,name_en,org_unit_id,description,sort_order,is_active")
			.order("sort_order", { ascending: true }),
		admin.from("org_units").select("id,code,name,name_en,sort_order").order("sort_order", { ascending: true }),
	]);

	return {
		locale: locals.locale,
		categories: categoriesRes.data ?? [],
		statuses: statusesRes.data ?? [],
		conditions: conditionsRes.data ?? [],
		locations: locationsRes.data ?? [],
		orgUnits: orgUnitsRes.data ?? [],
		errors: {
			categories: categoriesRes.error?.message ?? null,
			statuses: statusesRes.error?.message ?? null,
			conditions: conditionsRes.error?.message ?? null,
			locations: locationsRes.error?.message ?? null,
			orgUnits: orgUnitsRes.error?.message ?? null,
		},
	};
};

export const actions: Actions = {
	createAssetCategory: async ({ request, locals }) => {
		assertPermission(locals.user, "asset:manage");
		const admin = getServiceRoleClient();
		const formData = await request.formData();
		const parsed = lookupCreateSchema.safeParse({
			code: toText(formData.get("code")),
			labelTh: toText(formData.get("labelTh")),
			labelEn: toText(formData.get("labelEn")),
			sortOrder: toText(formData.get("sortOrder")) || undefined,
		});
		if (!parsed.success) {
			return fail(400, {
				action: "createAssetCategory",
				message: localizedActionMessage(locals.locale, "Invalid category data", "ข้อมูลประเภทไม่ถูกต้อง"),
			});
		}
		const { error, data } = await insertLookupRow(admin, "asset_categories", parsed.data);
		if (error) return fail(400, { action: "createAssetCategory", message: error.message });
		const actorEmployeeId = await currentEmployeeId(admin, locals.user);
		await writeSupplyAudit(admin, {
			entityType: "asset_category",
			entityId: String(data!.id),
			eventType: "created",
			actorUserId: locals.user.id,
			actorEmployeeId,
			summary: `Created asset category ${parsed.data.code}`,
		});
		return { success: true, action: "createAssetCategory" };
	},

	updateAssetCategory: async ({ request, locals }) => {
		assertPermission(locals.user, "asset:manage");
		const admin = getServiceRoleClient();
		const formData = await request.formData();
		const parsed = lookupUpdateSchema.safeParse({
			id: toText(formData.get("id")),
			labelTh: toText(formData.get("labelTh")),
			labelEn: toText(formData.get("labelEn")),
			sortOrder: toText(formData.get("sortOrder")),
			isActive: toText(formData.get("isActive")) || "true",
		});
		if (!parsed.success) {
			return fail(400, {
				action: "updateAssetCategory",
				message: localizedActionMessage(locals.locale, "Invalid category data", "ข้อมูลประเภทไม่ถูกต้อง"),
			});
		}
		const { error } = await updateLookupRow(admin, "asset_categories", parsed.data);
		if (error) return fail(400, { action: "updateAssetCategory", message: error.message });
		const actorEmployeeId = await currentEmployeeId(admin, locals.user);
		await writeSupplyAudit(admin, {
			entityType: "asset_category",
			entityId: parsed.data.id,
			eventType: "updated",
			actorUserId: locals.user.id,
			actorEmployeeId,
			summary: "Updated asset category",
		});
		return { success: true, action: "updateAssetCategory" };
	},

	createAssetStatus: async ({ request, locals }) => {
		assertPermission(locals.user, "asset:manage");
		const admin = getServiceRoleClient();
		const formData = await request.formData();
		const parsed = lookupCreateSchema.safeParse({
			code: toText(formData.get("code")),
			labelTh: toText(formData.get("labelTh")),
			labelEn: toText(formData.get("labelEn")),
			sortOrder: toText(formData.get("sortOrder")) || undefined,
		});
		if (!parsed.success) {
			return fail(400, {
				action: "createAssetStatus",
				message: localizedActionMessage(locals.locale, "Invalid status data", "ข้อมูลสถานะไม่ถูกต้อง"),
			});
		}
		const { error, data } = await insertLookupRow(admin, "asset_statuses", parsed.data);
		if (error) return fail(400, { action: "createAssetStatus", message: error.message });
		const actorEmployeeId = await currentEmployeeId(admin, locals.user);
		await writeSupplyAudit(admin, {
			entityType: "asset_status",
			entityId: String(data!.id),
			eventType: "created",
			actorUserId: locals.user.id,
			actorEmployeeId,
			summary: `Created asset status ${parsed.data.code}`,
		});
		return { success: true, action: "createAssetStatus" };
	},

	updateAssetStatus: async ({ request, locals }) => {
		assertPermission(locals.user, "asset:manage");
		const admin = getServiceRoleClient();
		const formData = await request.formData();
		const parsed = lookupUpdateSchema.safeParse({
			id: toText(formData.get("id")),
			labelTh: toText(formData.get("labelTh")),
			labelEn: toText(formData.get("labelEn")),
			sortOrder: toText(formData.get("sortOrder")),
			isActive: toText(formData.get("isActive")) || "true",
		});
		if (!parsed.success) {
			return fail(400, {
				action: "updateAssetStatus",
				message: localizedActionMessage(locals.locale, "Invalid status data", "ข้อมูลสถานะไม่ถูกต้อง"),
			});
		}
		const { error } = await updateLookupRow(admin, "asset_statuses", parsed.data);
		if (error) return fail(400, { action: "updateAssetStatus", message: error.message });
		const actorEmployeeId = await currentEmployeeId(admin, locals.user);
		await writeSupplyAudit(admin, {
			entityType: "asset_status",
			entityId: parsed.data.id,
			eventType: "updated",
			actorUserId: locals.user.id,
			actorEmployeeId,
			summary: "Updated asset status",
		});
		return { success: true, action: "updateAssetStatus" };
	},

	createAssetCondition: async ({ request, locals }) => {
		assertPermission(locals.user, "asset:manage");
		const admin = getServiceRoleClient();
		const formData = await request.formData();
		const parsed = lookupCreateSchema.safeParse({
			code: toText(formData.get("code")),
			labelTh: toText(formData.get("labelTh")),
			labelEn: toText(formData.get("labelEn")),
			sortOrder: toText(formData.get("sortOrder")) || undefined,
		});
		if (!parsed.success) {
			return fail(400, {
				action: "createAssetCondition",
				message: localizedActionMessage(locals.locale, "Invalid condition data", "ข้อมูลสภาพไม่ถูกต้อง"),
			});
		}
		const { error, data } = await insertLookupRow(admin, "asset_conditions", parsed.data);
		if (error) return fail(400, { action: "createAssetCondition", message: error.message });
		const actorEmployeeId = await currentEmployeeId(admin, locals.user);
		await writeSupplyAudit(admin, {
			entityType: "asset_condition",
			entityId: String(data!.id),
			eventType: "created",
			actorUserId: locals.user.id,
			actorEmployeeId,
			summary: `Created asset condition ${parsed.data.code}`,
		});
		return { success: true, action: "createAssetCondition" };
	},

	updateAssetCondition: async ({ request, locals }) => {
		assertPermission(locals.user, "asset:manage");
		const admin = getServiceRoleClient();
		const formData = await request.formData();
		const parsed = lookupUpdateSchema.safeParse({
			id: toText(formData.get("id")),
			labelTh: toText(formData.get("labelTh")),
			labelEn: toText(formData.get("labelEn")),
			sortOrder: toText(formData.get("sortOrder")),
			isActive: toText(formData.get("isActive")) || "true",
		});
		if (!parsed.success) {
			return fail(400, {
				action: "updateAssetCondition",
				message: localizedActionMessage(locals.locale, "Invalid condition data", "ข้อมูลสภาพไม่ถูกต้อง"),
			});
		}
		const { error } = await updateLookupRow(admin, "asset_conditions", parsed.data);
		if (error) return fail(400, { action: "updateAssetCondition", message: error.message });
		const actorEmployeeId = await currentEmployeeId(admin, locals.user);
		await writeSupplyAudit(admin, {
			entityType: "asset_condition",
			entityId: parsed.data.id,
			eventType: "updated",
			actorUserId: locals.user.id,
			actorEmployeeId,
			summary: "Updated asset condition",
		});
		return { success: true, action: "updateAssetCondition" };
	},

	createStockLocation: async ({ request, locals }) => {
		assertPermission(locals.user, "asset:manage");
		const admin = getServiceRoleClient();
		const formData = await request.formData();
		const parsed = locationCreateSchema.safeParse({
			code: toText(formData.get("code")),
			name: toText(formData.get("name")),
			nameEn: toText(formData.get("nameEn")),
			orgUnitId: toText(formData.get("orgUnitId")),
			sortOrder: toText(formData.get("sortOrder")) || undefined,
		});
		if (!parsed.success) {
			return fail(400, {
				action: "createStockLocation",
				message: localizedActionMessage(locals.locale, "Invalid location data", "ข้อมูลสถานที่ไม่ถูกต้อง"),
			});
		}
		const sortOrder = parsed.data.sortOrder ?? 0;
		const { data, error } = await admin
			.from("stock_locations")
			.insert({
				code: parsed.data.code,
				name: parsed.data.name,
				name_en: parsed.data.nameEn || null,
				org_unit_id: parsed.data.orgUnitId || null,
				description: optionalText(formData.get("description")),
				sort_order: sortOrder,
			})
			.select("id")
			.single();
		if (error) return fail(400, { action: "createStockLocation", message: error.message });
		const actorEmployeeId = await currentEmployeeId(admin, locals.user);
		await writeSupplyAudit(admin, {
			entityType: "stock_location",
			entityId: String((data as { id: string }).id),
			eventType: "created",
			actorUserId: locals.user.id,
			actorEmployeeId,
			summary: `Created stock location ${parsed.data.code}`,
		});
		return { success: true, action: "createStockLocation" };
	},

	updateStockLocation: async ({ request, locals }) => {
		assertPermission(locals.user, "asset:manage");
		const admin = getServiceRoleClient();
		const formData = await request.formData();
		const parsed = locationUpdateSchema.safeParse({
			id: toText(formData.get("id")),
			name: toText(formData.get("name")),
			nameEn: toText(formData.get("nameEn")),
			orgUnitId: toText(formData.get("orgUnitId")),
			sortOrder: toText(formData.get("sortOrder")),
			isActive: toText(formData.get("isActive")) || "true",
		});
		if (!parsed.success) {
			return fail(400, {
				action: "updateStockLocation",
				message: localizedActionMessage(locals.locale, "Invalid location data", "ข้อมูลสถานที่ไม่ถูกต้อง"),
			});
		}
		const { error } = await admin
			.from("stock_locations")
			.update({
				name: parsed.data.name,
				name_en: parsed.data.nameEn || null,
				org_unit_id: parsed.data.orgUnitId || null,
				description: optionalText(formData.get("description")),
				sort_order: parsed.data.sortOrder,
				is_active: parsed.data.isActive === "true",
				updated_at: new Date().toISOString(),
			})
			.eq("id", parsed.data.id);
		if (error) return fail(400, { action: "updateStockLocation", message: error.message });
		const actorEmployeeId = await currentEmployeeId(admin, locals.user);
		await writeSupplyAudit(admin, {
			entityType: "stock_location",
			entityId: parsed.data.id,
			eventType: "updated",
			actorUserId: locals.user.id,
			actorEmployeeId,
			summary: "Updated stock location",
		});
		return { success: true, action: "updateStockLocation" };
	},

	deleteAssetCategory: async ({ request, locals }) => {
		assertPermission(locals.user, "asset:manage");
		const admin = getServiceRoleClient();
		const formData = await request.formData();
		const parsed = deleteIdSchema.safeParse({ id: toText(formData.get("id")) });
		if (!parsed.success) {
			return fail(400, {
				action: "deleteAssetCategory",
				message: localizedActionMessage(locals.locale, "Invalid id", "รหัสไม่ถูกต้อง"),
			});
		}
		const id = parsed.data.id;
		const { error } = await admin.from("asset_categories").delete().eq("id", id);
		if (error) return fail(400, { action: "deleteAssetCategory", message: mapDeleteError(locals.locale, error) });
		const actorEmployeeId = await currentEmployeeId(admin, locals.user);
		await writeSupplyAudit(admin, {
			entityType: "asset_category",
			entityId: id,
			eventType: "deleted",
			actorUserId: locals.user.id,
			actorEmployeeId,
			summary: "Deleted asset category",
		});
		return { success: true, action: "deleteAssetCategory" };
	},

	deleteAssetStatus: async ({ request, locals }) => {
		assertPermission(locals.user, "asset:manage");
		const admin = getServiceRoleClient();
		const formData = await request.formData();
		const parsed = deleteIdSchema.safeParse({ id: toText(formData.get("id")) });
		if (!parsed.success) {
			return fail(400, {
				action: "deleteAssetStatus",
				message: localizedActionMessage(locals.locale, "Invalid id", "รหัสไม่ถูกต้อง"),
			});
		}
		const id = parsed.data.id;
		const { error } = await admin.from("asset_statuses").delete().eq("id", id);
		if (error) return fail(400, { action: "deleteAssetStatus", message: mapDeleteError(locals.locale, error) });
		const actorEmployeeId = await currentEmployeeId(admin, locals.user);
		await writeSupplyAudit(admin, {
			entityType: "asset_status",
			entityId: id,
			eventType: "deleted",
			actorUserId: locals.user.id,
			actorEmployeeId,
			summary: "Deleted asset status",
		});
		return { success: true, action: "deleteAssetStatus" };
	},

	deleteAssetCondition: async ({ request, locals }) => {
		assertPermission(locals.user, "asset:manage");
		const admin = getServiceRoleClient();
		const formData = await request.formData();
		const parsed = deleteIdSchema.safeParse({ id: toText(formData.get("id")) });
		if (!parsed.success) {
			return fail(400, {
				action: "deleteAssetCondition",
				message: localizedActionMessage(locals.locale, "Invalid id", "รหัสไม่ถูกต้อง"),
			});
		}
		const id = parsed.data.id;
		const { error } = await admin.from("asset_conditions").delete().eq("id", id);
		if (error) return fail(400, { action: "deleteAssetCondition", message: mapDeleteError(locals.locale, error) });
		const actorEmployeeId = await currentEmployeeId(admin, locals.user);
		await writeSupplyAudit(admin, {
			entityType: "asset_condition",
			entityId: id,
			eventType: "deleted",
			actorUserId: locals.user.id,
			actorEmployeeId,
			summary: "Deleted asset condition",
		});
		return { success: true, action: "deleteAssetCondition" };
	},

	deleteStockLocation: async ({ request, locals }) => {
		assertPermission(locals.user, "asset:manage");
		const admin = getServiceRoleClient();
		const formData = await request.formData();
		const parsed = deleteIdSchema.safeParse({ id: toText(formData.get("id")) });
		if (!parsed.success) {
			return fail(400, {
				action: "deleteStockLocation",
				message: localizedActionMessage(locals.locale, "Invalid id", "รหัสไม่ถูกต้อง"),
			});
		}
		const id = parsed.data.id;
		const { error } = await admin.from("stock_locations").delete().eq("id", id);
		if (error) return fail(400, { action: "deleteStockLocation", message: mapDeleteError(locals.locale, error) });
		const actorEmployeeId = await currentEmployeeId(admin, locals.user);
		await writeSupplyAudit(admin, {
			entityType: "stock_location",
			entityId: id,
			eventType: "deleted",
			actorUserId: locals.user.id,
			actorEmployeeId,
			summary: "Deleted stock location",
		});
		return { success: true, action: "deleteStockLocation" };
	},
};
