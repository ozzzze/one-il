import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { env } from "$env/dynamic/public";
import type { Database } from "$lib/database.types.js";

function browserSupabaseConfig(): { url: string; key: string } | null {
	const url = env.PUBLIC_SUPABASE_URL?.trim() ?? "";
	const key =
		(env.PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? env.PUBLIC_SUPABASE_ANON_KEY)?.trim() ?? "";
	if (!url || !key) return null;
	return { url, key };
}

/**
 * Browser Supabase client (optional — gateway auth uses one-leave session).
 */
export const supabase: SupabaseClient<Database> | null = (() => {
	const config = browserSupabaseConfig();
	if (!config) return null;
	return createBrowserClient<Database>(config.url, config.key);
})();
