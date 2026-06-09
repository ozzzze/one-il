import type { SessionUser } from "$lib/server/auth.js";
import type { AuthUser, RoleCode } from "$lib/server/one-leave/auth/types.js";
import { error } from "@sveltejs/kit";

export function getAuthUser(user: SessionUser | null): AuthUser {
	if (!user) {
		error(401, "กรุณาเข้าสู่ระบบ");
	}
	if (user.leaveUserId === null) {
		error(400, "หน้าจอนี้สำหรับผู้ใช้ที่เชื่อมโยงกับระบบ one-leave เท่านั้น");
	}
	return {
		id: user.leaveUserId,
		username: user.username,
		roles: [...user.leaveRoles] as RoleCode[],
		displayName: user.name,
		employeeId: user.employee ? Number(user.employee.id) : null,
		employeeCode: user.employee ? user.employee.employeeNo : null,
		mustChangePassword: false,
	};
}
