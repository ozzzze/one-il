import type { SessionUser } from "$lib/server/auth.js";
import { userHasPermission } from "$lib/server/guards.js";
import type { AdminActor } from "$lib/server/one-leave/admin/types.js";

export function toAdminActor(user: SessionUser): AdminActor {
	return {
		leaveUserId: user.leaveUserId,
		username: user.username,
		canGrantAdmin: userHasPermission(user, "roles:grant_admin"),
	};
}
