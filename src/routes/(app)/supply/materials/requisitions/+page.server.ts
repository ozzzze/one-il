import { fail } from "@sveltejs/kit";
import { z } from "zod";
import { getServiceRoleClient } from "$lib/server/supabase-admin.js";
import { assertPermission } from "$lib/server/guards.js";
import { currentEmployeeId, documentNo, localizedActionMessage, toText, writeSupplyAudit } from "$lib/server/supply-asset.js";
import type { Actions, PageServerLoad } from "./$types.js";

const createRequisitionSchema = z.object({
	purpose: z.string().trim().min(1).max(1000),
	orgUnitId: z.string().uuid().optional().or(z.literal("")),
	itemId: z.string().uuid(),
	requestedQuantity: z.coerce.number().positive().max(999999),
});

const approveLineSchema = z.object({
	requisitionId: z.string().uuid(),
	lineId: z.string().uuid(),
	approvedQuantity: z.coerce.number().min(0).max(999999),
});

const issueLineSchema = z.object({
	requisitionId: z.string().uuid(),
	lineId: z.string().uuid(),
	itemId: z.string().uuid(),
	locationId: z.string().uuid(),
	issueQuantity: z.coerce.number().positive().max(999999),
});

export const load: PageServerLoad = async ({ locals }) => {
	assertPermission(locals.user, "supply:view");
	const admin = getServiceRoleClient();
	const [requisitionsRes, itemsRes, locationsRes, orgUnitsRes] = await Promise.all([
		admin
			.from("material_requisitions")
			.select("id,requisition_no,purpose,status,requested_at,approved_at,issued_at, org_units(id,name,name_en), requester:employees(id,first_name,last_name), material_requisition_lines(id,item_id,requested_quantity,approved_quantity,issued_quantity,note, material_items(code,name,name_en))")
			.order("requested_at", { ascending: false })
			.limit(100),
		admin.from("material_items").select("id,code,name,name_en,is_active").eq("is_active", true).order("code", { ascending: true }),
		admin.from("stock_locations").select("id,code,name,name_en,is_active").eq("is_active", true).order("sort_order", { ascending: true }),
		admin.from("org_units").select("id,code,name,name_en,sort_order").order("sort_order", { ascending: true }),
	]);

	return {
		locale: locals.locale,
		requisitions: requisitionsRes.data ?? [],
		items: itemsRes.data ?? [],
		locations: locationsRes.data ?? [],
		orgUnits: orgUnitsRes.data ?? [],
		errors: {
			requisitions: requisitionsRes.error?.message ?? null,
			items: itemsRes.error?.message ?? null,
			locations: locationsRes.error?.message ?? null,
			orgUnits: orgUnitsRes.error?.message ?? null,
		},
	};
};

export const actions: Actions = {
	createRequisition: async ({ request, locals }) => {
		assertPermission(locals.user, "supply:request");
		const admin = getServiceRoleClient();
		const requesterEmployeeId = await currentEmployeeId(admin, locals.user);
		if (!requesterEmployeeId) {
			return fail(400, {
				action: "createRequisition",
				message: localizedActionMessage(locals.locale, "Your account is not linked to an employee profile", "บัญชีของคุณยังไม่ได้ผูกกับข้อมูลบุคลากร"),
			});
		}

		const formData = await request.formData();
		const parsed = createRequisitionSchema.safeParse({
			purpose: toText(formData.get("purpose")),
			orgUnitId: toText(formData.get("orgUnitId")),
			itemId: toText(formData.get("itemId")),
			requestedQuantity: toText(formData.get("requestedQuantity")),
		});

		if (!parsed.success) {
			return fail(400, {
				action: "createRequisition",
				message: localizedActionMessage(locals.locale, "Requisition data is invalid", "ข้อมูลใบเบิกวัสดุไม่ถูกต้อง"),
			});
		}

		const requisitionNo = documentNo("REQ");
		const { data: requisition, error: requisitionError } = await admin
			.from("material_requisitions")
			.insert({
				requisition_no: requisitionNo,
				requester_employee_id: requesterEmployeeId,
				org_unit_id: parsed.data.orgUnitId || null,
				purpose: parsed.data.purpose,
				status: "submitted",
				created_by_user_id: locals.user.id,
			})
			.select("id")
			.single();

		if (requisitionError) return fail(400, { action: "createRequisition", message: requisitionError.message });
		const requisitionId = String((requisition as { id: string }).id);

		const { error: lineError } = await admin.from("material_requisition_lines").insert({
			requisition_id: requisitionId,
			item_id: parsed.data.itemId,
			requested_quantity: parsed.data.requestedQuantity,
		});
		if (lineError) return fail(400, { action: "createRequisition", message: lineError.message });

		await writeSupplyAudit(admin, {
			entityType: "material_requisition",
			entityId: requisitionId,
			eventType: "submitted",
			actorUserId: locals.user.id,
			actorEmployeeId: requesterEmployeeId,
			summary: `Submitted material requisition ${requisitionNo}`,
		});
		return { success: true, action: "createRequisition" };
	},

	approveLine: async ({ request, locals }) => {
		assertPermission(locals.user, "supply:manage");
		const admin = getServiceRoleClient();
		const formData = await request.formData();
		const parsed = approveLineSchema.safeParse({
			requisitionId: toText(formData.get("requisitionId")),
			lineId: toText(formData.get("lineId")),
			approvedQuantity: toText(formData.get("approvedQuantity")),
		});

		if (!parsed.success) {
			return fail(400, {
				action: "approveLine",
				message: localizedActionMessage(locals.locale, "Approval data is invalid", "ข้อมูลอนุมัติไม่ถูกต้อง"),
			});
		}

		const { error: lineError } = await admin
			.from("material_requisition_lines")
			.update({ approved_quantity: parsed.data.approvedQuantity, updated_at: new Date().toISOString() })
			.eq("id", parsed.data.lineId);
		if (lineError) return fail(400, { action: "approveLine", message: lineError.message });

		const { error: reqError } = await admin
			.from("material_requisitions")
			.update({ status: "approved", approved_at: new Date().toISOString(), updated_at: new Date().toISOString() })
			.eq("id", parsed.data.requisitionId);
		if (reqError) return fail(400, { action: "approveLine", message: reqError.message });

		return { success: true, action: "approveLine" };
	},

	issueLine: async ({ request, locals }) => {
		assertPermission(locals.user, "supply:manage");
		const admin = getServiceRoleClient();
		const formData = await request.formData();
		const parsed = issueLineSchema.safeParse({
			requisitionId: toText(formData.get("requisitionId")),
			lineId: toText(formData.get("lineId")),
			itemId: toText(formData.get("itemId")),
			locationId: toText(formData.get("locationId")),
			issueQuantity: toText(formData.get("issueQuantity")),
		});

		if (!parsed.success) {
			return fail(400, {
				action: "issueLine",
				message: localizedActionMessage(locals.locale, "Issue data is invalid", "ข้อมูลจ่ายวัสดุไม่ถูกต้อง"),
			});
		}

		const { data: lineData, error: lineLoadError } = await admin
			.from("material_requisition_lines")
			.select("approved_quantity,issued_quantity")
			.eq("id", parsed.data.lineId)
			.single();
		if (lineLoadError) return fail(400, { action: "issueLine", message: lineLoadError.message });
		const line = lineData as { approved_quantity: number | null; issued_quantity: number };
		const approvedQuantity = Number(line.approved_quantity ?? 0);
		const nextIssuedQuantity = Number(line.issued_quantity ?? 0) + parsed.data.issueQuantity;
		if (nextIssuedQuantity > approvedQuantity) {
			return fail(400, {
				action: "issueLine",
				message: localizedActionMessage(locals.locale, "Issued quantity exceeds approved quantity", "จำนวนจ่ายเกินจำนวนที่อนุมัติ"),
			});
		}

		const { error: movementError } = await admin.from("material_stock_movements").insert({
			item_id: parsed.data.itemId,
			location_id: parsed.data.locationId,
			movement_type: "issue",
			quantity: parsed.data.issueQuantity,
			requisition_id: parsed.data.requisitionId,
			created_by_user_id: locals.user.id,
		});
		if (movementError) return fail(400, { action: "issueLine", message: movementError.message });

		const { error: updateLineError } = await admin
			.from("material_requisition_lines")
			.update({ issued_quantity: nextIssuedQuantity, updated_at: new Date().toISOString() })
			.eq("id", parsed.data.lineId);
		if (updateLineError) return fail(400, { action: "issueLine", message: updateLineError.message });

		const nextStatus = nextIssuedQuantity >= approvedQuantity ? "issued" : "partially_issued";
		const { error: reqError } = await admin
			.from("material_requisitions")
			.update({ status: nextStatus, issued_at: new Date().toISOString(), updated_at: new Date().toISOString() })
			.eq("id", parsed.data.requisitionId);
		if (reqError) return fail(400, { action: "issueLine", message: reqError.message });

		const actorEmployeeId = await currentEmployeeId(admin, locals.user);
		await writeSupplyAudit(admin, {
			entityType: "material_requisition",
			entityId: parsed.data.requisitionId,
			eventType: "issued",
			actorUserId: locals.user.id,
			actorEmployeeId,
			summary: `Issued material requisition line ${parsed.data.lineId}`,
			metadata: { quantity: parsed.data.issueQuantity, locationId: parsed.data.locationId },
		});
		return { success: true, action: "issueLine" };
	},
};
