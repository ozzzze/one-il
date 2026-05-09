import { getServiceRoleClient } from "$lib/server/supabase-admin.js";
import { fail } from "@sveltejs/kit";
import { isRole, parseRole } from "$lib/auth/roles.js";
import { assertPermission } from "$lib/server/guards.js";
import type { Actions, PageServerLoad } from "./$types.js";

export const load: PageServerLoad = async ({ locals }) => {
	assertPermission(locals.user, "users:manage");
	const admin = getServiceRoleClient();
	const { data: allUsers, error } = await admin
		.from("users")
		.select("id,name,email,username,role,created_at")
		.order("created_at", { ascending: true });
	if (error) {
		return { users: [], currentUserId: locals.user!.id, locale: locals.locale };
	}

	return {
		locale: locals.locale,
		users:
			allUsers?.map((user) => ({
				id: user.id,
				name: user.name,
				email: user.email,
				username: user.username,
				role: parseRole(user.role),
				createdAt: user.created_at,
			})) ?? [],
		currentUserId: locals.user!.id,
	};
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		const t =
			locals.locale === "th"
				? {
						noServiceKey: "เซิร์ฟเวอร์ไม่มี SUPABASE_SERVICE_ROLE_KEY",
						nameRequired: "ต้องระบุชื่อ (1-100 ตัวอักษร)",
						emailRequired: "ต้องระบุอีเมลที่ถูกต้อง",
						usernameRule:
							"ชื่อผู้ใช้ต้องยาว 3-31 ตัวอักษร และใช้ได้เฉพาะตัวพิมพ์เล็ก ตัวเลข ขีดกลาง และขีดล่าง",
						passwordRule: "รหัสผ่านต้องมี 6-255 ตัวอักษร",
						invalidRole: "บทบาทไม่ถูกต้อง",
						uniqueCheckFail: "ไม่สามารถตรวจสอบชื่อผู้ใช้/อีเมลซ้ำได้ในขณะนี้",
						alreadyTaken: "ชื่อผู้ใช้หรืออีเมลนี้ถูกใช้งานแล้ว",
						authCreateFail: "ไม่สามารถสร้างผู้ใช้ในระบบยืนยันตัวตนได้",
						profileTaken: "ชื่อผู้ใช้หรืออีเมลนี้ถูกใช้งานแล้วในตารางโปรไฟล์",
					}
				: {
						noServiceKey: "Server missing SUPABASE_SERVICE_ROLE_KEY",
						nameRequired: "Name is required (1-100 characters)",
						emailRequired: "Valid email is required",
						usernameRule:
							"Username must be 3-31 characters, lowercase letters, numbers, hyphens, underscores",
						passwordRule: "Password must be 6-255 characters",
						invalidRole: "Invalid role",
						uniqueCheckFail: "Cannot validate user uniqueness right now",
						alreadyTaken: "Username or email already taken",
						authCreateFail: "Could not create auth user",
						profileTaken: "Username or email already taken in profile table",
					};
		assertPermission(locals.user, "users:manage");
		let admin;
		try {
			admin = getServiceRoleClient();
		} catch {
			return fail(500, { message: t.noServiceKey });
		}

		const formData = await request.formData();
		const name = formData.get("name");
		const email = formData.get("email");
		const username = formData.get("username");
		const password = formData.get("password");
		const role = formData.get("role");

		if (typeof name !== "string" || name.length < 1 || name.length > 100) {
			return fail(400, { message: t.nameRequired });
		}
		if (typeof email !== "string" || !email.includes("@") || email.length > 255) {
			return fail(400, { message: t.emailRequired });
		}
		if (
			typeof username !== "string" ||
			username.length < 3 ||
			username.length > 31 ||
			!/^[a-z0-9_-]+$/.test(username)
		) {
			return fail(400, {
				message: t.usernameRule,
			});
		}
		if (typeof password !== "string" || password.length < 6 || password.length > 255) {
			return fail(400, { message: t.passwordRule });
		}
		if (!isRole(role)) {
			return fail(400, { message: t.invalidRole });
		}

		const lowerEmail = email.toLowerCase();
		const lowerUser = username.toLowerCase();

		const { data: duplicate, error: duplicateError } = await admin
			.from("users")
			.select("id")
			.or(`username.eq.${lowerUser},email.eq.${lowerEmail}`)
			.limit(1);
		if (duplicateError) {
			return fail(500, { message: t.uniqueCheckFail });
		}
		if ((duplicate?.length ?? 0) > 0) {
			return fail(400, { message: t.alreadyTaken });
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
			return fail(400, { message: error?.message ?? t.authCreateFail });
		}

		const uid = created.user.id;

		const { error: profileError } = await admin.from("users").insert({
			id: uid,
			email: lowerEmail,
			username: lowerUser,
			password_hash: null,
			name,
			role,
		});
		if (profileError) {
			return fail(400, { message: t.profileTaken });
		}

		// Matching employee rows are linked and profile role/name synced via DB trigger
		// `users_after_insert_link_employee` → `link_employee_user_by_email`.

		return { success: true };
	},

	update: async ({ request, locals }) => {
		const t =
			locals.locale === "th"
				? {
						noServiceKey: "เซิร์ฟเวอร์ไม่มี SUPABASE_SERVICE_ROLE_KEY",
						userIdRequired: "ต้องระบุรหัสผู้ใช้",
						nameRequired: "ต้องระบุชื่อ (1-100 ตัวอักษร)",
						emailRequired: "ต้องระบุอีเมลที่ถูกต้อง",
						invalidRole: "บทบาทไม่ถูกต้อง",
						loadTargetFail: "ไม่สามารถโหลดข้อมูลผู้ใช้เป้าหมายได้",
						adminCountFail: "ไม่สามารถตรวจสอบจำนวนแอดมินได้",
						lastAdminDemote: "ไม่สามารถลดสิทธิ์แอดมินคนสุดท้ายได้",
						emailTaken: "อีเมลนี้ถูกใช้งานแล้ว",
					}
				: {
						noServiceKey: "Server missing SUPABASE_SERVICE_ROLE_KEY",
						userIdRequired: "User ID is required",
						nameRequired: "Name is required (1-100 characters)",
						emailRequired: "Valid email is required",
						invalidRole: "Invalid role",
						loadTargetFail: "Cannot load target user",
						adminCountFail: "Cannot validate admin count",
						lastAdminDemote: "Cannot demote the last admin",
						emailTaken: "Email already taken",
					};
		assertPermission(locals.user, "users:manage");
		let admin;
		try {
			admin = getServiceRoleClient();
		} catch {
			return fail(500, { message: t.noServiceKey });
		}

		const formData = await request.formData();
		const id = formData.get("id");
		const name = formData.get("name");
		const email = formData.get("email");
		const role = formData.get("role");

		if (typeof id !== "string") {
			return fail(400, { message: t.userIdRequired });
		}
		if (typeof name !== "string" || name.length < 1 || name.length > 100) {
			return fail(400, { message: t.nameRequired });
		}
		if (typeof email !== "string" || !email.includes("@") || email.length > 255) {
			return fail(400, { message: t.emailRequired });
		}
		if (!isRole(role)) {
			return fail(400, { message: t.invalidRole });
		}

		const { data: existing, error: existingError } = await admin
			.from("users")
			.select("role,email")
			.eq("id", id)
			.maybeSingle();
		if (existingError) {
			return fail(500, { message: t.loadTargetFail });
		}
		if (existing?.role === "admin" && role !== "admin") {
			const { count: adminCount, error: adminCountError } = await admin
				.from("users")
				.select("id", { count: "exact", head: true })
				.eq("role", "admin");
			if (adminCountError) {
				return fail(500, { message: t.adminCountFail });
			}
			if (Number(adminCount ?? 0) <= 1) {
				return fail(400, { message: t.lastAdminDemote });
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
				role,
				updated_at: new Date().toISOString(),
			})
			.eq("id", id);
		if (updateProfileError) {
			return fail(400, { message: t.emailTaken });
		}

		return { success: true };
	},

	delete: async ({ request, locals }) => {
		const t =
			locals.locale === "th"
				? {
						noServiceKey: "เซิร์ฟเวอร์ไม่มี SUPABASE_SERVICE_ROLE_KEY",
						userIdRequired: "ต้องระบุรหัสผู้ใช้",
						cannotDeleteSelf: "คุณไม่สามารถลบบัญชีของตัวเองได้",
						loadTargetFail: "ไม่สามารถโหลดข้อมูลผู้ใช้เป้าหมายได้",
						adminCountFail: "ไม่สามารถตรวจสอบจำนวนแอดมินได้",
						lastAdminDelete: "ไม่สามารถลบแอดมินคนสุดท้ายได้",
					}
				: {
						noServiceKey: "Server missing SUPABASE_SERVICE_ROLE_KEY",
						userIdRequired: "User ID is required",
						cannotDeleteSelf: "You cannot delete your own account",
						loadTargetFail: "Cannot load target user",
						adminCountFail: "Cannot validate admin count",
						lastAdminDelete: "Cannot delete the last admin",
					};
		assertPermission(locals.user, "users:manage");
		let admin;
		try {
			admin = getServiceRoleClient();
		} catch {
			return fail(500, { message: t.noServiceKey });
		}

		const formData = await request.formData();
		const id = formData.get("id");

		if (typeof id !== "string") {
			return fail(400, { message: t.userIdRequired });
		}

		if (id === locals.user!.id) {
			return fail(400, { message: t.cannotDeleteSelf });
		}

		const { data: target, error: targetError } = await admin
			.from("users")
			.select("role")
			.eq("id", id)
			.maybeSingle();
		if (targetError) {
			return fail(500, { message: t.loadTargetFail });
		}
		if (target?.role === "admin") {
			const { count: adminCount, error: adminCountError } = await admin
				.from("users")
				.select("id", { count: "exact", head: true })
				.eq("role", "admin");
			if (adminCountError) {
				return fail(500, { message: t.adminCountFail });
			}
			if (Number(adminCount ?? 0) <= 1) {
				return fail(400, { message: t.lastAdminDelete });
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
		const t =
			locals.locale === "th"
				? {
						noServiceKey: "เซิร์ฟเวอร์ไม่มี SUPABASE_SERVICE_ROLE_KEY",
						noneSelected: "ยังไม่ได้เลือกผู้ใช้",
						cannotDeleteSelf: "คุณไม่สามารถลบบัญชีของตัวเองได้",
						adminUsersFail: "ไม่สามารถตรวจสอบผู้ใช้แอดมินได้",
						cannotDeleteAllAdmins: "ไม่สามารถลบผู้ใช้แอดมินทั้งหมดได้",
					}
				: {
						noServiceKey: "Server missing SUPABASE_SERVICE_ROLE_KEY",
						noneSelected: "No users selected",
						cannotDeleteSelf: "You cannot delete your own account",
						adminUsersFail: "Cannot validate admin users",
						cannotDeleteAllAdmins: "Cannot delete all admin users",
					};
		assertPermission(locals.user, "users:manage");
		let admin;
		try {
			admin = getServiceRoleClient();
		} catch {
			return fail(500, { message: t.noServiceKey });
		}

		const formData = await request.formData();
		const idsRaw = formData.get("ids");

		if (typeof idsRaw !== "string" || !idsRaw.trim()) {
			return fail(400, { message: t.noneSelected });
		}

		const ids = idsRaw.split(",").filter(Boolean);
		const currentUserId = locals.user!.id;

		const toDelete = ids.filter((id) => id !== currentUserId);
		if (toDelete.length === 0) {
			return fail(400, { message: t.cannotDeleteSelf });
		}

		const { data: admins, error: adminsError } = await admin
			.from("users")
			.select("id")
			.eq("role", "admin");
		if (adminsError) {
			return fail(500, { message: t.adminUsersFail });
		}
		const remainingAdmins = (admins ?? []).filter((a) => !toDelete.includes(a.id));
		if (remainingAdmins.length === 0) {
			return fail(400, { message: t.cannotDeleteAllAdmins });
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
