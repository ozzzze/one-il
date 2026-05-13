import { fail } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types.js";
import { hasPermission } from "$lib/auth/roles.js";
import { assertPermission } from "$lib/server/guards.js";
import { cancelFacultyRequestSchema } from "$lib/requests/room-booking-schema.js";
import {
	cancelRequest,
	loadUserRequestList,
	requestActionMessage,
} from "$lib/server/faculty-requests.js";
import { getServiceRoleClient } from "$lib/server/supabase-admin.js";

export type RequestListItem = {
	id: string;
	kind: string;
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
	const items = (await loadUserRequestList(admin, locals.user.id)) as RequestListItem[];
	return {
		items,
		locale: locals.locale,
		canManage: hasPermission(locals.user.role, "requests:manage"),
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
