import { fail, redirect } from "@sveltejs/kit";
import { hasPermission } from "$lib/auth/roles.js";
import type { Locale } from "$lib/i18n/locales.js";
import { roomBookingSubmissionSchema } from "$lib/requests/room-booking-schema.js";
import { toFacultyDateTimeIso } from "$lib/requests/faculty-request.js";
import { assertPermission } from "$lib/server/guards.js";
import {
	getCalendarRange,
	loadRoomCalendarData,
	loadReservableAssetCatalog,
	loadUserRequestList,
	requestActionMessage,
	submitRoomBookingRequest,
} from "$lib/server/faculty-requests.js";
import { getServiceRoleClient } from "$lib/server/supabase-admin.js";
import type { Actions, PageServerLoad } from "./$types.js";

function createBookingErrorMessage(locale: Locale, error: unknown): string {
	if (!(error instanceof Error)) {
		return requestActionMessage(
			locale,
			"Room booking could not be submitted.",
			"ไม่สามารถส่งคำขอจองห้องได้",
		);
	}

	const message = error.message;

	if (message === "Attendee count exceeds room capacity") {
		return requestActionMessage(
			locale,
			"Attendee count exceeds the room capacity.",
			"จำนวนผู้เข้าร่วมเกินความจุของห้อง",
		);
	}

	if (message === "Room booking does not satisfy minimum advance notice") {
		return requestActionMessage(
			locale,
			"This booking does not meet the room's minimum advance notice.",
			"ช่วงเวลานี้ไม่เป็นไปตามกฎแจ้งล่วงหน้าขั้นต่ำของห้อง",
		);
	}

	if (message === "Room booking exceeds booking window") {
		return requestActionMessage(
			locale,
			"This booking falls outside the room booking window.",
			"ช่วงเวลานี้อยู่นอกช่วงวันที่ห้องเปิดให้จอง",
		);
	}

	if (message === "Room is blocked during the requested period") {
		return requestActionMessage(
			locale,
			"The room is blocked during the requested period.",
			"ห้องถูกปิดใช้งานในช่วงเวลาที่เลือก",
		);
	}

	if (message === "Room is already reserved for the requested period") {
		return requestActionMessage(
			locale,
			"The room is already reserved during the requested period.",
			"ห้องถูกจองแล้วในช่วงเวลาที่เลือก",
		);
	}

	if (message === "One or more equipment items are not requestable") {
		return requestActionMessage(
			locale,
			"One or more selected equipment items cannot be requested.",
			"มีอุปกรณ์อย่างน้อยหนึ่งรายการที่ไม่สามารถแนบคำขอได้",
		);
	}

	if (message.startsWith("Reservable room ") && message.endsWith(" not found")) {
		return requestActionMessage(
			locale,
			"This room could not be found anymore.",
			"ไม่พบข้อมูลห้องนี้แล้ว",
		);
	}

	if (message.startsWith("Room ") && message.endsWith(" is inactive")) {
		return requestActionMessage(
			locale,
			"This room is no longer active for booking.",
			"ห้องนี้ไม่พร้อมให้จองแล้ว",
		);
	}

	if (message.startsWith("Room ") && message.includes(" is not configured with an approver")) {
		return requestActionMessage(
			locale,
			"This room is not fully configured for booking approval.",
			"ห้องนี้ยังตั้งค่าผู้อนุมัติไม่ครบ จึงยังไม่พร้อมให้จอง",
		);
	}

	return requestActionMessage(
		locale,
		"Room booking could not be submitted.",
		"ไม่สามารถส่งคำขอจองห้องได้",
	);
}

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
				message: createBookingErrorMessage(locals.locale, error),
				values: raw,
			});
		}

		redirect(303, `/requests/${requestId}`);
	},
};

