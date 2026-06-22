# Context

## Open issues (AFK-ready only)

!`gh issue list --state open --label ready-for-agent --limit 100 --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'`

This is the sole source of truth for what work exists. Per `docs/agents/triage-labels.md`, `ready-for-agent` is the canonical label for issues that are fully specified and ready for an AFK agent. Do not run an unfiltered query. If the list is empty, there is nothing to do.

## Current branch

You are working on branch `{{BRANCH}}` for this iteration. The reviewer will inspect `git diff main...{{BRANCH}}` after you finish, so you MUST commit on this exact branch.

- Stay on `{{BRANCH}}`. Do NOT `git checkout` another branch.
- Do NOT create scratch / sub-branches for the work.
- Do NOT rebase, force-push, or amend commits already on this branch.
- All commits you make will appear in `git log main..{{BRANCH}}`.

## Recent commits on this branch's lineage

!`git log {{BRANCH}} --oneline -10`

## Project context

- **Language / framework**: TypeScript on Next.js 16.2.9 (App Router, React 19.2.4). Source under `src/`. Domain glossary in `CONTEXT.md` — use its terms (`_Tool_`, `_File Tool_`, `_Source PDF_`, `_Artifact_`, `_Share Link_`, `_Share ID_`, `_Combined PDF_`, `_Split PDF_`, etc.) instead of the synonyms listed in the glossary's "Avoid" column.
- **Package manager**: pnpm with `pnpm-workspace.yaml`. ALWAYS use `pnpm install --frozen-lockfile` — never `npm install` (silently produces the wrong dependency tree).
- **Source layout**: `src/app/` (App Router routes), `src/app/api/` (API routes), `src/components/`, `src/lib/`. Tests under `tests/unit/` (vitest) and `tests/e2e/` (playwright). Reusable fixtures under `tests/fixtures/`. The `@/*` import alias resolves to `./src/*` (see `tsconfig.json`).
- **Quality gates** — all must pass before committing:
  - `pnpm run typecheck` — `tsc --noEmit`, `strict: true`.
  - `pnpm run lint` — ESLint (config in `eslint.config.mjs`, extends `eslint-config-next`).
  - `pnpm run test` — vitest unit tests.
- **Issue tracker**: GitHub via the `gh` CLI. Conventions in `docs/agents/issue-tracker.md`. Triage labels in `docs/agents/triage-labels.md`. The five canonical labels are `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`.
- **Skills available**: `~/.agents/skills/` is bind-mounted read-only from the host. The full host skill set is available to the agent — including `tdd`, `diagnosing-bugs`, `domain-modeling`, `codebase-design`, `grilling`, `prototype`, `teach`, etc. Project-local skills live under `.agents/skills/` (currently: `frontend-design`, `vercel-react-best-practices`, `web-design-guidelines`). Do NOT invent skills; use the ones mounted from `~/.agents/skills/`.
- **Branch model**: each outer iteration in `main.mts` generates a fresh `{{BRANCH}}` (timestamp-suffixed) and shares one sandbox across implementer + reviewer. After the reviewer approves, it merges `{{BRANCH}}` into local `main`. The next iteration starts a new branch.

## Priority order

1. **Bug fixes** — broken behaviour affecting users.
2. **Tracer bullets** — thin end-to-end slices that prove an approach works.
3. **Polish** — error messages, UX, docs.
4. **Refactors** — internal cleanups with no user-visible change.

Pick the highest-priority open issue whose labels do NOT mark it blocked by another still-open issue. If the chosen issue references a parent PRD (look at the body), read the PRD first.

## Workflow

1. **Explore** — read the issue body and comments. If it references a parent PRD, read it. Skim the relevant source files and existing tests BEFORE writing any code.
2. **Plan** — state, in one paragraph, what you will change and why. Keep the diff as small as possible.
3. **Execute (RGR)** — Red → Green → Repeat → Refactor. Write a failing test first, then the smallest implementation to pass it. Refactor once green.
4. **Verify code quality** — all must pass:
   - `pnpm run typecheck`
   - `pnpm run lint`
   - `pnpm run test`
5. **Verify e2e (conditional)** — if the diff touches `tests/e2e/`, `playwright.config.ts`, or anything that builds the dev server (e.g. changes to `src/app/` routes or middleware), also run `pnpm run test:e2e`. Fix any failures before proceeding.
6. **Commit** — ONE git commit on the current branch. The message MUST follow conventional-commits:
   - Format: `<type>(<scope>): <subject>` (e.g. `feat(combine): ...`, `refactor(lib): ...`, `fix: ...`).
   - Allowed types: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`, `style`, `perf`.
   - Subject ≤ 72 chars, imperative mood, no trailing period.
   - Body: list the issue number (e.g. `Closes #24`), key decisions, and files changed.
   - NEVER use the `RALPH:` prefix — it is BANNED in this repo.
7. **Close** — close the issue with a single comment summarising what changed:
   `gh issue close <NUMBER> --comment "..."` — the comment should list the commit SHA, the branch, and a 2-3 line summary.

## Skills

Load these via the Skill tool or by reading the SKILL.md directly. They are bind-mounted from `~/.agents/skills/`.

**MANDATORY for code work** (any non-trivial feature, fix, or refactor):

- **tdd** — `~/.agents/skills/tdd/SKILL.md`. Load BEFORE writing the failing test in step 3 (RGR). It defines the red-green-refactor loop and the test-first contract.

**MANDATORY for UI work** (any change to `src/app/`, `src/components/`, or user-facing strings):

- **frontend-design** — `~/.agents/skills/frontend-design/SKILL.md`. Load BEFORE designing UI.
- **vercel-react-best-practices** — `~/.agents/skills/vercel-react-best-practices/SKILL.md`. Load BEFORE writing React/Next.js code.
- **web-design-guidelines** — `~/.agents/skills/web-design-guidelines/SKILL.md`. Load BEFORE finalising any UI surface for accessibility review.

Other skills available from the host mount (`diagnosing-bugs`, `domain-modeling`, `codebase-design`, `grilling`, `prototype`, `teach`, etc.) — load when the situation calls for them. Do NOT invent skills.

## Rules

- One issue per iteration. Do not batch.
- Do NOT close an issue until the commit is in and quality gates are green.
- Do NOT leave commented-out code or TODO comments in committed code.
- Do NOT use the `RALPH:` commit prefix; use conventional commits (see step 6).
- Do NOT switch branches. Stay on `{{BRANCH}}` for every commit.
- If you are blocked (missing context, failing tests you cannot fix, external dependency), `gh issue comment <NUMBER> --body "BLOCKED: <one-line description of what's needed>"`, then output `<promise>COMPLETE</promise>` to hand off — do NOT close the issue.

# Done

When the open-issues list is empty, OR you are blocked on every remaining issue, output:

<promise>COMPLETE</promise>