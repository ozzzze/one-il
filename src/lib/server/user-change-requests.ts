import { getLeavePgPool } from "$lib/server/one-leave/pg.js";

export type ChangeRequestRow = {
	id: string;
	user_id: number;
	field: string;
	current_value: string | null;
	requested_value: string;
	reason: string | null;
	status: string;
	review_note: string | null;
	created_at: Date;
	reviewed_at: Date | null;
};

export async function listMyChangeRequests(userId: number): Promise<ChangeRequestRow[]> {
	const pool = getLeavePgPool();
	const { rows } = await pool.query<ChangeRequestRow>(
		`
		SELECT id, user_id, field, current_value, requested_value, reason, status, review_note, created_at, reviewed_at
		FROM public.user_change_requests
		WHERE user_id = $1
		ORDER BY created_at DESC
		`,
		[userId]
	);
	return rows;
}

export async function listPendingChangeRequests(): Promise<ChangeRequestRow[]> {
	const pool = getLeavePgPool();
	const { rows } = await pool.query<ChangeRequestRow>(
		`
		SELECT id, user_id, field, current_value, requested_value, reason, status, review_note, created_at, reviewed_at
		FROM public.user_change_requests
		WHERE status = 'pending'
		ORDER BY created_at ASC
		`
	);
	return rows;
}

export async function getLeaveUserLabels(
	userIds: number[]
): Promise<Map<number, { name: string; email: string }>> {
	if (userIds.length === 0) return new Map();
	const pool = getLeavePgPool();
	const { rows } = await pool.query<{
		id: number;
		username: string;
		first_name_th: string | null;
		last_name_th: string | null;
	}>(
		`
		SELECT u.id, u.username, e.first_name_th, e.last_name_th
		FROM one_leave.users u
		LEFT JOIN one_leave.employees e ON e.id = u.employee_id
		WHERE u.id = ANY($1::bigint[])
		`,
		[userIds]
	);
	const map = new Map<number, { name: string; email: string }>();
	for (const row of rows) {
		const name =
			row.first_name_th && row.last_name_th
				? `${row.first_name_th} ${row.last_name_th}`
				: row.username;
		map.set(Number(row.id), { name, email: row.username });
	}
	return map;
}
