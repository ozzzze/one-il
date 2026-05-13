import { error, fail } from "@sveltejs/kit";
import { z } from "zod";
import { getServiceRoleClient } from "$lib/server/supabase-admin.js";
import { assertPermission } from "$lib/server/guards.js";
import {
	assetAssignmentSelect,
	assetDetailSelect,
	assetMaintenanceSelect,
	mapAssetAssignmentRow,
	mapAssetMaintenanceRow,
	mapAssetRowToDetailView,
	type AssetAssignmentRow,
	type AssetMaintenanceRow,
	type AssetRegisterRow,
} from "$lib/server/assets-load.js";
import { currentEmployeeId, documentNo, localizedActionMessage, toText, writeSupplyAudit } from "$lib/server/supply-asset.js";
import type { Actions, PageServerLoad } from "./$types.js";

const assignmentSchema = z.object({
	assetId: z.string().uuid(),
	responsibleEmployeeId: z.string().uuid().optional().or(z.literal("")),
	orgUnitId: z.string().uuid().optional().or(z.literal("")),
	locationId: z.string().uuid().optional().or(z.literal("")),
	note: z.string().trim().max(1000).optional().or(z.literal("")),
});

const maintenanceSchema = z.object({
	assetId: z.string().uuid(),
	issue: z.string().trim().min(1).max(1000),
	actionTaken: z.string().trim().max(1000).optional().or(z.literal("")),
	cost: z.coerce.number().min(0).max(999999999).optional(),
	vendor: z.string().trim().max(255).optional().or(z.literal("")),
	status: z.enum(["reported", "in_progress", "completed", "cancelled"]),
});

const updateAssetSchema = z.object({
	assetId: z.string().uuid(),
	assetNo: z.string().trim().min(2).max(120),
	name: z.string().trim().min(1).max(255),
	nameEn: z.string().trim().max(255).optional().or(z.literal("")),
	categoryId: z.string().uuid(),
	statusId: z.string().uuid(),
	conditionId: z.string().uuid().optional().or(z.literal("")),
	acquiredAt: z.string().optional().or(z.literal("")),
	acquisitionCost: z.coerce.number().min(0).max(999999999).optional(),
	budgetSource: z.string().trim().max(255).optional().or(z.literal("")),
	brand: z.string().trim().max(255).optional().or(z.literal("")),
	model: z.string().trim().max(255).optional().or(z.literal("")),
	serialNo: z.string().trim().max(255).optional().or(z.literal("")),
	documentRef: z.string().trim().max(255).optional().or(z.literal("")),
	note: z.string().trim().max(4000).optional().or(z.literal("")),
});

function mapAssetWorkflowTableError(raw: string, code: string | undefined, locale: "th" | "en", table: string) {
	const missingTable =
		code === "42P01" ||
		raw.includes(`Could not find the table 'public.${table}' in the schema cache`) ||
		(raw.toLowerCase().includes("does not exist") && raw.includes(table));
	if (!missingTable) return raw;
	return localizedActionMessage(
		locale,
		`Asset workflow schema is incomplete. Apply the asset workflow catch-up migration and reload the schema cache (missing public.${table}).`,
		`ฐานข้อมูล workflow ครุภัณฑ์ยังไม่ครบ ให้ apply migration สำหรับ catch-up และ reload schema cache (ขาด public.${table})`,
	);
}

export const load: PageServerLoad = async ({ params, locals }) => {
	assertPermission(locals.user, "asset:view");
	const admin = getServiceRoleClient();
	const [
		assetRes,
		assignmentsRes,
		maintenanceRes,
		categoriesRes,
		statusesRes,
		conditionsRes,
		employeesRes,
		orgUnitsRes,
		locationsRes,
	] = await Promise.all([
		admin
			.from("asset_registers")
			.select(assetDetailSelect)
			.eq("id", params.id)
			.maybeSingle(),
		admin
			.from("asset_assignments")
			.select(assetAssignmentSelect)
			.eq("asset_id", params.id)
			.order("starts_at", { ascending: false }),
		admin
			.from("asset_maintenance")
			.select(assetMaintenanceSelect)
			.eq("asset_id", params.id)
			.order("reported_at", { ascending: false }),
		admin.from("asset_categories").select("id,code,label_th,label_en,sort_order").eq("is_active", true).order("sort_order", { ascending: true }),
		admin.from("asset_statuses").select("id,code,label_th,label_en,sort_order").eq("is_active", true).order("sort_order", { ascending: true }),
		admin.from("asset_conditions").select("id,code,label_th,label_en,sort_order").eq("is_active", true).order("sort_order", { ascending: true }),
		admin.from("employees").select("id,first_name,last_name,employee_no").order("first_name", { ascending: true }),
		admin.from("org_units").select("id,code,name,name_en,sort_order").order("sort_order", { ascending: true }),
		admin.from("stock_locations").select("id,code,name,name_en,is_active").eq("is_active", true).order("sort_order", { ascending: true }),
	]);

	if (assetRes.error) error(500, assetRes.error.message);
	if (!assetRes.data) error(404, "Asset not found");

	return {
		locale: locals.locale,
		asset: mapAssetRowToDetailView(assetRes.data as unknown as AssetRegisterRow),
		assignments: ((assignmentsRes.data ?? []) as unknown as AssetAssignmentRow[]).map(mapAssetAssignmentRow),
		maintenance: ((maintenanceRes.data ?? []) as unknown as AssetMaintenanceRow[]).map(mapAssetMaintenanceRow),
		categories: categoriesRes.data ?? [],
		statuses: statusesRes.data ?? [],
		conditions: conditionsRes.data ?? [],
		employees: employeesRes.data ?? [],
		orgUnits: orgUnitsRes.data ?? [],
		locations: locationsRes.data ?? [],
		errors: {
			assignments: assignmentsRes.error?.message ?? null,
			maintenance: maintenanceRes.error
				? mapAssetWorkflowTableError(maintenanceRes.error.message, maintenanceRes.error.code, locals.locale, "asset_maintenance")
				: null,
			categories: categoriesRes.error?.message ?? null,
			statuses: statusesRes.error?.message ?? null,
			conditions: conditionsRes.error?.message ?? null,
			employees: employeesRes.error?.message ?? null,
			orgUnits: orgUnitsRes.error?.message ?? null,
			locations: locationsRes.error?.message ?? null,
		},
	};
};

export const actions: Actions = {
	updateAsset: async ({ request, params, locals }) => {
		assertPermission(locals.user, "asset:manage");
		const admin = getServiceRoleClient();
		const formData = await request.formData();
		const parsed = updateAssetSchema.safeParse({
			assetId: toText(formData.get("assetId")),
			assetNo: toText(formData.get("assetNo")),
			name: toText(formData.get("name")),
			nameEn: toText(formData.get("nameEn")),
			categoryId: toText(formData.get("categoryId")),
			statusId: toText(formData.get("statusId")),
			conditionId: toText(formData.get("conditionId")),
			acquiredAt: toText(formData.get("acquiredAt")),
			acquisitionCost: toText(formData.get("acquisitionCost")) || undefined,
			budgetSource: toText(formData.get("budgetSource")),
			brand: toText(formData.get("brand")),
			model: toText(formData.get("model")),
			serialNo: toText(formData.get("serialNo")),
			documentRef: toText(formData.get("documentRef")),
			note: toText(formData.get("note")),
		});

		if (!parsed.success || parsed.data.assetId !== params.id) {
			return fail(400, {
				action: "updateAsset",
				message: localizedActionMessage(locals.locale, "Asset data is invalid", "ข้อมูลครุภัณฑ์ไม่ถูกต้อง"),
			});
		}

		const { error: assetError } = await admin
			.from("asset_registers")
			.update({
				asset_no: parsed.data.assetNo,
				name: parsed.data.name,
				name_en: parsed.data.nameEn || null,
				category_id: parsed.data.categoryId,
				status_id: parsed.data.statusId,
				condition_id: parsed.data.conditionId || null,
				acquired_at: parsed.data.acquiredAt || null,
				acquisition_cost: parsed.data.acquisitionCost ?? null,
				budget_source: parsed.data.budgetSource || null,
				brand: parsed.data.brand || null,
				model: parsed.data.model || null,
				serial_no: parsed.data.serialNo || null,
				document_ref: parsed.data.documentRef || null,
				note: parsed.data.note || null,
				updated_at: new Date().toISOString(),
			})
			.eq("id", parsed.data.assetId);
		if (assetError) return fail(400, { action: "updateAsset", message: assetError.message });

		const actorEmployeeId = await currentEmployeeId(admin, locals.user);
		await writeSupplyAudit(admin, {
			entityType: "asset_register",
			entityId: parsed.data.assetId,
			eventType: "updated",
			actorUserId: locals.user.id,
			actorEmployeeId,
			summary: `Updated asset ${parsed.data.assetNo}`,
		});
		return { success: true, action: "updateAsset" };
	},

	assignAsset: async ({ request, locals }) => {
		assertPermission(locals.user, "asset:manage");
		const admin = getServiceRoleClient();
		const formData = await request.formData();
		const parsed = assignmentSchema.safeParse({
			assetId: toText(formData.get("assetId")),
			responsibleEmployeeId: toText(formData.get("responsibleEmployeeId")),
			orgUnitId: toText(formData.get("orgUnitId")),
			locationId: toText(formData.get("locationId")),
			note: toText(formData.get("note")),
		});

		if (!parsed.success) {
			return fail(400, {
				action: "assignAsset",
				message: localizedActionMessage(locals.locale, "Assignment data is invalid", "ข้อมูลผู้รับผิดชอบ/สถานที่ไม่ถูกต้อง"),
			});
		}

		const today = new Date().toISOString().slice(0, 10);
		const { error: closeError } = await admin
			.from("asset_assignments")
			.update({ ends_at: today })
			.eq("asset_id", parsed.data.assetId)
			.is("ends_at", null);
		if (closeError) return fail(400, { action: "assignAsset", message: closeError.message });

		const { error: assignmentError } = await admin.from("asset_assignments").insert({
			asset_id: parsed.data.assetId,
			responsible_employee_id: parsed.data.responsibleEmployeeId || null,
			org_unit_id: parsed.data.orgUnitId || null,
			location_id: parsed.data.locationId || null,
			starts_at: today,
			note: parsed.data.note || null,
			created_by_user_id: locals.user.id,
		});
		if (assignmentError) return fail(400, { action: "assignAsset", message: assignmentError.message });

		const { error: assetError } = await admin
			.from("asset_registers")
			.update({
				responsible_employee_id: parsed.data.responsibleEmployeeId || null,
				org_unit_id: parsed.data.orgUnitId || null,
				location_id: parsed.data.locationId || null,
				updated_at: new Date().toISOString(),
			})
			.eq("id", parsed.data.assetId);
		if (assetError) return fail(400, { action: "assignAsset", message: assetError.message });

		const actorEmployeeId = await currentEmployeeId(admin, locals.user);
		await writeSupplyAudit(admin, {
			entityType: "asset_register",
			entityId: parsed.data.assetId,
			eventType: "assigned",
			actorUserId: locals.user.id,
			actorEmployeeId,
			summary: "Updated asset responsibility/location",
		});
		return { success: true, action: "assignAsset" };
	},

	createMaintenance: async ({ request, locals }) => {
		assertPermission(locals.user, "asset:manage");
		const admin = getServiceRoleClient();
		const actorEmployeeId = await currentEmployeeId(admin, locals.user);
		const formData = await request.formData();
		const parsed = maintenanceSchema.safeParse({
			assetId: toText(formData.get("assetId")),
			issue: toText(formData.get("issue")),
			actionTaken: toText(formData.get("actionTaken")),
			cost: toText(formData.get("cost")) || undefined,
			vendor: toText(formData.get("vendor")),
			status: toText(formData.get("status")) || "reported",
		});

		if (!parsed.success) {
			return fail(400, {
				action: "createMaintenance",
				message: localizedActionMessage(locals.locale, "Maintenance data is invalid", "ข้อมูลซ่อมบำรุงไม่ถูกต้อง"),
			});
		}

		const maintenanceNo = documentNo("AM");
		const { data, error: maintenanceError } = await admin
			.from("asset_maintenance")
			.insert({
				maintenance_no: maintenanceNo,
				asset_id: parsed.data.assetId,
				reported_by_employee_id: actorEmployeeId,
				status: parsed.data.status,
				issue: parsed.data.issue,
				action_taken: parsed.data.actionTaken || null,
				cost: parsed.data.cost ?? null,
				vendor: parsed.data.vendor || null,
				completed_at: parsed.data.status === "completed" ? new Date().toISOString() : null,
				created_by_user_id: locals.user.id,
			})
			.select("id")
			.single();
		if (maintenanceError) {
			return fail(400, {
				action: "createMaintenance",
				message: mapAssetWorkflowTableError(maintenanceError.message, maintenanceError.code, locals.locale, "asset_maintenance"),
			});
		}

		await writeSupplyAudit(admin, {
			entityType: "asset_maintenance",
			entityId: String((data as { id: string }).id),
			eventType: "created",
			actorUserId: locals.user.id,
			actorEmployeeId,
			summary: `Created maintenance record ${maintenanceNo}`,
		});
		return { success: true, action: "createMaintenance" };
	},
};
