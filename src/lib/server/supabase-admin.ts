import { createClient } from "@supabase/supabase-js";
import { PUBLIC_SUPABASE_URL } from "$env/static/public";
import { env } from "$env/dynamic/private";

/** Client สำหรับ Auth Admin API — ใช้เฉพาะใน server routes/actions */
export function getServiceRoleClient() {
	const key = env.SUPABASE_SERVICE_ROLE_KEY;
	if (!key) {
		throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing from environment");
	}
	return createClient(PUBLIC_SUPABASE_URL, key, {
		auth: {
			autoRefreshToken: false,
			persistSession: false,
		},
	});
}
