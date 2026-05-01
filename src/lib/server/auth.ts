import { db } from "./db/index.js";
import { users } from "./db/schema.js";
import { eq } from "drizzle-orm";
import type { User } from "./db/schema.js";

export { generateId } from "./id.js";

export type SessionUser = Pick<User, "id" | "email" | "username" | "name" | "role" | "avatarUrl">;

export async function loadSessionUser(userId: string): Promise<SessionUser | null> {
	const row = await db.query.users.findFirst({
		where: eq(users.id, userId),
		columns: {
			id: true,
			email: true,
			username: true,
			name: true,
			role: true,
			avatarUrl: true,
		},
	});
	return row ?? null;
}
