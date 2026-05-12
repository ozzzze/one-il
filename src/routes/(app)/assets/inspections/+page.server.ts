import { fail } from "@sveltejs/kit";
import { z } from "zod";
import { getServiceRoleClient } from "$lib/server/supabase-admin.js";
import { assertPermission } from "$lib/server/guards.js";
import { currentEmployeeId, documentNo, localizedActionMessage, toText, writeSupplyAudit } from "$lib/server/supply-asset.js";
import type { Actions, PageServerLoad } from "./$types.js";

const inspectionSchema = z.object({
	fiscalYear: z.coerce.number().int().min(2500).max(2700),
	startsAt: z.string().min(1),
	endsAt: z.string().optional().or(z.literal("")),
	note: z.string().trim().max(1000).optional().or(z.literal("")),
});

const resultSchema = z.object({
	lineId: z.string().uuid(),
	assetId: z.string().uuid(),
	foundStatus: z.enum(["found", "not_found"]),
	conditionId: z.string().uuid().optional().or(z.literal("")),
	recommendation: z.enum(["keep_using", "repair", "dispose", "investigate"]).optional().or(z.literal("")),
	remark: z.string().trim().max(1000).optional().or(z.literal("")),
});

export const load: PageServerLoad = async ({ locals }) => {
	assertPermission(locals.user, "asset:inspect");
	const admin = getServiceRoleClient();
	const [inspectionsRes, linesRes, conditionsRes] = await Promise.all([
		admin
			.from("asset_annual_inspections")
			.select("id,fiscal_year,inspection_no,status,starts_at,ends_at,note,created_at")
			.order("created_at", { ascending: false })
			.limit(20),
		admin
			.from("asset_inspection_lines")
			.select("id,inspection_id,asset_id,found_status,recommendation,remark,inspected_at, asset_registers(asset_no,name,name_en), condition:asset_conditions(id,code,label_th,label_en)")
			.order("created_at", { ascending: false })
			.limit(200),
		admin.from("asset_conditions").select("id,code,label_th,label_en,sort_order").order("sort_order", { ascending: true }),
	]);

	return {
		locale: locals.locale,
		inspections: inspectionsRes.data ?? [],
		lines: linesRes.data ?? [],
		conditions: conditionsRes.data ?? [],
		errors: {
			inspections: inspectionsRes.error?.message ?? null,
			lines: linesRes.error?.message ?? null,
			conditions: conditionsRes.error?.message ?? null,
		},
	};
};

export const actions: Actions = {
	createInspection: async ({ request, locals }) => {
		assertPermission(locals.user, "asset:inspect");
		const admin = getServiceRoleClient();
		const formData = await request.formData();
		const parsed = inspectionSchema.safeParse({
			fiscalYear: toText(formData.get("fiscalYear")),
			startsAt: toText(formData.get("startsAt")),
			endsAt: toText(formData.get("endsAt")),
			note: toText(formData.get("note")),
		});

		if (!parsed.success) {
			return fail(400, {
				action: "createInspection",
				message: localizedActionMessage(locals.locale, "Inspection data is invalid", "ข้อมูลรอบตรวจนับไม่ถูกต้อง"),
			});
		}

		const inspectionNo = documentNo("AI");
		const { data: inspection, error: inspectionError } = await admin
			.from("asset_annual_inspections")
			.insert({
				fiscal_year: parsed.data.fiscalYear,
				inspection_no: inspectionNo,
				status: "in_progress",
				starts_at: parsed.data.startsAt,
				ends_at: parsed.data.endsAt || null,
				note: parsed.data.note || null,
				created_by_user_id: locals.user.id,
			})
			.select("id")
			.single();
		if (inspectionError) return fail(400, { action: "createInspection", message: inspectionError.message });

		const inspectionId = String((inspection as { id: string }).id);
		const { data: assets, error: assetsError } = await admin.from("asset_registers").select("id");
		if (assetsError) return fail(400, { action: "createInspection", message: assetsError.message });

		const linePayload = ((assets ?? []) as { id: string }[]).map((asset) => ({
			inspection_id: inspectionId,
			asset_id: asset.id,
		}));
		if (linePayload.length > 0) {
			const { error: lineError } = await admin.from("asset_inspection_lines").insert(linePayload);
			if (lineError) return fail(400, { action: "createInspection", message: lineError.message });
		}

		const actorEmployeeId = await currentEmployeeId(admin, locals.user);
		await writeSupplyAudit(admin, {
			entityType: "asset_inspection",
			entityId: inspectionId,
			eventType: "created",
			actorUserId: locals.user.id,
			actorEmployeeId,
			summary: `Created annual inspection ${inspectionNo}`,
			metadata: { assetCount: linePayload.length },
		});
		return { success: true, action: "createInspection" };
	},

	recordResult: async ({ request, locals }) => {
		assertPermission(locals.user, "asset:inspect");
		const admin = getServiceRoleClient();
		const formData = await request.formData();
		const parsed = resultSchema.safeParse({
			lineId: toText(formData.get("lineId")),
			assetId: toText(formData.get("assetId")),
			foundStatus: toText(formData.get("foundStatus")),
			conditionId: toText(formData.get("conditionId")),
			recommendation: toText(formData.get("recommendation")),
			remark: toText(formData.get("remark")),
		});

		if (!parsed.success) {
			return fail(400, {
				action: "recordResult",
				message: localizedActionMessage(locals.locale, "Inspection result is invalid", "ผลตรวจนับไม่ถูกต้อง"),
			});
		}

		const actorEmployeeId = await currentEmployeeId(admin, locals.user);
		const { error } = await admin
			.from("asset_inspection_lines")
			.update({
				found_status: parsed.data.foundStatus,
				condition_id: parsed.data.conditionId || null,
				recommendation: parsed.data.recommendation || null,
				remark: parsed.data.remark || null,
				inspected_by_employee_id: actorEmployeeId,
				inspected_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			})
			.eq("id", parsed.data.lineId);
		if (error) return fail(400, { action: "recordResult", message: error.message });

		await writeSupplyAudit(admin, {
			entityType: "asset_register",
			entityId: parsed.data.assetId,
			eventType: "inspected",
			actorUserId: locals.user.id,
			actorEmployeeId,
			summary: `Recorded annual inspection result ${parsed.data.foundStatus}`,
		});
		return { success: true, action: "recordResult" };
	},
};
