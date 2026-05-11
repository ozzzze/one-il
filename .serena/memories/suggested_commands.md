# ONE-IL — suggested commands (Windows)

Run from repo root `D:\one-il` using **pnpm** (packageManager in package.json).

## Dev & build
- `pnpm dev` — Vite dev server (SvelteKit)
- `pnpm build` — production build
- `pnpm preview` — preview production build

## Typecheck
- `pnpm check` — svelte-check + sync
- `pnpm check:watch` — watch mode

## Test
- `pnpm test` — Vitest (run once)
- `pnpm test:watch` — Vitest watch
- `pnpm test:e2e` — Playwright

## Quality
- `pnpm lint` — ESLint
- `pnpm format` — Prettier write
- `pnpm format:check` — Prettier check only

## Windows shell equivalents
- List dir: `Get-ChildItem` or `dir`
- Change dir: `cd`
- Search in files: use IDE search or `Select-String -Path ... -Pattern ...`
- Git: `git status`, `git diff`, etc. (same as Unix)

## Node
- Requires Node **>=22** per package.json engines.
