# When a coding task is finished (ONE-IL)

Before considering work done, run the checks that match the change:

1. **Types:** `pnpm check`
2. **Lint:** `pnpm lint`
3. **Format (if many edits):** `pnpm format` or at least `pnpm format:check`
4. **Tests (if logic changed):** `pnpm test`; for UI flows, `pnpm test:e2e` when relevant

Fix any reported issues before handing off. Do not commit `.env` — use `.env.example` as the template reference.
