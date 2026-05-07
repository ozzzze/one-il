import { getServiceRoleClient } from "./supabase-admin.js";
import type { Role } from "$lib/auth/roles.js";
import { parseRole } from "$lib/auth/roles.js";

export { generateId } from "./id.js";

export type SessionUser = {
	id: string;
	email: string;
	username: string;
	name: string;
	role: Role;
	avatarUrl: string | null;
};

export async function loadSessionUser(userId: string): Promise<SessionUser | null> {
	const admin = getServiceRoleClient();
	const { data, error } = await admin
		.from("users")
		.select("id,email,username,name,role,avatar_url")
		.eq("id", userId)
		.maybeSingle();

	if (error || !data) return null;

	return {
		id: data.id,
		email: data.email,
		username: data.username,
		name: data.name,
		role: parseRole(data.role),
		avatarUrl: data.avatar_url,
	} satisfies SessionUser;
}
