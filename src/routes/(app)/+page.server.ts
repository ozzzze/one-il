import { fail } from "@sveltejs/kit";
import { z } from "zod";
import {
	deleteAllShortcuts,
	deleteShortcut,
	insertShortcut,
	userCanSeeMenuItem,
} from "$lib/server/menu-shortcuts-actions.js";
import type { Actions } from "./$types.js";

export const actions = {
	addMenuShortcut: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { message: "Unauthorized" });
		const fd = await request.formData();
		const parsed = z.object({ menuItemId: z.string().min(1) }).safeParse({ menuItemId: fd.get("menuItemId") });
		if (!parsed.success) return fail(400, { message: "Invalid request" });
		const allowed = await userCanSeeMenuItem(locals.user, parsed.data.menuItemId);
		if (!allowed) return fail(400, { message: "Invalid menu item" });
		const res = await insertShortcut(locals.user.id, parsed.data.menuItemId);
		if (!res.ok && res.reason === "limit") return fail(400, { message: "Shortcut limit reached" });
		if (!res.ok && res.reason === "duplicate") return fail(400, { message: "Already pinned" });
		return { ok: true as const };
	},
	removeMenuShortcut: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { message: "Unauthorized" });
		const fd = await request.formData();
		const parsed = z.object({ menuItemId: z.string().min(1) }).safeParse({ menuItemId: fd.get("menuItemId") });
		if (!parsed.success) return fail(400, { message: "Invalid request" });
		const allowed = await userCanSeeMenuItem(locals.user, parsed.data.menuItemId);
		if (!allowed) return fail(400, { message: "Invalid menu item" });
		await deleteShortcut(locals.user.id, parsed.data.menuItemId);
		return { ok: true as const };
	},
	clearMenuShortcuts: async ({ locals }) => {
		if (!locals.user) return fail(401, { message: "Unauthorized" });
		await deleteAllShortcuts(locals.user.id);
		return { ok: true as const };
	},
} satisfies Actions;
