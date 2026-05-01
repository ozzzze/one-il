import { db } from "$lib/server/db/index.js";
import { users } from "$lib/server/db/schema.js";
import { getServiceRoleClient } from "$lib/server/supabase-admin.js";
import { fail } from "@sveltejs/kit";
import { eq, sql, inArray } from "drizzle-orm";
import type { Actions, PageServerLoad } from "./$types.js";

export const load: PageServerLoad = async ({ locals }) => {
	const allUsers = await db
		.select({
			id: users.id,
			name: users.name,
			email: users.email,
			username: users.username,
			role: users.role,
			createdAt: users.createdAt,
		})
		.from(users)
		.orderBy(users.createdAt);

	return { users: allUsers, currentUserId: locals.user!.id };
};

export const actions: Actions = {
	create: async ({ request }) => {
		let admin;
		try {
			admin = getServiceRoleClient();
		} catch {
			return fail(500, { message: "Server missing SUPABASE_SERVICE_ROLE_KEY" });
		}

		const formData = await request.formData();
		const name = formData.get("name");
		const email = formData.get("email");
		const username = formData.get("username");
		const password = formData.get("password");
		const role = formData.get("role");

		if (typeof name !== "string" || name.length < 1 || name.length > 100) {
			return fail(400, { message: "Name is required (1-100 characters)" });
		}
		if (typeof email !== "string" || !email.includes("@") || email.length > 255) {
			return fail(400, { message: "Valid email is required" });
		}
		if (
			typeof username !== "string" ||
			username.length < 3 ||
			username.length > 31 ||
			!/^[a-z0-9_-]+$/.test(username)
		) {
			return fail(400, {
				message: "Username must be 3-31 characters, lowercase letters, numbers, hyphens, underscores",
			});
		}
		if (typeof password !== "string" || password.length < 6 || password.length > 255) {
			return fail(400, { message: "Password must be 6-255 characters" });
		}
		if (typeof role !== "string" || !["admin", "editor", "viewer"].includes(role)) {
			return fail(400, { message: "Invalid role" });
		}

		const lowerEmail = email.toLowerCase();
		const lowerUser = username.toLowerCase();

		const usernameTaken = await db.query.users.findFirst({
			where: eq(users.username, lowerUser),
		});
		if (usernameTaken) {
			return fail(400, { message: "Username or email already taken" });
		}
		const emailTaken = await db.query.users.findFirst({
			where: eq(users.email, lowerEmail),
		});
		if (emailTaken) {
			return fail(400, { message: "Username or email already taken" });
		}

		const { data: created, error } = await admin.auth.admin.createUser({
			email: lowerEmail,
			password,
			email_confirm: true,
			user_metadata: {
				username: lowerUser,
				full_name: name,
				role,
			},
		});

		if (error || !created.user) {
			return fail(400, { message: error?.message ?? "Could not create auth user" });
		}

		const uid = created.user.id;

		try {
			await db
				.insert(users)
				.values({
					id: uid,
					email: lowerEmail,
					username: lowerUser,
					passwordHash: null,
					name,
					role: role as "admin" | "editor" | "viewer",
				})
				.onConflictDoNothing();
		} catch {
			return fail(400, { message: "Username or email already taken in profile table" });
		}

		return { success: true };
	},

	update: async ({ request }) => {
		let admin;
		try {
			admin = getServiceRoleClient();
		} catch {
			return fail(500, { message: "Server missing SUPABASE_SERVICE_ROLE_KEY" });
		}

		const formData = await request.formData();
		const id = formData.get("id");
		const name = formData.get("name");
		const email = formData.get("email");
		const role = formData.get("role");

		if (typeof id !== "string") {
			return fail(400, { message: "User ID is required" });
		}
		if (typeof name !== "string" || name.length < 1 || name.length > 100) {
			return fail(400, { message: "Name is required (1-100 characters)" });
		}
		if (typeof email !== "string" || !email.includes("@") || email.length > 255) {
			return fail(400, { message: "Valid email is required" });
		}
		if (typeof role !== "string" || !["admin", "editor", "viewer"].includes(role)) {
			return fail(400, { message: "Invalid role" });
		}

		const [existing] = await db.select({ role: users.role, email: users.email }).from(users).where(eq(users.id, id));
		if (existing?.role === "admin" && role !== "admin") {
			const [adminCount] = await db
				.select({ count: sql<number>`count(*)::int` })
				.from(users)
				.where(eq(users.role, "admin"));
			if (Number(adminCount.count) <= 1) {
				return fail(400, { message: "Cannot demote the last admin" });
			}
		}

		const lower = email.toLowerCase();
		if (existing && existing.email !== lower) {
			const { error: authErr } = await admin.auth.admin.updateUserById(id, { email: lower });
			if (authErr) {
				return fail(400, { message: authErr.message });
			}
		}

		const { error: metaErr } = await admin.auth.admin.updateUserById(id, {
			user_metadata: { full_name: name },
		});
		if (metaErr) {
			return fail(400, { message: metaErr.message });
		}

		try {
			await db
				.update(users)
				.set({
					name,
					email: lower,
					role: role as "admin" | "editor" | "viewer",
					updatedAt: new Date(),
				})
				.where(eq(users.id, id));
		} catch {
			return fail(400, { message: "Email already taken" });
		}

		return { success: true };
	},

	delete: async ({ request, locals }) => {
		let admin;
		try {
			admin = getServiceRoleClient();
		} catch {
			return fail(500, { message: "Server missing SUPABASE_SERVICE_ROLE_KEY" });
		}

		const formData = await request.formData();
		const id = formData.get("id");

		if (typeof id !== "string") {
			return fail(400, { message: "User ID is required" });
		}

		if (id === locals.user!.id) {
			return fail(400, { message: "You cannot delete your own account" });
		}

		const [target] = await db.select({ role: users.role }).from(users).where(eq(users.id, id));
		if (target?.role === "admin") {
			const [adminCount] = await db
				.select({ count: sql<number>`count(*)::int` })
				.from(users)
				.where(eq(users.role, "admin"));
			if (Number(adminCount.count) <= 1) {
				return fail(400, { message: "Cannot delete the last admin" });
			}
		}

		const { error } = await admin.auth.admin.deleteUser(id);
		if (error) {
			return fail(400, { message: error.message });
		}

		await db.delete(users).where(eq(users.id, id));

		return { success: true };
	},

	bulkDelete: async ({ request, locals }) => {
		let admin;
		try {
			admin = getServiceRoleClient();
		} catch {
			return fail(500, { message: "Server missing SUPABASE_SERVICE_ROLE_KEY" });
		}

		const formData = await request.formData();
		const idsRaw = formData.get("ids");

		if (typeof idsRaw !== "string" || !idsRaw.trim()) {
			return fail(400, { message: "No users selected" });
		}

		const ids = idsRaw.split(",").filter(Boolean);
		const currentUserId = locals.user!.id;

		const toDelete = ids.filter((id) => id !== currentUserId);
		if (toDelete.length === 0) {
			return fail(400, { message: "You cannot delete your own account" });
		}

		const admins = await db
			.select({ id: users.id })
			.from(users)
			.where(eq(users.role, "admin"));
		const remainingAdmins = admins.filter((a) => !toDelete.includes(a.id));
		if (remainingAdmins.length === 0) {
			return fail(400, { message: "Cannot delete all admin users" });
		}

		for (const id of toDelete) {
			const { error } = await admin.auth.admin.deleteUser(id);
			if (error) {
				return fail(400, { message: error.message });
			}
			await db.delete(users).where(eq(users.id, id));
		}

		return { success: true };
	},
};
