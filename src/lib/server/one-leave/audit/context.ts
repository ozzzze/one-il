import type { RequestEvent } from "@sveltejs/kit";
import type { AuthUser, RoleCode } from "$lib/server/one-leave/auth/types.js";
import type { AuditContext } from "$lib/server/one-leave/audit/types.js";

const ROLE_PRIORITY: RoleCode[] = [
	"admin",
	"hr_verifier",
	"grantor_director",
	"grantor_deputy",
	"grantor_head_l1",
	"employee",
];

export function pickPrimaryRole(roles: readonly string[]): string {
	for (const role of ROLE_PRIORITY) {
		if (roles.includes(role)) return role;
	}
	return roles[0] ?? "employee";
}

export function auditContextFromUser(user: AuthUser, ipAddress: string | null): AuditContext {
	return {
		userId: user.id,
		roleCode: pickPrimaryRole(user.roles),
		ipAddress,
	};
}

export function getRequestIp(
	event: Pick<RequestEvent, "getClientAddress" | "request">
): string | null {
	try {
		return event.getClientAddress();
	} catch {
		return event.request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
	}
}
