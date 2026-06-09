import { fail } from "@sveltejs/kit";
import { z } from "zod";
import { hasPermission } from "$lib/auth/roles.js";
import { hasLeavePermission } from "$lib/server/one-leave/role-bridge.js";
import { getLeavePgPool } from "$lib/server/one-leave/pg.js";
import {
	getLeaveUserLabels,
	listMyChangeRequests,
	listPendingChangeRequests,
} from "$lib/server/user-change-requests.js";
import type { Actions, PageServerLoad } from "./$types.js";

const requestableFields = ["name", "email", "username", "role", "other"] as const;
type RequestableField = (typeof requestableFields)[number];

const submitSchema = z.object({
	field: z.enum(requestableFields),
	requested_value: z.string().trim().min(1).max(500),
	reason: z
		.string()
		.trim()
		.max(1000)
		.transform((value) => (value.length === 0 ? null : value)),
});

const reviewSchema = z.object({
	id: z.string().uuid(),
	decision: z.enum(["approved", "rejected"]),
	review_note: z
		.string()
		.trim()
		.max(1000)
		.transform((value) => (value.length === 0 ? null : value)),
});

function currentValueFor(
	field: RequestableField,
	current: { name: string; email: string; username: string; role: string }
): string | null {
	switch (field) {
		case "name":
			return current.name;
		case "email":
			return current.email;
		case "username":
			return current.username;
		case "role":
			return current.role;
		default:
			return null;
	}
}

function canReviewUser(user: App.Locals["user"]): boolean {
	if (!user) return false;
	if (user.authSource === "one-leave") {
		return hasLeavePermission(user.leaveRoles, "users:manage");
	}
	return hasPermission(user.role, "users:manage");
}

function requireLeaveUserId(user: NonNullable<App.Locals["user"]>): number {
	if (user.leaveUserId === null) {
		throw new Error("Account change requests require one-leave login");
	}
	return user.leaveUserId;
}

export const load: PageServerLoad = async ({ locals }) => {
	const user = locals.user!;
	const leaveUserId = requireLeaveUserId(user);
	const canReview = canReviewUser(user);

	const myRows = await listMyChangeRequests(leaveUserId);
	const myRequests = myRows.map((row) => ({
		id: row.id,
		field: row.field,
		current_value: row.current_value,
		requested_value: row.requested_value,
		reason: row.reason,
		status: row.status,
		review_note: row.review_note,
		created_at: row.created_at.toISOString(),
		reviewed_at: row.reviewed_at?.toISOString() ?? null,
	}));

	let pendingReviews: {
		id: string;
		field: string;
		current_value: string | null;
		requested_value: string;
		reason: string | null;
		created_at: string;
		requesterName: string;
		requesterEmail: string;
	}[] = [];

	if (canReview) {
		const pending = await listPendingChangeRequests();
		const userIds = [...new Set(pending.map((row) => row.user_id))];
		const nameByUser = await getLeaveUserLabels(userIds);
		pendingReviews = pending.map((row) => ({
			id: row.id,
			field: row.field,
			current_value: row.current_value,
			requested_value: row.requested_value,
			reason: row.reason,
			created_at: row.created_at.toISOString(),
			requesterName: nameByUser.get(row.user_id)?.name ?? "—",
			requesterEmail: nameByUser.get(row.user_id)?.email ?? "",
		}));
	}

	return {
		myRequests,
		pendingReviews,
		canReview,
		currentValues: {
			name: user.name,
			email: user.email,
			username: user.username,
			role: user.role,
		},
		locale: locals.locale,
	};
};

export const actions: Actions = {
	submit: async ({ request, locals }) => {
		const user = locals.user!;
		const leaveUserId = requireLeaveUserId(user);
		const invalid = locals.locale === "th" ? "ข้อมูลไม่ถูกต้อง" : "Invalid data";
		const fd = await request.formData();
		const parsed = submitSchema.safeParse({
			field: fd.get("field"),
			requested_value: fd.get("requested_value"),
			reason: fd.get("reason") ?? "",
		});
		if (!parsed.success) {
			return fail(400, { message: invalid });
		}

		const pool = getLeavePgPool();
		try {
			await pool.query(
				`
				INSERT INTO public.user_change_requests (user_id, field, current_value, requested_value, reason)
				VALUES ($1, $2, $3, $4, $5)
				`,
				[
					leaveUserId,
					parsed.data.field,
					currentValueFor(parsed.data.field, {
						name: user.name,
						email: user.email,
						username: user.username,
						role: user.role,
					}),
					parsed.data.requested_value,
					parsed.data.reason,
				]
			);
		} catch (err) {
			const message = err instanceof Error ? err.message : invalid;
			return fail(400, { message });
		}
		return { success: true, action: "submit" as const };
	},

	withdraw: async ({ request, locals }) => {
		const user = locals.user!;
		const leaveUserId = requireLeaveUserId(user);
		const invalid = locals.locale === "th" ? "ข้อมูลไม่ถูกต้อง" : "Invalid data";
		const fd = await request.formData();
		const id = fd.get("id");
		if (typeof id !== "string" || id.length === 0) {
			return fail(400, { message: invalid });
		}
		const pool = getLeavePgPool();
		const { rowCount } = await pool.query(
			`DELETE FROM public.user_change_requests WHERE id = $1::uuid AND user_id = $2 AND status = 'pending'`,
			[id, leaveUserId]
		);
		if ((rowCount ?? 0) === 0) {
			return fail(400, { message: invalid });
		}
		return { success: true, action: "withdraw" as const };
	},

	review: async ({ request, locals }) => {
		const user = locals.user!;
		const leaveUserId = requireLeaveUserId(user);
		const forbidden = locals.locale === "th" ? "ต้องใช้สิทธิ์ผู้ดูแล" : "Reviewer access required";
		if (!canReviewUser(user)) {
			return fail(403, { message: forbidden });
		}
		const invalid = locals.locale === "th" ? "ข้อมูลไม่ถูกต้อง" : "Invalid data";
		const fd = await request.formData();
		const parsed = reviewSchema.safeParse({
			id: fd.get("id"),
			decision: fd.get("decision"),
			review_note: fd.get("review_note") ?? "",
		});
		if (!parsed.success) {
			return fail(400, { message: invalid });
		}

		const pool = getLeavePgPool();
		const now = new Date();
		const { rowCount } = await pool.query(
			`
			UPDATE public.user_change_requests
			SET status = $2, review_note = $3, reviewed_by = $4, reviewed_at = $5, updated_at = $5
			WHERE id = $1::uuid AND status = 'pending'
			`,
			[parsed.data.id, parsed.data.decision, parsed.data.review_note, leaveUserId, now]
		);
		if ((rowCount ?? 0) === 0) {
			return fail(400, { message: invalid });
		}
		return { success: true, action: "review" as const };
	},
};
