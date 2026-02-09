import { lucia } from "$lib/server/auth.js";
import { db } from "$lib/server/db/index.js";
import { users } from "$lib/server/db/schema.js";
import { fail, redirect } from "@sveltejs/kit";
import { verify } from "@node-rs/argon2";
import { eq } from "drizzle-orm";
import type { Actions, PageServerLoad } from "./$types.js";

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) redirect(302, "/");
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const formData = await request.formData();
		const username = formData.get("username");
		const password = formData.get("password");

		if (typeof username !== "string" || username.length < 3 || username.length > 31) {
			return fail(400, { message: "Invalid username (3-31 characters required)" });
		}
		if (typeof password !== "string" || password.length < 6 || password.length > 255) {
			return fail(400, { message: "Invalid password (6-255 characters required)" });
		}

		const existingUser = await db.query.users.findFirst({
			where: eq(users.username, username.toLowerCase()),
		});

		if (!existingUser) {
			return fail(400, { message: "Incorrect username or password" });
		}

		const validPassword = await verify(existingUser.passwordHash, password, {
			memoryCost: 19456,
			timeCost: 2,
			outputLen: 32,
			parallelism: 1,
		});

		if (!validPassword) {
			return fail(400, { message: "Incorrect username or password" });
		}

		const session = await lucia.createSession(existingUser.id, {});
		const sessionCookie = lucia.createSessionCookie(session.id);
		cookies.set(sessionCookie.name, sessionCookie.value, {
			path: ".",
			...sessionCookie.attributes,
		});

		redirect(302, "/");
	},
};
