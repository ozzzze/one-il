import { error, fail } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types.js";
import { hasPermission } from "$lib/auth/roles.js";
import { cancelFacultyRequestSchema, roomDecisionSchema } from "$lib/requests/room-booking-schema.js";
import {
	cancelRequest,
	decideRequest,
	loadRequestDetail,
	requestActionMessage,
} from "$lib/server/faculty-requests.js";
import { getServiceRoleClient } from "$lib/server/supabase-admin.js";

export const load: PageServerLoad = async ({ locals, params }) => {
	if (
		!locals.user ||
		(!hasPermission(locals.user.role, "requests:view_own") &&
			!hasPermission(locals.user.role, "requests:manage"))
	) {
		error(403, "You do not have access to this resource");
	}

	const admin = getServiceRoleClient();
	const requestDetail = await loadRequestDetail(admin, params.id, locals.user);
	if (!requestDetail) {
		error(404, "Request not found");
	}

	return {
		locale: locals.locale,
		requestDetail,
		canManage: hasPermission(locals.user.role, "requests:manage"),
		canCancelOwn: hasPermission(locals.user.role, "requests:cancel_own"),
	};
};

export const actions: Actions = {
	cancelRequest: async ({ request, locals }) => {
		if (!locals.user || !hasPermission(locals.user.role, "requests:cancel_own")) {
			error(403, "You do not have access to this resource");
		}

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
		} catch (err) {
			return fail(400, {
				action: "cancelRequest",
				message:
					err instanceof Error
						? err.message
						: requestActionMessage(
								locals.locale,
								"Reservation could not be cancelled.",
								"ไม่สามารถยกเลิกการจองได้",
							),
			});
		}
	},
	decideRequest: async ({ request, locals }) => {
		if (!locals.user || !hasPermission(locals.user.role, "requests:manage")) {
			error(403, "You do not have access to this resource");
		}

		const formData = await request.formData();
		const parsed = roomDecisionSchema.safeParse({
			requestId: typeof formData.get("requestId") === "string" ? formData.get("requestId") : "",
			decision: typeof formData.get("decision") === "string" ? formData.get("decision") : "",
			remark: typeof formData.get("remark") === "string" ? formData.get("remark") : "",
		});

		if (!parsed.success) {
			return fail(400, {
				action: "decideRequest",
				message: requestActionMessage(
					locals.locale,
					"Approval data is invalid.",
					"ข้อมูลการพิจารณาไม่ถูกต้อง",
				),
			});
		}

		const admin = getServiceRoleClient();
		try {
			await decideRequest(admin, locals.user, {
				requestId: parsed.data.requestId,
				decision: parsed.data.decision,
				remark: parsed.data.remark || null,
			});
			return { success: true, action: "decideRequest" };
		} catch (err) {
			return fail(400, {
				action: "decideRequest",
				message:
					err instanceof Error
						? err.message
						: requestActionMessage(
								locals.locale,
								"Request decision could not be saved.",
								"ไม่สามารถบันทึกผลการพิจารณาได้",
							),
			});
		}
	},
};
