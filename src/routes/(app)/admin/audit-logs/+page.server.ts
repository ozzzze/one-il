import { assertAuditLogAccess } from "$lib/server/one-leave/audit/access.js";
import {
	AUDIT_ENTITY_TYPES,
	getAuditLogById,
	listAuditLogs,
	parseAuditFilter,
} from "$lib/server/one-leave/audit/query.js";
import type { PageServerLoad } from "./$types.js";

export const load: PageServerLoad = async ({ locals, url }) => {
	assertAuditLogAccess(locals.user);

	const filter = parseAuditFilter(url.searchParams);
	const page = Math.max(1, Number.parseInt(url.searchParams.get("page") ?? "1", 10));
	const auditPage = await listAuditLogs(filter, page);

	const detailId = url.searchParams.get("detail");
	const detail = detailId ? await getAuditLogById(Number.parseInt(detailId, 10)) : null;

	return {
		locale: locals.locale,
		pageTitle: locals.locale === "th" ? "ประวัติการทำรายการ" : "Audit logs",
		filter,
		auditPage,
		detail,
		entityTypes: AUDIT_ENTITY_TYPES,
	};
};
