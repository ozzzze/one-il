import type { RoleCode } from "$lib/server/one-leave/auth/types.js";

export interface AuditContext {
	userId: number;
	roleCode: RoleCode | string;
	ipAddress: string | null;
}

export interface AuditLogInput {
	entityType: string;
	entityId: number;
	action: string;
	before: unknown;
	after: unknown;
	summary?: string;
}
