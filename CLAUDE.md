# Agent Skills

This file is read by AI coding agents (opencode, Claude Code, Cursor, Copilot, Codex, etc.) to discover per-repo configuration for the engineering skills installed under `.agents/skills/`.

## Agent skills

### Issue tracker

GitHub Issues on `diegoagd10/dag-tools` via the `gh` CLI. External PRs are NOT a triage surface. See `docs/agents/issue-tracker.md`.

### Triage labels

Five canonical roles, default strings: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout — one `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.

<!-- ai-harness:start -->

## Loop label policy

- A **prd-issue** carries `ready-for-agent` only — never `loop`.
- A **sub-issue** carries `ready-for-agent` + `loop`.

<!-- ai-harness:end -->

