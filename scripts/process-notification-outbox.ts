/**
 * Process pending rows in public.notifications_outbox (cron / manual retry).
 * Requires DATABASE_URL or Supabase env vars in .env (loaded via dotenv if present).
 */
import { createClient } from "@supabase/supabase-js";
import { processPendingOutbox } from "../src/lib/server/notifications/process-outbox.js";
import type { Database } from "../src/lib/database.types.js";

function requireEnv(name: string): string {
	const value = process.env[name]?.trim();
	if (!value) {
		throw new Error(`${name} is required`);
	}
	return value;
}

const url = requireEnv("PUBLIC_SUPABASE_URL");
const serviceKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

const admin = createClient<Database>(url, serviceKey, {
	auth: { autoRefreshToken: false, persistSession: false },
});

const result = await processPendingOutbox(admin, { limit: 50 });
console.log(JSON.stringify(result, null, 2));
