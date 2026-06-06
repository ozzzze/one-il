# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

> **All instructions are in [`AGENTS.md`](./AGENTS.md)** — read that file first. It is the single source of truth for this repo's architecture, commands, patterns, and auth model.

## Quick-start commands

```bash
pnpm dev              # Start dev server (http://localhost:5173)
pnpm build
pnpm check            # svelte-check
pnpm test             # Vitest unit tests
pnpm test:e2e         # Playwright E2E
pnpm lint
pnpm format
```

## Key files (Claude-specific pointers)

- `docs/README.md` — reading order for all product docs
- `docs/GATEWAY-ARCHITECTURE.md` — auth model, SSO cookie, proxy setup
- `docs/GATEWAY-NEXT-STEPS.md` — latest session handoff + next steps
- `docs/BLUEPRINT.md` — module scaffold recipe (read before creating any module)
- `AI-RULES.md` — code standards (Svelte 5 runes, TypeScript strict, Zod, server-first)
