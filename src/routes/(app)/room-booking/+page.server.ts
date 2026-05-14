import { fail, redirect } from "@sveltejs/kit";
import { hasPermission } from "$lib/auth/roles.js";
import { roomBookingSubmissionSchema } from "$lib/requests/room-booking-schema.js";
import { toFacultyDateTimeIso } from "$lib/requests/faculty-request.js";
import { assertPermission } from "$lib/server/guards.js";
import {
	getCalendarRange,
	loadRoomCalendarData,
	loadReservableAssetCatalog,
	loadUserRequestList,
	requestActionMessage,
	roomBookingActionErrorMessage,
	submitRoomBookingRequest,
} from "$lib/server/faculty-requests.js";
import { getServiceRoleClient } from "$lib/server/supabase-admin.js";
import type { Actions, PageServerLoad } from "./$types.js";

export const load: PageServerLoad = async ({ locals, url }) => {
	assertPermission(locals.user, "requests:create");
	const admin = getServiceRoleClient();
	const view = url.searchParams.get("view") === "week" ? "week" : "day";
	const roomType = url.searchParams.get("roomType");
	const selectedDate = url.searchParams.get("date");
	const range = getCalendarRange(selectedDate, view);
	const [calendar, ownRequests, equipmentCatalog] = await Promise.all([
		loadRoomCalendarData(admin, {
			selectedDate: range.selectedDate,
			view,
			roomType,
		}),
		loadUserRequestList(admin, locals.user.id),
		loadReservableAssetCatalog(admin),
	]);

	return {
		locale: locals.locale,
		canManage: hasPermission(locals.user.role, "requests:manage"),
		view,
		selectedDate: range.selectedDate,
		roomType,
		rangeStart: range.rangeStart,
		rangeEnd: range.rangeEnd,
		rooms: calendar.rooms,
		bookings: calendar.bookings,
		blocks: calendar.blocks,
		equipmentCatalog,
		recentRequests: ownRequests.slice(0, 5),
	};
};

export const actions: Actions = {
	createBooking: async ({ request, locals }) => {
		assertPermission(locals.user, "requests:create");

		const formData = await request.formData();
		const raw = {
			title: typeof formData.get("title") === "string" ? formData.get("title") : "",
			details: typeof formData.get("details") === "string" ? formData.get("details") : "",
			roomId: typeof formData.get("roomId") === "string" ? formData.get("roomId") : "",
			bookingDate: typeof formData.get("bookingDate") === "string" ? formData.get("bookingDate") : "",
			startTime: typeof formData.get("startTime") === "string" ? formData.get("startTime") : "",
			endTime: typeof formData.get("endTime") === "string" ? formData.get("endTime") : "",
			attendeeCount: typeof formData.get("attendeeCount") === "string" ? formData.get("attendeeCount") : "",
			purpose: typeof formData.get("purpose") === "string" ? formData.get("purpose") : "",
			contactName: typeof formData.get("contactName") === "string" ? formData.get("contactName") : "",
			contactEmail:
				typeof formData.get("contactEmail") === "string" ? formData.get("contactEmail") : "",
			contactPhone:
				typeof formData.get("contactPhone") === "string" ? formData.get("contactPhone") : "",
			equipmentAssetIds: formData
				.getAll("equipmentAssetIds")
				.filter((value): value is string => typeof value === "string" && value.length > 0),
			setupBufferMinutes:
				typeof formData.get("setupBufferMinutes") === "string"
					? formData.get("setupBufferMinutes")
					: "",
			cleanupBufferMinutes:
				typeof formData.get("cleanupBufferMinutes") === "string"
					? formData.get("cleanupBufferMinutes")
					: "",
		};

		const parsed = roomBookingSubmissionSchema.safeParse(raw);
		if (!parsed.success) {
			const flat = parsed.error.flatten();
			return fail(400, {
				action: "createBooking",
				message: requestActionMessage(
					locals.locale,
					"Please fix the highlighted room booking fields.",
					"กรุณาแก้ไขข้อมูลการจองห้องในช่องที่มีการแจ้งเตือน",
				),
				fieldErrors: flat.fieldErrors,
				values: raw,
			});
		}

		const admin = getServiceRoleClient();
		let requestId: string;

		try {
			requestId = await submitRoomBookingRequest(admin, locals.user, {
				title: parsed.data.title,
				details: parsed.data.details || null,
				roomId: parsed.data.roomId,
				startAt: toFacultyDateTimeIso(parsed.data.bookingDate, parsed.data.startTime),
				endAt: toFacultyDateTimeIso(parsed.data.bookingDate, parsed.data.endTime),
				setupBufferMinutes: parsed.data.setupBufferMinutes,
				cleanupBufferMinutes: parsed.data.cleanupBufferMinutes,
				attendeeCount: parsed.data.attendeeCount,
				purpose: parsed.data.purpose,
				contactName: parsed.data.contactName || null,
				contactEmail: parsed.data.contactEmail || null,
				contactPhone: parsed.data.contactPhone || null,
				equipmentAssetIds: parsed.data.equipmentAssetIds,
			});
		} catch (error) {
			return fail(400, {
				action: "createBooking",
				message: roomBookingActionErrorMessage(locals.locale, error),
				values: raw,
			});
		}

		redirect(303, `/requests/${requestId}`);
	},
};

