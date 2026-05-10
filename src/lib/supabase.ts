import { createBrowserClient } from "@supabase/ssr";
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY } from "$env/static/public";
import type { Database } from "$lib/database.types.js";

/**
 * Shared Supabase client for client-side operations.
 * Use this in .svelte files if you need to access Supabase from the browser.
 */
export const supabase = createBrowserClient<Database>(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY);
