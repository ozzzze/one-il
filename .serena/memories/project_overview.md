# ONE-IL — project overview

**Purpose:** SvelteKit **admin dashboard** (ONE-IL) with auth and data-backed UI.

**Stack:** Svelte 5 (runes), SvelteKit 2, TypeScript (strict), Tailwind CSS v4, shadcn-svelte (bits-ui), Supabase (`@supabase/supabase-js`, `@supabase/ssr`), optional Arctic OAuth (Google/GitHub), Zod, Vitest, Playwright, LayerChart (D3).

**Auth & routes:** Route groups — `(app)/` protected (guard in `hooks.server.ts`), `(auth)/` login/register/OAuth, `(public)/` e.g. pricing, `logout/` server action. Session via Supabase cookies; `locals` in `src/app.d.ts`.

**Key paths:** `src/lib/server/` server-only; `src/lib/components/ui/` generated shadcn (prefer re-add over heavy edits); `scratch/supabase_schema.sql` reference schema.

**Package manager:** pnpm (see `package.json` `packageManager`).
