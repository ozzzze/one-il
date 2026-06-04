// See https://svelte.dev/docs/kit/types#app.d.ts
import type { Session as SupabaseSession } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "$lib/database.types.js";
import type { SessionUser } from "$lib/server/auth.js";
import type { Locale } from "$lib/i18n/locales.js";

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			supabase: SupabaseClient<Database> | null;
			session: SupabaseSession | null;
			user: SessionUser | null;
			locale: Locale;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}

	interface ViewTransition {
		updateCallbackDone: Promise<void>;
		ready: Promise<void>;
		finished: Promise<void>;
		skipTransition: () => void;
	}

	interface Document {
		startViewTransition(updateCallback: () => Promise<void>): ViewTransition;
	}
}

export {};
