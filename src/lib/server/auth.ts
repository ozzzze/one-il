import { getServiceRoleClient } from "./supabase-admin.js";

export { generateId } from "./id.js";

export type SessionUser = {
	id: string;
	email: string;
	username: string;
	name: string;
	role: "admin" | "editor" | "viewer";
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
		role: data.role,
		avatarUrl: data.avatar_url,
	} satisfies SessionUser;
}
