import { fail, redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types.js";
import { newFacultyRequestFormSchema, requestKindSchema } from "$lib/requests/request-schema.js";
import { getRequestKindMeta } from "$lib/requests/request-meta.js";
import { roomBookingSubmissionSchema } from "$lib/requests/room-booking-schema.js";
import { toFacultyDateTimeIso } from "$lib/requests/faculty-request.js";
import {
	loadReservableAssetCatalog,
	loadRoomOptions,
	requestActionMessage,
	submitRoomBookingRequest,
} from "$lib/server/faculty-requests.js";
import { getServiceRoleClient } from "$lib/server/supabase-admin.js";
import { assertPermission } from "$lib/server/guards.js";

export const load: PageServerLoad = async ({ url, locals }) => {
	assertPermission(locals.user, "requests:create");
	const rawKind = url.searchParams.get("kind");
	const parsedKind = requestKindSchema.safeParse(rawKind);
	if (!parsedKind.success) {
		redirect(302, "/requests");
	}
	const kind = parsedKind.data;
	const requestKindMeta = getRequestKindMeta(locals.locale);
	const meta = requestKindMeta[kind];
	if (kind !== "room_booking") {
		return { kind, label: meta.label, description: meta.description, locale: locals.locale };
	}

	const admin = getServiceRoleClient();
	const [rooms, equipmentCatalog] = await Promise.all([
		loadRoomOptions(admin, { onlyWithApprover: true }),
		loadReservableAssetCatalog(admin),
	]);

	const requestedRoomId = url.searchParams.get("roomId") ?? "";
	const selectedRoom = rooms.find((room) => room.id === requestedRoomId) ?? rooms[0] ?? null;

	return {
		kind,
		label: meta.label,
		description: meta.description,
		locale: locals.locale,
		rooms,
		equipmentCatalog,
		roomBookingDefaults: {
			roomId: selectedRoom?.id ?? "",
			bookingDate: url.searchParams.get("date") ?? new Date().toISOString().slice(0, 10),
			startTime: url.searchParams.get("startTime") ?? "09:00",
			endTime: url.searchParams.get("endTime") ?? "10:00",
			setupBufferMinutes: selectedRoom?.setupBufferMinutes ?? 15,
			cleanupBufferMinutes: selectedRoom?.cleanupBufferMinutes ?? 15,
			attendeeCount: 1,
		},
	};
};

export const actions = {
	default: async ({ request, locals }) => {
		assertPermission(locals.user, "requests:create");
		const formData = await request.formData();
		const parsedKind = requestKindSchema.safeParse(
			typeof formData.get("kind") === "string" ? formData.get("kind") : "",
		);
		if (!parsedKind.success) {
			return fail(400, {
				message: requestActionMessage(
					locals.locale,
					"Request type is invalid.",
					"ประเภทคำขอไม่ถูกต้อง",
				),
			});
		}
		const kind = parsedKind.data;

		if (kind === "room_booking") {
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

			try {
				const requestId = await submitRoomBookingRequest(admin, locals.user, {
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

				redirect(303, `/requests/${requestId}`);
			} catch (error) {
				return fail(400, {
					message:
						error instanceof Error
							? error.message
							: requestActionMessage(
									locals.locale,
									"Room booking could not be submitted.",
									"ไม่สามารถส่งคำขอจองห้องได้",
								),
					values: raw,
				});
			}
		}

		function field(name: string): string {
			const v = formData.get(name);
			return typeof v === "string" ? v : "";
		}
		const raw = {
			kind,
			title: field("title"),
			details: field("details"),
		};
		const parsed = newFacultyRequestFormSchema.safeParse(raw);
		if (!parsed.success) {
			const flat = parsed.error.flatten();
			return fail(400, {
				message:
					locals.locale === "th"
						? "กรุณาแก้ไขช่องที่มีการแจ้งเตือน"
						: "Please fix the highlighted fields.",
				fieldErrors: flat.fieldErrors,
			});
		}

		return {
			success: true as const,
			preview: true as const,
			summary: parsed.data.title,
		};
	},
} satisfies Actions;
