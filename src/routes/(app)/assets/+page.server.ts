import { fail, redirect } from "@sveltejs/kit";
import { z } from "zod";
import { getServiceRoleClient } from "$lib/server/supabase-admin.js";
import { assertPermission } from "$lib/server/guards.js";
import { assetListSelect, mapAssetRowToListView, type AssetRegisterRow } from "$lib/server/assets-load.js";
import { currentEmployeeId, documentNo, localizedActionMessage, toText, writeSupplyAudit } from "$lib/server/supply-asset.js";
import type { Actions, PageServerLoad } from "./$types.js";

const assetSchema = z.object({
	assetNo: z.string().trim().min(2).max(120),
	name: z.string().trim().min(1).max(255),
	nameEn: z.string().trim().max(255).optional().or(z.literal("")),
	categoryId: z.string().uuid(),
	statusId: z.string().uuid(),
	conditionId: z.string().uuid().optional().or(z.literal("")),
	responsibleEmployeeId: z.string().uuid().optional().or(z.literal("")),
	orgUnitId: z.string().uuid().optional().or(z.literal("")),
	locationId: z.string().uuid().optional().or(z.literal("")),
	acquiredAt: z.string().optional().or(z.literal("")),
	acquisitionCost: z.coerce.number().min(0).max(999999999).optional(),
	budgetSource: z.string().trim().max(255).optional().or(z.literal("")),
	brand: z.string().trim().max(255).optional().or(z.literal("")),
	model: z.string().trim().max(255).optional().or(z.literal("")),
	serialNo: z.string().trim().max(255).optional().or(z.literal("")),
	documentRef: z.string().trim().max(255).optional().or(z.literal("")),
});

export const load: PageServerLoad = async ({ locals }) => {
	assertPermission(locals.user, "asset:view");
	const admin = getServiceRoleClient();
	const [assetsRes, categoriesRes, statusesRes, conditionsRes, employeesRes, orgUnitsRes, locationsRes] = await Promise.all([
		admin
			.from("asset_registers")
			.select(assetListSelect)
			.order("asset_no", { ascending: true }),
		admin.from("asset_categories").select("id,code,label_th,label_en,sort_order").eq("is_active", true).order("sort_order", { ascending: true }),
		admin.from("asset_statuses").select("id,code,label_th,label_en,sort_order").eq("is_active", true).order("sort_order", { ascending: true }),
		admin.from("asset_conditions").select("id,code,label_th,label_en,sort_order").eq("is_active", true).order("sort_order", { ascending: true }),
		admin.from("employees").select("id,first_name,last_name,employee_no").order("first_name", { ascending: true }),
		admin.from("org_units").select("id,code,name,name_en,sort_order").order("sort_order", { ascending: true }),
		admin.from("stock_locations").select("id,code,name,name_en,is_active").eq("is_active", true).order("sort_order", { ascending: true }),
	]);

	return {
		locale: locals.locale,
		assets: ((assetsRes.data ?? []) as unknown as AssetRegisterRow[]).map(mapAssetRowToListView),
		categories: categoriesRes.data ?? [],
		statuses: statusesRes.data ?? [],
		conditions: conditionsRes.data ?? [],
		employees: employeesRes.data ?? [],
		orgUnits: orgUnitsRes.data ?? [],
		locations: locationsRes.data ?? [],
		errors: {
			assets: assetsRes.error?.message ?? null,
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
	createAsset: async ({ request, locals }) => {
		assertPermission(locals.user, "asset:manage");
		const admin = getServiceRoleClient();
		const formData = await request.formData();
		const parsed = assetSchema.safeParse({
			assetNo: toText(formData.get("assetNo")) || documentNo("ASSET"),
			name: toText(formData.get("name")),
			nameEn: toText(formData.get("nameEn")),
			categoryId: toText(formData.get("categoryId")),
			statusId: toText(formData.get("statusId")),
			conditionId: toText(formData.get("conditionId")),
			responsibleEmployeeId: toText(formData.get("responsibleEmployeeId")),
			orgUnitId: toText(formData.get("orgUnitId")),
			locationId: toText(formData.get("locationId")),
			acquiredAt: toText(formData.get("acquiredAt")),
			acquisitionCost: toText(formData.get("acquisitionCost")) || undefined,
			budgetSource: toText(formData.get("budgetSource")),
			brand: toText(formData.get("brand")),
			model: toText(formData.get("model")),
			serialNo: toText(formData.get("serialNo")),
			documentRef: toText(formData.get("documentRef")),
		});

		if (!parsed.success) {
			const first = parsed.error.issues[0];
			const detail = first ? `${String(first.path[0] ?? "field")}: ${first.message}` : "";
			return fail(400, {
				action: "createAsset",
				message: localizedActionMessage(
					locals.locale,
					detail ? `Asset data is invalid (${detail})` : "Asset data is invalid",
					detail ? `ข้อมูลครุภัณฑ์ไม่ถูกต้อง (${detail})` : "ข้อมูลครุภัณฑ์ไม่ถูกต้อง",
				),
			});
		}

		function mapAssetInsertError(raw: string, code: string | undefined): string {
			const hint =
				locals.locale === "th"
					? "รัน migration ฐานข้อมูล (pnpm supabase:db:push) หรือตรวจว่ามีตาราง public.asset_registers"
					: "Apply database migrations (pnpm supabase:db:push) and ensure public.asset_registers exists.";
			if (
				code === "42P01" ||
				(raw.toLowerCase().includes("does not exist") && raw.includes("asset_registers"))
			) {
				return localizedActionMessage(locals.locale, `${raw}. ${hint}`, `${raw} ${hint}`);
			}
			if (code === "23505") {
				return localizedActionMessage(locals.locale, "Duplicate asset number or serial no.", "เลขครุภัณฑ์หรือ Serial ซ้ำ");
			}
			return raw;
		}

		const { data, error } = await admin
			.from("asset_registers")
			.insert({
				asset_no: parsed.data.assetNo,
				name: parsed.data.name,
				name_en: parsed.data.nameEn || null,
				category_id: parsed.data.categoryId,
				status_id: parsed.data.statusId,
				condition_id: parsed.data.conditionId || null,
				responsible_employee_id: parsed.data.responsibleEmployeeId || null,
				org_unit_id: parsed.data.orgUnitId || null,
				location_id: parsed.data.locationId || null,
				acquired_at: parsed.data.acquiredAt || null,
				acquisition_cost: parsed.data.acquisitionCost ?? null,
				budget_source: parsed.data.budgetSource || null,
				brand: parsed.data.brand || null,
				model: parsed.data.model || null,
				serial_no: parsed.data.serialNo || null,
				document_ref: parsed.data.documentRef || null,
				created_by_user_id: locals.user.id,
			})
			.select("id")
			.single();

		if (error) {
			return fail(400, {
				action: "createAsset",
				message: mapAssetInsertError(error.message, error.code),
			});
		}
		const assetId = String((data as { id: string }).id);

		if (parsed.data.responsibleEmployeeId || parsed.data.orgUnitId || parsed.data.locationId) {
			const { error: assignmentError } = await admin.from("asset_assignments").insert({
				asset_id: assetId,
				responsible_employee_id: parsed.data.responsibleEmployeeId || null,
				org_unit_id: parsed.data.orgUnitId || null,
				location_id: parsed.data.locationId || null,
				created_by_user_id: locals.user.id,
			});
			if (assignmentError) {
				await admin.from("asset_registers").delete().eq("id", assetId);
				return fail(400, {
					action: "createAsset",
					message: mapAssetInsertError(assignmentError.message, assignmentError.code),
				});
			}
		}

		const actorEmployeeId = await currentEmployeeId(admin, locals.user);
		await writeSupplyAudit(admin, {
			entityType: "asset_register",
			entityId: assetId,
			eventType: "created",
			actorUserId: locals.user.id,
			actorEmployeeId,
			summary: `Created asset ${parsed.data.assetNo}`,
		});
		throw redirect(303, `/assets/${assetId}`);
	},
};
