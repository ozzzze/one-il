import type { Locale } from "$lib/i18n/locales.js";
import { env } from "$env/dynamic/private";
import type { AppSupabaseClient } from "$lib/server/supply-asset.js";
import { enqueueNotification } from "$lib/server/notifications/outbox.js";
import { processPendingOutbox } from "$lib/server/notifications/process-outbox.js";
import { buildRoomBookingSubmittedEmail } from "$lib/server/notifications/room-booking-email.js";

type MaybeOne<T> = T | T[] | null | undefined;

function asOne<T>(value: MaybeOne<T>): T | null {
	if (value == null) return null;
	return Array.isArray(value) ? (value[0] ?? null) : value;
}

function employeeDisplayName(employee: {
	first_name: string;
	last_name: string;
} | null): string {
	if (!employee) return "—";
	return `${employee.first_name} ${employee.last_name}`.trim();
}

function appOrigin(): string {
	const origin = env.ORIGIN?.trim() || "http://localhost:5173";
	return origin.replace(/\/$/, "");
}

/**
 * Notify the room approver (in-app + email outbox) after a booking request is submitted.
 * Does not throw — booking submission must not fail when notification fails.
 */
export async function notifyRoomBookingSubmitted(
	admin: AppSupabaseClient,
	input: { requestId: string; locale?: Locale },
): Promise<void> {
	const locale = input.locale ?? "th";

	try {
		const { data: requestRow, error } = await admin
			.from("faculty_requests")
			.select(
				`request_no, title,
        requester:employees ( first_name, last_name ),
        room_booking_requests (
          requested_start_at, requested_end_at, attendee_count, purpose,
          room:reservable_rooms (
            id, room_code, name,
            approver:employees ( id, first_name, last_name, email, user_id )
          )
        )`,
			)
			.eq("id", input.requestId)
			.maybeSingle();

		if (error) {
			console.error("[notifyRoomBookingSubmitted] load context failed", error);
			return;
		}
		if (!requestRow) {
			console.error("[notifyRoomBookingSubmitted] request not found", input.requestId);
			return;
		}

		type LoadedRequest = {
			request_no: string;
			title: string;
			requester?: MaybeOne<{ first_name: string; last_name: string }>;
			room_booking_requests?: MaybeOne<{
				requested_start_at: string;
				requested_end_at: string;
				attendee_count: number;
				purpose: string;
				room?: MaybeOne<{
					id: string;
					room_code: string;
					name: string;
					approver?: MaybeOne<{
						id: string;
						first_name: string;
						last_name: string;
						email: string | null;
						user_id: string | null;
					}>;
				}>;
			}>;
		};

		const request = requestRow as unknown as LoadedRequest;
		const booking = asOne(request.room_booking_requests);
		const room = asOne(booking?.room ?? null);
		const approver = asOne(room?.approver ?? null);

		if (!booking || !room) return;

		const requestUrl = `${appOrigin()}/requests/${input.requestId}`;
		const requesterName = employeeDisplayName(asOne(request.requester ?? null));
		const emailContent = buildRoomBookingSubmittedEmail(locale, {
			requestNo: request.request_no,
			title: request.title,
			roomName: room.name,
			roomCode: room.room_code,
			requesterName,
			startAt: booking.requested_start_at,
			endAt: booking.requested_end_at,
			purpose: booking.purpose,
			attendeeCount: booking.attendee_count,
			requestUrl,
		});

		if (approver?.user_id) {
			const inAppTitle =
				locale === "th"
					? `คำขอจองห้อง ${request.request_no}`
					: `Room booking ${request.request_no}`;
			const inAppMessage =
				locale === "th"
					? `${requesterName} ขอจอง ${room.name} — รอการอนุมัติ`
					: `${requesterName} requested ${room.name} — pending your approval`;

			const { error: inAppError } = await admin.from("notifications").insert({
				id: crypto.randomUUID(),
				user_id: approver.user_id,
				title: inAppTitle,
				message: inAppMessage,
				type: "info",
				read: false,
			});

			if (inAppError) {
				console.error("[notifyRoomBookingSubmitted] in-app notification failed", inAppError);
			}
		}

		const recipient = approver?.email?.trim();
		if (!recipient) {
			console.warn(
				"[notifyRoomBookingSubmitted] approver has no email; skipped outbox",
				approver?.id,
			);
			return;
		}

		await enqueueNotification(admin, {
			domain: "room_booking",
			correlationId: input.requestId,
			recipient,
			subject: emailContent.subject,
			body: emailContent.body,
			payload: {
				requestId: input.requestId,
				roomId: room.id,
				approverEmployeeId: approver?.id,
			},
		});

		await processPendingOutbox(admin, { limit: 5 });
	} catch (err) {
		console.error("[notifyRoomBookingSubmitted] unexpected error", err);
	}
}
