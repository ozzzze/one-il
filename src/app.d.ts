// See https://svelte.dev/docs/kit/types#app.d.ts
import type { Session as SupabaseSession } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { SessionUser } from "$lib/server/auth.js";

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			supabase: SupabaseClient;
			session: SupabaseSession | null;
			user: SessionUser | null;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
