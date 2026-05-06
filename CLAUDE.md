# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SvelteForge Admin is a SvelteKit admin dashboard using Svelte 5, Tailwind CSS v4, Supabase (Postgres + Auth via `@supabase/ssr`), and optional Arctic OAuth (Google, GitHub).

## Commands

```bash
pnpm dev              # Start dev server
pnpm build            # Production build
pnpm preview          # Preview production build
pnpm check            # Type-check with svelte-check
pnpm check:watch      # Type-check in watch mode

pnpm test             # Run all unit tests (Vitest)
pnpm test:watch       # Run tests in watch mode
pnpm test:e2e         # Run E2E tests (Playwright)

pnpm lint             # ESLint
pnpm format           # Prettier (write)
pnpm format:check     # Prettier (check only)
```

## Architecture

### Tech Stack

- **Svelte 5** with runes API (`$props`, `$state`, `$derived`, `{@render}`)
- **Tailwind CSS v4** — native CSS with `@theme` directive in `src/app.css`, no JS config file. OKLCH color system
- **shadcn-svelte** — UI components in `$lib/components/ui/`, added via `npx shadcn-svelte@latest add <component>`
- **Supabase** — `@supabase/supabase-js` + `@supabase/ssr` for database and session handling; server helpers in `src/lib/server/supabase-admin.ts`
- **OAuth** — Arctic (Google, GitHub), optional via env vars
- **LayerChart v2** — D3-based charts. Marked `noExternal` in `vite.config.ts` alongside `svelte-ux` for SSR compatibility
- **Package manager:** pnpm

### Routing & Auth

Routes use SvelteKit route groups for layout separation:

- `(app)/` — Protected routes. Auth guard in `hooks.server.ts` redirects unauthenticated users to `/login`
- `(auth)/` — Public auth routes (login, register, OAuth callbacks under `/auth/` where configured)
- `(public)/` — Public pages (pricing)
- `logout/` — Standalone logout action (server-only)
- `api/search/` — Search endpoint for command palette
- `sitemap.xml/` — Auto-generated sitemap

Session handling uses Supabase Auth cookies via `createServerClient` in `hooks.server.ts`. `event.locals.supabase`, `event.locals.user` (app profile from `public.users`), and `event.locals.session` are populated per request. See `.env.example` for `PUBLIC_SUPABASE_*` and `SUPABASE_SERVICE_ROLE_KEY`.

### Key Directories

- `src/lib/server/` — Server-only code (auth, OAuth, Supabase admin client). Never import from client-side code
- `src/lib/server/auth.ts` — Loads app user profile from Supabase after Auth user is resolved
- `src/lib/server/oauth.ts` — Arctic OAuth providers (conditional on env vars)
- `src/lib/server/supabase-admin.ts` — Service-role Supabase client for privileged server operations
- `src/lib/server/id.ts` — Crypto ID generator (`generateId()`)
- `src/lib/components/ui/` — shadcn-svelte components (don't edit directly, re-add to update)
- `src/lib/components/` — App-level components (sidebar, theme toggle, command palette, notification bell)
- `src/lib/hooks/` — Svelte 5 reactive utilities (e.g., `is-mobile.svelte.ts`)
- `src/lib/utils.ts` — `cn()` helper (clsx + tailwind-merge) and component type utilities
- `src/lib/utils/` — Export utilities (CSV/JSON), user-agent parser

### Database

Schema targets **Supabase Postgres** (`public.users`, `sessions`, `pages`, etc.). Reference SQL for bootstrapping tables: `scratch/supabase_schema.sql`. Use the Supabase Dashboard or CLI for migrations and RLS policies.

### Patterns

- Forms use SvelteKit form actions with `use:enhance` for progressive enhancement
- Dark/light mode via `mode-watcher` — use `mode.current` (runes object), NOT `$mode`
- App shell layout: sidebar (`app-sidebar.svelte`) + topbar with breadcrumbs (generated from URL pathname)
- `App.Locals` typed in `src/app.d.ts` — includes Supabase client and session/user types as defined there
