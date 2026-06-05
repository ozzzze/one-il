import { getAuthUser } from '$lib/server/one-leave/auth/bridge.js';
import { canViewAllScr } from '$lib/server/one-leave/change-request/access.js';
import { parseChangeRequestFilter } from '$lib/server/one-leave/change-request/filters.js';
import { SCR_STATUS_LABELS, CHANGE_CATEGORY_LABELS } from '$lib/server/one-leave/change-request/labels.js';
import { exportChangeRequestsCsv } from '$lib/server/one-leave/change-request/registry-export.js';
import {
	countByStatus,
	listChangeRequests,
	listChangeRequestsForExport,
	listExceptionTypes,
	listItSystems
} from '$lib/server/one-leave/change-request/repository.js';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const user = getAuthUser(locals.user);
	const filter = parseChangeRequestFilter(url.searchParams);

	if (url.searchParams.get('export') === 'csv') {
		if (!canViewAllScr(user)) {
			error(403, 'เฉพาะ admin/HR ส่งออก CSV ได้');
		}
		const rows = await listChangeRequestsForExport(user, filter);
		const csv = exportChangeRequestsCsv(rows);
		const filename = `scr-export-${new Date().toISOString().slice(0, 10)}.csv`;
		return new Response(csv, {
			headers: {
				'Content-Type': 'text/csv; charset=utf-8',
				'Content-Disposition': `attachment; filename="${filename}"`
			}
		});
	}

	const pageTitle = 'คำขอเปลี่ยนแปลงระบบ';

	let requests;
	try {
		requests = await listChangeRequests(user, filter);
		requests = requests.slice(0, 50);
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : 'โหลดรายการคำขอไม่สำเร็จ';
		throw new Error(message, { cause: err });
	}

	const [queueCounts, itSystems, exceptionTypes] = await Promise.all([
		countByStatus(user),
		listItSystems(),
		listExceptionTypes()
	]);

	const viewAll = canViewAllScr(user);
	const canExport = viewAll;

	return {
		pageTitle,
		requests,
		filter,
		viewAll,
		canExport,
		queueCounts,
		itSystems,
		exceptionTypes,
		statusOptions: Object.entries(SCR_STATUS_LABELS).map(([value, label]) => ({
			value,
			label
		})),
		categoryOptions: Object.entries(CHANGE_CATEGORY_LABELS).map(([value, label]) => ({
			value,
			label
		}))
	};
};
