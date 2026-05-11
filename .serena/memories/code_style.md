# ONE-IL — conventions

- **Svelte 5:** `$props`, `$state`, `$derived`, snippets `{#snippet}` / `{@render}` — avoid Svelte 4 `export let`, `$:`, stores for local UI state.
- **TypeScript:** strict; avoid `any`; prefer `async/await` over promise chains for app logic.
- **Data:** prefer **server** loads and form actions (`+page.server.ts`, `+layout.server.ts`); do not fetch Supabase from `.svelte` client except realtime if needed.
- **Validation:** Zod for forms/API payloads where used.
- **Styling:** Tailwind utility classes; theme in `src/app.css` (`@theme`). Use `cn()` from `$lib/utils.ts` where components merge classes.
- **UI:** follow existing shadcn-svelte patterns under `$lib/components/ui/`.
- **Supabase:** respect RLS; secrets from env only (see `.env.example`).
- **Mode:** `mode-watcher` — use runes API per project docs (`mode.current`), not legacy `$mode`.

See repository `CLAUDE.md` for expanded architecture notes.
