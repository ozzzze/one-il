import { error, fail } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types.js";
import { assertAdminRole } from "$lib/server/guards.js";
import {
	reservableAssetDeleteSchema,
	reservableAssetSchema,
	roomDefaultAssetDeleteSchema,
	roomDefaultAssetSchema,
	roomManagementSchema,
	roomScheduleBlockSchema,
} from "$lib/requests/room-booking-schema.js";
import { toFacultyDateTimeIso } from "$lib/requests/faculty-request.js";
import {
	loadAssetRegisterOptions,
	loadEmployeeOptions,
	loadReservableAssetCatalog,
	loadRoomOptions,
	loadStockLocationOptions,
	requestActionMessage,
} from "$lib/server/faculty-requests.js";
import { getServiceRoleClient } from "$lib/server/supabase-admin.js";

export const load: PageServerLoad = async ({ locals }) => {
	assertAdminRole(locals.user);

	const admin = getServiceRoleClient();
	const [rooms, employees, stockLocations, assetOptions, reservableAssets, blocks] = await Promise.all([
		loadRoomOptions(admin, { includeInactive: true }),
		loadEmployeeOptions(admin),
		loadStockLocationOptions(admin),
		loadAssetRegisterOptions(admin),
		loadReservableAssetCatalog(admin),
		admin
			.from("room_schedule_blocks")
			.select("id,room_id,block_type,starts_at,ends_at,reason")
			.order("starts_at", { ascending: false })
			.limit(100),
	]);

	if (blocks.error) throw blocks.error;

	return {
		locale: locals.locale,
		rooms,
		employees,
		stockLocations,
		assetOptions,
		reservableAssets,
		blocks: blocks.data ?? [],
	};
};

export const actions: Actions = {
	upsertRoom: async ({ request, locals }) => {
		assertAdminRole(locals.user);

		const formData = await request.formData();
		const parsed = roomManagementSchema.safeParse({
			roomId: typeof formData.get("roomId") === "string" ? formData.get("roomId") : "",
			stockLocationId:
				typeof formData.get("stockLocationId") === "string" ? formData.get("stockLocationId") : "",
			roomCode: typeof formData.get("roomCode") === "string" ? formData.get("roomCode") : "",
			name: typeof formData.get("name") === "string" ? formData.get("name") : "",
			nameEn: typeof formData.get("nameEn") === "string" ? formData.get("nameEn") : "",
			roomType: typeof formData.get("roomType") === "string" ? formData.get("roomType") : "",
			capacity: typeof formData.get("capacity") === "string" ? formData.get("capacity") : "",
			approverEmployeeId:
				typeof formData.get("approverEmployeeId") === "string"
					? formData.get("approverEmployeeId")
					: "",
			bookingWindowDays:
				typeof formData.get("bookingWindowDays") === "string"
					? formData.get("bookingWindowDays")
					: "",
			minAdvanceHours:
				typeof formData.get("minAdvanceHours") === "string"
					? formData.get("minAdvanceHours")
					: "",
			setupBufferMinutes:
				typeof formData.get("setupBufferMinutes") === "string"
					? formData.get("setupBufferMinutes")
					: "",
			cleanupBufferMinutes:
				typeof formData.get("cleanupBufferMinutes") === "string"
					? formData.get("cleanupBufferMinutes")
					: "",
			cancellationCutoffHours:
				typeof formData.get("cancellationCutoffHours") === "string"
					? formData.get("cancellationCutoffHours")
					: "",
			allowEquipmentRequest: formData.get("allowEquipmentRequest") != null,
			note: typeof formData.get("note") === "string" ? formData.get("note") : "",
			isActive: formData.get("isActive") != null,
		});

		if (!parsed.success) {
			return fail(400, {
				action: "upsertRoom",
				message: requestActionMessage(
					locals.locale,
					"Room data is invalid.",
					"ข้อมูลห้องไม่ถูกต้อง",
				),
			});
		}

		const admin = getServiceRoleClient();
		const payload = {
			stock_location_id: parsed.data.stockLocationId,
			room_code: parsed.data.roomCode,
			name: parsed.data.name,
			name_en: parsed.data.nameEn || null,
			room_type: parsed.data.roomType,
			capacity: parsed.data.capacity,
			approver_employee_id: parsed.data.approverEmployeeId,
			booking_window_days: parsed.data.bookingWindowDays,
			min_advance_hours: parsed.data.minAdvanceHours,
			setup_buffer_minutes: parsed.data.setupBufferMinutes,
			cleanup_buffer_minutes: parsed.data.cleanupBufferMinutes,
			cancellation_cutoff_hours: parsed.data.cancellationCutoffHours,
			allow_equipment_request: parsed.data.allowEquipmentRequest,
			note: parsed.data.note || null,
			is_active: parsed.data.isActive,
			updated_at: new Date().toISOString(),
		};

		const result = parsed.data.roomId
			? await admin.from("reservable_rooms").update(payload).eq("id", parsed.data.roomId)
			: await admin.from("reservable_rooms").insert(payload);

		if (result.error) {
			return fail(400, {
				action: "upsertRoom",
				message: result.error.message,
			});
		}

		return { success: true, action: "upsertRoom" };
	},
	addScheduleBlock: async ({ request, locals }) => {
		assertAdminRole(locals.user);

		const formData = await request.formData();
		const parsed = roomScheduleBlockSchema.safeParse({
			roomId: typeof formData.get("roomId") === "string" ? formData.get("roomId") : "",
			blockType: typeof formData.get("blockType") === "string" ? formData.get("blockType") : "",
			startDate: typeof formData.get("startDate") === "string" ? formData.get("startDate") : "",
			startTime: typeof formData.get("startTime") === "string" ? formData.get("startTime") : "",
			endDate: typeof formData.get("endDate") === "string" ? formData.get("endDate") : "",
			endTime: typeof formData.get("endTime") === "string" ? formData.get("endTime") : "",
			reason: typeof formData.get("reason") === "string" ? formData.get("reason") : "",
		});

		if (!parsed.success) {
			return fail(400, {
				action: "addScheduleBlock",
				message: requestActionMessage(
					locals.locale,
					"Schedule block data is invalid.",
					"ข้อมูลช่วงปิดห้องไม่ถูกต้อง",
				),
			});
		}

		const admin = getServiceRoleClient();
		const { error: insertError } = await admin.from("room_schedule_blocks").insert({
			room_id: parsed.data.roomId,
			block_type: parsed.data.blockType,
			starts_at: toFacultyDateTimeIso(parsed.data.startDate, parsed.data.startTime),
			ends_at: toFacultyDateTimeIso(parsed.data.endDate, parsed.data.endTime),
			reason: parsed.data.reason,
			created_by_user_id: locals.user.id,
		});

		if (insertError) {
			return fail(400, { action: "addScheduleBlock", message: insertError.message });
		}

		return { success: true, action: "addScheduleBlock" };
	},
	addDefaultAsset: async ({ request, locals }) => {
		assertAdminRole(locals.user);

		const formData = await request.formData();
		const parsed = roomDefaultAssetSchema.safeParse({
			roomId: typeof formData.get("roomId") === "string" ? formData.get("roomId") : "",
			assetId: typeof formData.get("assetId") === "string" ? formData.get("assetId") : "",
		});

		if (!parsed.success) {
			return fail(400, {
				action: "addDefaultAsset",
				message: requestActionMessage(
					locals.locale,
					"Default equipment data is invalid.",
					"ข้อมูลอุปกรณ์ประจำห้องไม่ถูกต้อง",
				),
			});
		}

		const admin = getServiceRoleClient();
		const { error: insertError } = await admin.from("room_default_assets").insert({
			room_id: parsed.data.roomId,
			asset_id: parsed.data.assetId,
		});

		if (insertError) {
			return fail(400, { action: "addDefaultAsset", message: insertError.message });
		}

		return { success: true, action: "addDefaultAsset" };
	},
	removeDefaultAsset: async ({ request, locals }) => {
		assertAdminRole(locals.user);

		const formData = await request.formData();
		const parsed = roomDefaultAssetDeleteSchema.safeParse({
			id: typeof formData.get("id") === "string" ? formData.get("id") : "",
		});

		if (!parsed.success) {
			return fail(400, {
				action: "removeDefaultAsset",
				message: requestActionMessage(
					locals.locale,
					"Default equipment reference is invalid.",
					"ข้อมูลอ้างอิงอุปกรณ์ประจำห้องไม่ถูกต้อง",
				),
			});
		}

		const admin = getServiceRoleClient();
		const { error: deleteError } = await admin.from("room_default_assets").delete().eq("id", parsed.data.id);
		if (deleteError) {
			return fail(400, { action: "removeDefaultAsset", message: deleteError.message });
		}

		return { success: true, action: "removeDefaultAsset" };
	},
	addReservableAsset: async ({ request, locals }) => {
		assertAdminRole(locals.user);

		const formData = await request.formData();
		const parsed = reservableAssetSchema.safeParse({
			assetId: typeof formData.get("assetId") === "string" ? formData.get("assetId") : "",
			isPortable: formData.get("isPortable") != null,
		});

		if (!parsed.success) {
			return fail(400, {
				action: "addReservableAsset",
				message: requestActionMessage(
					locals.locale,
					"Equipment catalog data is invalid.",
					"ข้อมูลคลังอุปกรณ์ที่จองได้ไม่ถูกต้อง",
				),
			});
		}

		const admin = getServiceRoleClient();
		const { error: upsertError } = await admin.from("reservable_asset_settings").upsert({
			asset_id: parsed.data.assetId,
			is_requestable: true,
			is_portable: parsed.data.isPortable,
			updated_at: new Date().toISOString(),
		});

		if (upsertError) {
			return fail(400, { action: "addReservableAsset", message: upsertError.message });
		}

		return { success: true, action: "addReservableAsset" };
	},
	removeReservableAsset: async ({ request, locals }) => {
		assertAdminRole(locals.user);

		const formData = await request.formData();
		const parsed = reservableAssetDeleteSchema.safeParse({
			assetId: typeof formData.get("assetId") === "string" ? formData.get("assetId") : "",
		});

		if (!parsed.success) {
			return fail(400, {
				action: "removeReservableAsset",
				message: requestActionMessage(
					locals.locale,
					"Equipment catalog reference is invalid.",
					"ข้อมูลอ้างอิงคลังอุปกรณ์ที่จองได้ไม่ถูกต้อง",
				),
			});
		}

		const admin = getServiceRoleClient();
		const { error: deleteError } = await admin
			.from("reservable_asset_settings")
			.delete()
			.eq("asset_id", parsed.data.assetId);

		if (deleteError) {
			return fail(400, { action: "removeReservableAsset", message: deleteError.message });
		}

		return { success: true, action: "removeReservableAsset" };
	},
};
