import { json, error } from "@sveltejs/kit";
import { getServiceRoleClient } from "$lib/server/supabase-admin.js";
import { hasPermission } from "$lib/auth/roles.js";
import type { RequestHandler } from "./$types.js";

export const GET: RequestHandler = async ({ url, locals }) => {
	if (!locals.user) {
		error(401, "Unauthorized");
	}

	const q = url.searchParams.get("q")?.trim() ?? "";
	if (q.length < 2) {
		return json([]);
	}

	const admin = getServiceRoleClient();
	const canSearchUsers = hasPermission(locals.user.role, "users:manage");
	const canSearchPages = hasPermission(locals.user.role, "content:view");
	const [userResultsRes, pageResultsRes, notificationResultsRes] = await Promise.all([
		canSearchUsers
			? admin.from("users").select("id,name,email").or(`name.ilike.%${q}%,email.ilike.%${q}%`).limit(5)
			: Promise.resolve({ data: [] }),
		canSearchPages
			? admin.from("pages").select("id,title,slug").ilike("title", `%${q}%`).limit(5)
			: Promise.resolve({ data: [] }),
		admin
			.from("notifications")
			.select("id,title,message")
			.ilike("title", `%${q}%`)
			.or(`user_id.eq.${locals.user.id},user_id.is.null`)
			.limit(5),
	]);
	const userResults = userResultsRes.data ?? [];
	const pageResults = pageResultsRes.data ?? [];
	const notificationResults = notificationResultsRes.data ?? [];

	const results = [
		...userResults.map((u) => ({
			type: "user" as const,
			id: u.id,
			title: u.name,
			subtitle: u.email,
			href: "/users",
		})),
		...pageResults.map((p) => ({
			type: "page" as const,
			id: p.id,
			title: p.title,
			subtitle: `/${p.slug}`,
			href: `/content/${p.id}/edit`,
		})),
		...notificationResults.map((n) => ({
			type: "notification" as const,
			id: n.id,
			title: n.title,
			subtitle: n.message.slice(0, 50),
			href: "/notifications",
		})),
	];

	return json(results);
};
