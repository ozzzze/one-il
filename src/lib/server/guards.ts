import { error } from "@sveltejs/kit";
import type { SessionUser } from "$lib/server/auth.js";
import type { PermissionKey } from "$lib/auth/roles.js";
import { hasPermission } from "$lib/auth/roles.js";

export function assertPermission(user: SessionUser | null, permission: PermissionKey): asserts user is SessionUser {
	if (!user || !hasPermission(user.role, permission)) {
		error(403, "You do not have access to this resource");
	}
}

export function assertAdminRole(user: SessionUser | null): asserts user is SessionUser {
	if (!user || user.role !== "admin") {
		error(403, "You do not have access to this resource");
	}
}
