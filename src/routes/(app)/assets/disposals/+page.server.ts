import { fail } from "@sveltejs/kit";
import { z } from "zod";
import { getServiceRoleClient } from "$lib/server/supabase-admin.js";
import { assertPermission } from "$lib/server/guards.js";
import { currentEmployeeId, documentNo, localizedActionMessage, toText, writeSupplyAudit } from "$lib/server/supply-asset.js";
import type { Actions, PageServerLoad } from "./$types.js";

const disposalSchema = z.object({
	assetId: z.string().uuid(),
	method: z.enum(["sale", "transfer", "convert", "destroy", "write_off_lost"]),
	reason: z.string().trim().min(1).max(1000),
	estimatedValue: z.coerce.number().min(0).max(999999999).optional(),
});

const completeSchema = z.object({
	disposalId: z.string().uuid(),
	status: z.enum(["approved", "completed", "rejected", "cancelled"]),
	proceedsAmount: z.coerce.number().min(0).max(999999999).optional(),
});

export const load: PageServerLoad = async ({ locals }) => {
	assertPermission(locals.user, "asset:dispose");
	const admin = getServiceRoleClient();
	const [disposalsRes, assetsRes] = await Promise.all([
		admin
			.from("asset_disposal_requests")
			.select("id,disposal_no,method,reason,status,requested_at,approved_at,completed_at,proceeds_amount, requester:employees(id,first_name,last_name), asset_disposal_lines(id,estimated_value,final_value,remark, asset_registers(id,asset_no,name,name_en))")
			.order("requested_at", { ascending: false })
			.limit(100),
		admin
			.from("asset_registers")
			.select("id,asset_no,name,name_en, status:asset_statuses(code,label_th,label_en)")
			.order("asset_no", { ascending: true }),
	]);

	return {
		locale: locals.locale,
		disposals: disposalsRes.data ?? [],
		assets: assetsRes.data ?? [],
		errors: {
			disposals: disposalsRes.error?.message ?? null,
			assets: assetsRes.error?.message ?? null,
		},
	};
};

export const actions: Actions = {
	createDisposal: async ({ request, locals }) => {
		assertPermission(locals.user, "asset:dispose");
		const admin = getServiceRoleClient();
		const actorEmployeeId = await currentEmployeeId(admin, locals.user);
		const formData = await request.formData();
		const parsed = disposalSchema.safeParse({
			assetId: toText(formData.get("assetId")),
			method: toText(formData.get("method")),
			reason: toText(formData.get("reason")),
			estimatedValue: toText(formData.get("estimatedValue")) || undefined,
		});

		if (!parsed.success) {
			return fail(400, {
				action: "createDisposal",
				message: localizedActionMessage(locals.locale, "Disposal data is invalid", "ข้อมูลจำหน่ายครุภัณฑ์ไม่ถูกต้อง"),
			});
		}

		const disposalNo = documentNo("AD");
		const { data: disposal, error: disposalError } = await admin
			.from("asset_disposal_requests")
			.insert({
				disposal_no: disposalNo,
				method: parsed.data.method,
				reason: parsed.data.reason,
				status: "submitted",
				requested_by_employee_id: actorEmployeeId,
				created_by_user_id: locals.user.id,
			})
			.select("id")
			.single();
		if (disposalError) return fail(400, { action: "createDisposal", message: disposalError.message });

		const disposalId = String((disposal as { id: string }).id);
		const { error: lineError } = await admin.from("asset_disposal_lines").insert({
			disposal_id: disposalId,
			asset_id: parsed.data.assetId,
			estimated_value: parsed.data.estimatedValue ?? null,
		});
		if (lineError) return fail(400, { action: "createDisposal", message: lineError.message });

		const { data: pendingStatus } = await admin
			.from("asset_statuses")
			.select("id")
			.eq("code", "pending_disposal")
			.maybeSingle();
		const pendingStatusId = (pendingStatus as { id?: string } | null)?.id;
		if (pendingStatusId) {
			await admin.from("asset_registers").update({ status_id: pendingStatusId, updated_at: new Date().toISOString() }).eq("id", parsed.data.assetId);
		}

		await writeSupplyAudit(admin, {
			entityType: "asset_disposal",
			entityId: disposalId,
			eventType: "submitted",
			actorUserId: locals.user.id,
			actorEmployeeId,
			summary: `Submitted asset disposal ${disposalNo}`,
			metadata: { assetId: parsed.data.assetId, method: parsed.data.method },
		});
		return { success: true, action: "createDisposal" };
	},

	updateStatus: async ({ request, locals }) => {
		assertPermission(locals.user, "asset:dispose");
		const admin = getServiceRoleClient();
		const formData = await request.formData();
		const parsed = completeSchema.safeParse({
			disposalId: toText(formData.get("disposalId")),
			status: toText(formData.get("status")),
			proceedsAmount: toText(formData.get("proceedsAmount")) || undefined,
		});

		if (!parsed.success) {
			return fail(400, {
				action: "updateStatus",
				message: localizedActionMessage(locals.locale, "Disposal status is invalid", "สถานะจำหน่ายไม่ถูกต้อง"),
			});
		}

		const now = new Date().toISOString();
		const { error } = await admin
			.from("asset_disposal_requests")
			.update({
				status: parsed.data.status,
				approved_at: parsed.data.status === "approved" ? now : undefined,
				completed_at: parsed.data.status === "completed" ? now : undefined,
				proceeds_amount: parsed.data.proceedsAmount ?? null,
				updated_at: now,
			})
			.eq("id", parsed.data.disposalId);
		if (error) return fail(400, { action: "updateStatus", message: error.message });

		return { success: true, action: "updateStatus" };
	},
};
