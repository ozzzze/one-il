import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { PUBLIC_SUPABASE_URL } from "$env/static/public";
import { env } from "$env/dynamic/private";
import type { Database } from "$lib/database.types.js";

/** Supabase client typed against the project schema (service-role or SSR). */
export type AppSupabaseClient = SupabaseClient<Database, "one_il">;

export function isServiceRoleConfigured(): boolean {
	return Boolean(env.SUPABASE_SERVICE_ROLE_KEY?.trim() && PUBLIC_SUPABASE_URL?.trim());
}

/** Client สำหรับ Auth Admin API — ใช้เฉพาะใน server routes/actions */
export function getServiceRoleClient() {
	const key = env.SUPABASE_SERVICE_ROLE_KEY;
	if (!key) {
		throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing from environment");
	}
	return createClient<Database, "one_il">(PUBLIC_SUPABASE_URL, key, {
		auth: {
			autoRefreshToken: false,
			persistSession: false,
		},
		db: {
			schema: "one_il",
		},
	});
}
