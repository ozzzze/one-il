import { env } from "$env/dynamic/private";
import type { LeaveAuthUser } from "$lib/server/one-leave/types.js";

const DEV_MOCK_USERS: LeaveAuthUser[] = [
	{
		id: 9000,
		username: "admin",
		roles: ["admin", "hr_verifier"],
		displayName: "Gateway Admin (dev mock)",
		employeeId: null,
		employeeCode: null,
		mustChangePassword: false,
	},
	{
		id: 9001,
		username: "nopparat.jap@mahidol.ac.th",
		roles: ["admin", "employee", "hr_verifier"],
		displayName: "Nopparat Jap (dev mock)",
		employeeId: null,
		employeeCode: null,
		mustChangePassword: false,
	},
];

function mockPassword(): string {
	return env.AUTH_MOCK_PASSWORD?.trim() || "Demo@2569";
}

export function isLeaveAuthMockEnabled(): boolean {
	return (env.AUTH_MOCK ?? "").toLowerCase() === "true";
}

export function authenticateLeaveMockUser(
	username: string,
	password: string,
): LeaveAuthUser | null {
	const norm = username.trim().toLowerCase();
	const user = DEV_MOCK_USERS.find((u) => u.username.toLowerCase() === norm);
	if (!user) return null;
	if (password !== mockPassword()) return null;
	return user;
}

export function isMockLeaveUserId(userId: number): boolean {
	return isLeaveAuthMockEnabled() && DEV_MOCK_USERS.some((u) => u.id === userId);
}

export function getMockLeaveUserById(userId: number): LeaveAuthUser | null {
	if (!isLeaveAuthMockEnabled()) return null;
	return DEV_MOCK_USERS.find((u) => u.id === userId) ?? null;
}

export function getMockPasswordChangedAt(_userId: number): number {
	return 0;
}
