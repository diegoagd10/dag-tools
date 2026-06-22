# Coding Standards

These rules apply to every commit on every branch. The reviewer (`.sandcastle/review-prompt.md`) enforces them.

## Style

- **TypeScript only.** `tsconfig.json` is authoritative: `strict: true`, `target: ES2017`, `module: esnext`, `moduleResolution: bundler`.
- **ESLint config is authoritative** (`eslint.config.mjs`, extends `eslint-config-next` 16.2.9). No project-local overrides without a brief justification in the diff.
- **Imports**: the `@/*` alias (defined in `tsconfig.json paths`) resolves to `./src/*`. Use it for cross-module imports inside `src/`.
- **Named exports** for components and modules. No default exports for components. (`page.tsx` / `layout.tsx` Next.js convention files are the documented exception.)
- **No `any`** in committed code. Use `unknown` + narrowing, or a precise type. An `eslint-disable-next-line @typescript-eslint/no-explicit-any` requires a one-line justification comment.
- **Prefer `type` over `interface`** for object shapes. Use `interface` only when declaration merging or `extends` is genuinely needed.
- **Line length** follows the ESLint config (do not hand-tune; rely on `pnpm run lint`).

## Testing

- **vitest** for unit tests, run with `pnpm run test`. Tests live under `tests/unit/`.
- **playwright** for e2e tests, run with `pnpm run test:e2e`. Tests live under `tests/e2e/`.
- **Every public function has a test.** Test names describe behaviour, not implementation: `combine_sorts_pages_by_user_order`, not `test_combine_1`.
- **Prefer real fixtures over mocks.** `tests/fixtures/` ships reusable PDFs and blobs; mock only external boundaries (network, subprocess, browser APIs the e2e suite already covers).

## Architecture

- **Next.js App Router** under `src/app/`. Routes are folders; special files are `page.tsx`, `layout.tsx`, `route.ts`, `loading.tsx`, `error.tsx`.
- **API routes** under `src/app/api/`. Use route handlers (`route.ts`), not the Pages-Router `pages/api/` style.
- **Domain vocabulary** in `CONTEXT.md` is authoritative. Use `_Tool_`, `_File Tool_`, `_Link Tool_`, `_Source PDF_`, `_Artifact_`, `_Share Link_`, `_Share ID_`, `_Combined PDF_`, `_Split PDF_`, `_Merge Order_`, `_Server-Side Processing_`, etc. in code, comments, and user-facing strings. Avoid the synonyms listed in the glossary's "Avoid" column.
- **No new top-level directories** without a brief justification in the diff. The layout (`src/{app,components,lib}` + `tests/{unit,e2e,fixtures}`) is the established skeleton.

## Commits

- **Conventional Commits only**: `<type>(<scope>): <subject>`. Allowed types: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`, `style`, `perf`.
- Subject ≤ 72 chars, imperative mood ("add", not "added"), no trailing period.
- Body references the issue: `Closes #<NUMBER>` on the last line when an issue is resolved.
- **NEVER use the `RALPH:` prefix** — it is BANNED in this repo.
- **One logical change per commit.** Do not mix refactors with feature changes.

## What the reviewer will check

- `pnpm run typecheck` — must pass.
- `pnpm run lint` — must pass.
- `pnpm run test` — must be green.
- `pnpm run test:e2e` — must run when the diff touches `tests/e2e/`, `playwright.config.ts`, or anything that affects the dev server.
- Conventional-commits format on every new commit.
- No commented-out code, no `TODO` comments in committed code.
- No `RALPH:` prefix anywhere in the commit history of the branch.