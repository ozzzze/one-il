import type { Role, PermissionKey } from "$lib/auth/roles.js";
import { permissionKeys } from "$lib/auth/roles.js";
import type { LeaveRoleCode } from "$lib/server/one-leave/types.js";

/** Map one-leave roles to gateway menu RBAC (single primary role). */
export function primaryGatewayRole(roles: readonly LeaveRoleCode[]): Role {
	if (roles.includes("admin")) return "admin";
	if (roles.includes("hr_verifier")) return "editor";
	return "user";
}

const leaveRolePermissions: Record<LeaveRoleCode, readonly PermissionKey[]> = {
	admin: permissionKeys,
	hr_verifier: [
		"dashboard:view",
		"gateway:access",
		"leave:view",
		"leave:manage",
		"profile:manage",
		"users:manage",
		"roles:manage",
		"notifications:view",
	],
	grantor_director: ["dashboard:view", "gateway:access", "leave:view", "profile:manage", "notifications:view"],
	grantor_deputy: ["dashboard:view", "gateway:access", "leave:view", "profile:manage", "notifications:view"],
	grantor_head_l1: ["dashboard:view", "gateway:access", "leave:view", "profile:manage", "notifications:view"],
	employee: ["dashboard:view", "gateway:access", "leave:view", "profile:manage", "notifications:view"],
};

export function permissionsForLeaveRoles(roles: readonly LeaveRoleCode[]): PermissionKey[] {
	const set = new Set<PermissionKey>();
	for (const role of roles) {
		for (const key of leaveRolePermissions[role]) {
			set.add(key);
		}
	}
	return [...set];
}

export function hasLeavePermission(roles: readonly LeaveRoleCode[], permission: PermissionKey): boolean {
	return permissionsForLeaveRoles(roles).includes(permission);
}
