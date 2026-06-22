# Task

Review the code changes on branch `{{BRANCH}}` and improve clarity, consistency, and maintainability while preserving exact functionality. Once the diff is clean, merge `{{BRANCH}}` into local `main` so the work lands.

# Context

## Branch diff (vs main)

!`git diff main...{{BRANCH}}`

## Commits on this branch

!`git log main..{{BRANCH}} --oneline`

## Project context

- **Language / framework**: TypeScript on Next.js 16.2.9 (App Router, React 19.2.4). Source under `src/`. Domain glossary in `CONTEXT.md` — use its terms (`_Tool_`, `_File Tool_`, `_Source PDF_`, `_Artifact_`, `_Share Link_`, `_Share ID_`, `_Combined PDF_`, `_Split PDF_`, etc.).
- **Package manager**: pnpm. `pnpm install --frozen-lockfile` is the install command.
- **Source layout**: `src/app/`, `src/app/api/`, `src/components/`, `src/lib/`. Tests under `tests/unit/` (vitest) and `tests/e2e/` (playwright). The `@/*` import alias resolves to `./src/*`.
- **Quality gates**:
  - `pnpm run typecheck` — `tsc --noEmit`.
  - `pnpm run lint` — ESLint.
  - `pnpm run test` — vitest.
  - `pnpm run test:e2e` — playwright (conditional, see Execution step 2).
- **Issue tracker**: GitHub via `gh` CLI. Conventions in `docs/agents/issue-tracker.md`. Triage labels in `docs/agents/triage-labels.md`.
- **Skills available**: `~/.agents/skills/` is bind-mounted read-only from the host. The full host skill set is available — including `tdd`, `codebase-design`, `domain-modeling`, `grilling`, `diagnosing-bugs`, etc. Project-local skills under `.agents/skills/` add `frontend-design`, `vercel-react-best-practices`, `web-design-guidelines` for UI work. Do NOT invent skills.
- **Branch model**: you are on `{{BRANCH}}`. The implementer has already pushed commits. After you commit any refinements, merge `{{BRANCH}}` into `main` locally — see Execution step 3.

## Coding standards

Load `/.sandcastle/CODING_STANDARDS.md` BEFORE reviewing. They are the authoritative source for style, testing, architecture, and commit format — this prompt does not duplicate them. Reviewer-introduced commits must also follow conventional-commits.

# Review process

1. **Understand the change** — read the diff and commits. Skim the surrounding code in the touched files.
2. **Look for improvements** — duplicated logic, unnecessary nesting, redundant abstractions, magic numbers, unclear names, deep nesting, nested ternaries, dead code. Prefer clarity over brevity.
3. **Check correctness** —
   - Does the implementation match the issue's intent? Are edge cases handled?
   - Are new/changed behaviours covered by tests?
   - Any `any` types, unsafe casts, unchecked assumptions, injection vulnerabilities, credential leaks?
   - Any import / type / lint violations a quick `pnpm run lint` would catch?
   - Does the code respect domain terms from `CONTEXT.md` — no synonyms in user-facing strings, exported types, or comments?
4. **Maintain balance** — do NOT over-simplify. Don't merge two concerns into one function, don't strip helpful abstractions, don't remove error handling that prevents silent failures.
5. **Preserve functionality** — never change WHAT the code does, only HOW.

# Execution

1. **Apply refinements** directly on `{{BRANCH}}`. Commit each non-trivial refinement with a conventional-commits message (`refactor(<scope>): ...`, `fix(<scope>): ...`, `style(<scope>): ...`, etc.). NEVER use `RALPH:` — it is BANNED.
2. **Verify** the refined branch is green:
   - `pnpm run typecheck`
   - `pnpm run lint`
   - `pnpm run test`
   - `pnpm run test:e2e` — only if the diff touched `tests/e2e/`, `playwright.config.ts`, or anything that affects the dev server (e.g. changes to `src/app/` routes).
3. **Merge to main** — once green and stable, fast-forward local `main` to `{{BRANCH}}`:
   ```
   git checkout main
   git merge --ff-only {{BRANCH}}
   ```
   If `main` has advanced (extremely unlikely in this sequential loop), rebase `{{BRANCH}}` onto `main` first, re-run the verification in step 2, then merge. Do NOT open a PR, do NOT push — this loop is local-only.
4. If the code is already clean, skip step 1 and proceed straight to step 3.

Output `<promise>COMPLETE</promise>` after the merge (or after step 4 if no refinements were needed).