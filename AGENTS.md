# AGENTS.md

## Cursor Cloud specific instructions

### Services overview

| Service | Command | Port | Notes |
|---------|---------|------|-------|
| Supabase (local stack) | `supabase start` | 54321 (API), 54322 (Postgres), 54323 (Studio) | Requires Docker; auto-applies migrations from `supabase/migrations/` |
| SvelteKit dev server | `pnpm dev` | 5173 | Connects to local Supabase via `.env` |

### Starting services

1. **Docker must be running first** — `sudo dockerd &>/tmp/dockerd.log &` (wait ~5s for socket).  
   Then `sudo chmod 666 /var/run/docker.sock` for non-root access.
2. **Supabase local stack** — `supabase start` from workspace root. First run pulls images (~2 min); subsequent starts are faster (~30s). Credentials are printed on success.
3. **Dev server** — `pnpm dev` (or `pnpm dev --host` to expose on all interfaces).

### Environment variables

Copy `.env.example` to `.env` and fill in credentials from `supabase status`:

```
PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable key from supabase status>
SUPABASE_SERVICE_ROLE_KEY=<secret key from supabase status>
ORIGIN=http://localhost:5173
```

### Key gotchas

- The `supabase/migrations/20250508000000_bootstrap_base_schema.sql` creates base tables (users, employees, org_units, positions, etc.) that later migrations reference. Without it, `supabase start` will fail on the first incremental migration.
- The file `supabase/migrations/20260518140000_notifications_outbox.sql` was originally UTF-16LE encoded, which PostgreSQL cannot parse. It has been converted to UTF-8.
- Some unit tests (7 suites) fail due to a missing `$lib/server/db/test-utils.js` module — this is a known pre-existing gap in the repo. The 6 passing test suites (26 tests) work fine.
- ESLint reports 3 errors and ~126 warnings (all pre-existing, mostly unused-variable warnings).
- OAuth (Google/GitHub) is fully optional — the login page adapts when credentials are absent.
- First registered user via `/register` automatically gets the `admin` role.

### Standard commands

See `CLAUDE.md` or `package.json` scripts for the full list. Key ones: `pnpm lint`, `pnpm test`, `pnpm build`, `pnpm check`.
