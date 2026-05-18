import { fail } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types.js";
import { assertPermission } from "$lib/server/guards.js";
import { cancelFacultyRequestSchema } from "$lib/requests/room-booking-schema.js";
import {
	cancelRequest,
	loadUserRequestList,
	requestActionMessage,
} from "$lib/server/faculty-requests.js";
import { getServiceRoleClient } from "$lib/server/supabase-admin.js";

export type RoomBookingRequestListItem = {
	id: string;
	title: string;
	status: string;
	updatedAt: string;
	requestNo: string;
	requestedAt: string;
	startAt: string | null;
	endAt: string | null;
	roomName: string | null;
	roomNameEn: string | null;
	roomCode: string | null;
	canCancel: boolean;
};

export const load: PageServerLoad = async ({ locals }) => {
	assertPermission(locals.user, "requests:view_own");
	const admin = getServiceRoleClient();
	const all = await loadUserRequestList(admin, locals.user.id);
	const items = all
		.filter((row) => row.kind === "room_booking")
		.map((row) => ({
			id: row.id,
			title: row.title,
			status: row.status,
			updatedAt: row.updatedAt,
			requestNo: row.requestNo,
			requestedAt: row.requestedAt,
			startAt: row.startAt,
			endAt: row.endAt,
			roomName: row.roomName,
			roomNameEn: row.roomNameEn,
			roomCode: row.roomCode,
			canCancel: row.canCancel,
		})) satisfies RoomBookingRequestListItem[];

	return {
		items,
		locale: locals.locale,
	};
};

export const actions: Actions = {
	cancelRequest: async ({ request, locals }) => {
		assertPermission(locals.user, "requests:cancel_own");
		const formData = await request.formData();
		const parsed = cancelFacultyRequestSchema.safeParse({
			requestId: typeof formData.get("requestId") === "string" ? formData.get("requestId") : "",
			cancelReason:
				typeof formData.get("cancelReason") === "string" ? formData.get("cancelReason") : "",
		});

		if (!parsed.success) {
			return fail(400, {
				action: "cancelRequest",
				message: requestActionMessage(
					locals.locale,
					"Cancellation data is invalid.",
					"ข้อมูลการยกเลิกไม่ถูกต้อง",
				),
			});
		}

		const admin = getServiceRoleClient();
		try {
			await cancelRequest(admin, locals.user, parsed.data.requestId, parsed.data.cancelReason || null);
			return { success: true, action: "cancelRequest" };
		} catch (error) {
			return fail(400, {
				action: "cancelRequest",
				message:
					error instanceof Error
						? error.message
						: requestActionMessage(
								locals.locale,
								"Reservation could not be cancelled.",
								"ไม่สามารถยกเลิกการจองได้",
							),
			});
		}
	},
};
