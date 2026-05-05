import { getServiceRoleClient } from "$lib/server/supabase-admin.js";
import { fail } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types.js";

export const load: PageServerLoad = async ({ locals }) => {
	const admin = getServiceRoleClient();
	const { data: allUsers, error } = await admin
		.from("users")
		.select("id,name,email,username,role,created_at")
		.order("created_at", { ascending: true });
	if (error) {
		return { users: [], currentUserId: locals.user!.id };
	}

	return {
		users:
			allUsers?.map((user) => ({
				id: user.id,
				name: user.name,
				email: user.email,
				username: user.username,
				role: user.role,
				createdAt: user.created_at,
			})) ?? [],
		currentUserId: locals.user!.id,
	};
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

		const { data: duplicate, error: duplicateError } = await admin
			.from("users")
			.select("id")
			.or(`username.eq.${lowerUser},email.eq.${lowerEmail}`)
			.limit(1);
		if (duplicateError) {
			return fail(500, { message: "Cannot validate user uniqueness right now" });
		}
		if ((duplicate?.length ?? 0) > 0) {
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

		const { error: profileError } = await admin.from("users").insert({
			id: uid,
			email: lowerEmail,
			username: lowerUser,
			password_hash: null,
			name,
			role: role as "admin" | "editor" | "viewer",
		});
		if (profileError) {
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

		const { data: existing, error: existingError } = await admin
			.from("users")
			.select("role,email")
			.eq("id", id)
			.maybeSingle();
		if (existingError) {
			return fail(500, { message: "Cannot load target user" });
		}
		if (existing?.role === "admin" && role !== "admin") {
			const { count: adminCount, error: adminCountError } = await admin
				.from("users")
				.select("id", { count: "exact", head: true })
				.eq("role", "admin");
			if (adminCountError) {
				return fail(500, { message: "Cannot validate admin count" });
			}
			if (Number(adminCount ?? 0) <= 1) {
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

		const { error: updateProfileError } = await admin
			.from("users")
			.update({
				name,
				email: lower,
				role: role as "admin" | "editor" | "viewer",
				updated_at: new Date().toISOString(),
			})
			.eq("id", id);
		if (updateProfileError) {
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

		const { data: target, error: targetError } = await admin
			.from("users")
			.select("role")
			.eq("id", id)
			.maybeSingle();
		if (targetError) {
			return fail(500, { message: "Cannot load target user" });
		}
		if (target?.role === "admin") {
			const { count: adminCount, error: adminCountError } = await admin
				.from("users")
				.select("id", { count: "exact", head: true })
				.eq("role", "admin");
			if (adminCountError) {
				return fail(500, { message: "Cannot validate admin count" });
			}
			if (Number(adminCount ?? 0) <= 1) {
				return fail(400, { message: "Cannot delete the last admin" });
			}
		}

		const { error } = await admin.auth.admin.deleteUser(id);
		if (error) {
			return fail(400, { message: error.message });
		}

		await admin.from("users").delete().eq("id", id);

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

		const { data: admins, error: adminsError } = await admin
			.from("users")
			.select("id")
			.eq("role", "admin");
		if (adminsError) {
			return fail(500, { message: "Cannot validate admin users" });
		}
		const remainingAdmins = (admins ?? []).filter((a) => !toDelete.includes(a.id));
		if (remainingAdmins.length === 0) {
			return fail(400, { message: "Cannot delete all admin users" });
		}

		for (const id of toDelete) {
			const { error } = await admin.auth.admin.deleteUser(id);
			if (error) {
				return fail(400, { message: error.message });
			}
			await admin.from("users").delete().eq("id", id);
		}

		return { success: true };
	},
};
