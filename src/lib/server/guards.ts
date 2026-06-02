import { error } from "@sveltejs/kit";
import type { SessionUser } from "$lib/server/auth.js";
import type { PermissionKey } from "$lib/auth/roles.js";
import { getPermissions } from "$lib/auth/roles.js";
import { permissionsForLeaveRoles } from "$lib/server/one-leave/role-bridge.js";

/**
 * Permissions a user actually holds. For one-leave sessions the full
 * `leaveRoles[]` set is authoritative (a user can hold several roles), not the
 * single collapsed gateway `role`. Supabase sessions fall back to the mapped role.
 */
export function effectivePermissions(user: SessionUser | null): PermissionKey[] {
	if (!user) return [];
	if (user.authSource === "one-leave") return permissionsForLeaveRoles(user.leaveRoles);
	return getPermissions(user.role);
}

export function userHasPermission(user: SessionUser | null, permission: PermissionKey): boolean {
	return effectivePermissions(user).includes(permission);
}

export function assertPermission(user: SessionUser | null, permission: PermissionKey): asserts user is SessionUser {
	if (!user || !userHasPermission(user, permission)) {
		error(403, "You do not have access to this resource");
	}
}

export function isUserAdmin(user: SessionUser | null): boolean {
	if (!user) return false;
	return user.role === "admin" || user.leaveRoles.includes("admin");
}

export function assertAdminRole(user: SessionUser | null): asserts user is SessionUser {
	if (!isUserAdmin(user)) {
		error(403, "You do not have access to this resource");
	}
}
