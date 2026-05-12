import { fail } from "@sveltejs/kit";
import { z } from "zod";
import { getServiceRoleClient } from "$lib/server/supabase-admin.js";
import { assertPermission } from "$lib/server/guards.js";
import { currentEmployeeId, documentNo, localizedActionMessage, optionalText, toText, writeSupplyAudit } from "$lib/server/supply-asset.js";
import type { Actions, PageServerLoad } from "./$types.js";

const receiptSchema = z.object({
	itemId: z.string().uuid(),
	locationId: z.string().uuid(),
	quantity: z.coerce.number().positive().max(999999),
	unitCost: z.coerce.number().min(0).max(999999999).optional(),
	sourceType: z.enum(["purchase", "transfer", "return", "opening", "manual"]),
	documentRef: z.string().trim().max(255).optional().or(z.literal("")),
	note: z.string().trim().max(1000).optional().or(z.literal("")),
});

export const load: PageServerLoad = async ({ locals }) => {
	assertPermission(locals.user, "supply:manage");
	const admin = getServiceRoleClient();
	const [receiptsRes, movementsRes, itemsRes, locationsRes] = await Promise.all([
		admin
			.from("material_receipts")
			.select("id,receipt_no,received_at,source_type,document_ref,note, stock_locations(name,name_en)")
			.order("created_at", { ascending: false })
			.limit(50),
		admin
			.from("material_stock_movements")
			.select("id,receipt_id,item_id,quantity,unit_cost,created_at, material_items(code,name,name_en)")
			.not("receipt_id", "is", null)
			.order("created_at", { ascending: false })
			.limit(100),
		admin.from("material_items").select("id,code,name,name_en,is_active").eq("is_active", true).order("code", { ascending: true }),
		admin.from("stock_locations").select("id,code,name,name_en,is_active").eq("is_active", true).order("sort_order", { ascending: true }),
	]);

	return {
		locale: locals.locale,
		receipts: receiptsRes.data ?? [],
		movements: movementsRes.data ?? [],
		items: itemsRes.data ?? [],
		locations: locationsRes.data ?? [],
		errors: {
			receipts: receiptsRes.error?.message ?? null,
			movements: movementsRes.error?.message ?? null,
			items: itemsRes.error?.message ?? null,
			locations: locationsRes.error?.message ?? null,
		},
	};
};

export const actions: Actions = {
	createReceipt: async ({ request, locals }) => {
		assertPermission(locals.user, "supply:manage");
		const admin = getServiceRoleClient();
		const formData = await request.formData();
		const parsed = receiptSchema.safeParse({
			itemId: toText(formData.get("itemId")),
			locationId: toText(formData.get("locationId")),
			quantity: toText(formData.get("quantity")),
			unitCost: toText(formData.get("unitCost")) || undefined,
			sourceType: toText(formData.get("sourceType")),
			documentRef: toText(formData.get("documentRef")),
			note: toText(formData.get("note")),
		});

		if (!parsed.success) {
			return fail(400, {
				action: "createReceipt",
				message: localizedActionMessage(locals.locale, "Receipt data is invalid", "ข้อมูลรับเข้าวัสดุไม่ถูกต้อง"),
			});
		}

		const actorEmployeeId = await currentEmployeeId(admin, locals.user);
		const receiptNo = documentNo("MR");
		const { data: receipt, error: receiptError } = await admin
			.from("material_receipts")
			.insert({
				receipt_no: receiptNo,
				location_id: parsed.data.locationId,
				source_type: parsed.data.sourceType,
				document_ref: parsed.data.documentRef || null,
				note: parsed.data.note || null,
				created_by_user_id: locals.user.id,
			})
			.select("id")
			.single();

		if (receiptError) return fail(400, { action: "createReceipt", message: receiptError.message });
		const receiptId = String((receipt as { id: string }).id);

		const { error: movementError } = await admin.from("material_stock_movements").insert({
			item_id: parsed.data.itemId,
			location_id: parsed.data.locationId,
			movement_type: parsed.data.sourceType === "opening" ? "opening" : parsed.data.sourceType === "return" ? "return" : "receipt",
			quantity: parsed.data.quantity,
			unit_cost: parsed.data.unitCost ?? null,
			receipt_id: receiptId,
			document_ref: parsed.data.documentRef || null,
			note: parsed.data.note || null,
			created_by_user_id: locals.user.id,
		});

		if (movementError) return fail(400, { action: "createReceipt", message: movementError.message });
		await writeSupplyAudit(admin, {
			entityType: "material_receipt",
			entityId: receiptId,
			eventType: "created",
			actorUserId: locals.user.id,
			actorEmployeeId,
			summary: `Received material stock ${receiptNo}`,
			metadata: {
				itemId: parsed.data.itemId,
				locationId: parsed.data.locationId,
				quantity: parsed.data.quantity,
				documentRef: optionalText(formData.get("documentRef")),
			},
		});

		return { success: true, action: "createReceipt" };
	},
};
