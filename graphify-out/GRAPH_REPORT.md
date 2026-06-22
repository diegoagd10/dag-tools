# Graph Report - .  (2026-06-22)

## Corpus Check
- 59 files · ~74,441 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 218 nodes · 310 edges · 26 communities (15 shown, 11 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 17 edges (avg confidence: 0.8)
- Token cost: 65,307 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Combine PDF Tool|Combine PDF Tool]]
- [[_COMMUNITY_Architecture & Domain Model|Architecture & Domain Model]]
- [[_COMMUNITY_Runtime Dependencies|Runtime Dependencies]]
- [[_COMMUNITY_Split PDF Tool|Split PDF Tool]]
- [[_COMMUNITY_TypeScript Config|TypeScript Config]]
- [[_COMMUNITY_Split Result & File Detection|Split Result & File Detection]]
- [[_COMMUNITY_PDF Domain & Test Fixtures|PDF Domain & Test Fixtures]]
- [[_COMMUNITY_Dev Dependencies & Tooling|Dev Dependencies & Tooling]]
- [[_COMMUNITY_App Layout & Header|App Layout & Header]]
- [[_COMMUNITY_OpenCode MCP Config|OpenCode MCP Config]]
- [[_COMMUNITY_Home Page & Tool Icons|Home Page & Tool Icons]]
- [[_COMMUNITY_Coding Standards Rules|Coding Standards Rules]]
- [[_COMMUNITY_UI Icon Assets|UI Icon Assets]]
- [[_COMMUNITY_Test Frameworks|Test Frameworks]]
- [[_COMMUNITY_ESLint Config|ESLint Config]]
- [[_COMMUNITY_Next.js Config|Next.js Config]]
- [[_COMMUNITY_PostCSS Config|PostCSS Config]]
- [[_COMMUNITY_Brand Logos|Brand Logos]]
- [[_COMMUNITY_Vitest Config|Vitest Config]]
- [[_COMMUNITY_Named Exports Convention|Named Exports Convention]]
- [[_COMMUNITY_No-any Rule|No-any Rule]]
- [[_COMMUNITY_Import Alias Convention|Import Alias Convention]]
- [[_COMMUNITY_pnpm Workspace|pnpm Workspace]]

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 16 edges
2. `SourcePdf` - 14 edges
3. `scripts` - 10 edges
4. `useCombinePdfStore` - 9 edges
5. `Tool (domain concept)` - 8 edges
6. `formatBytes()` - 7 edges
7. `useSplitPdfStore` - 6 edges
8. `Source PDF` - 6 edges
9. `ADR-0001: Server-side PDF with SQLite` - 6 edges
10. `formatBytes()` - 5 edges

## Surprising Connections (you probably didn't know these)
- `sample-1.pdf Fixture` --references--> `Source PDF`  [INFERRED]
  tests/fixtures/sample-1.pdf → CONTEXT.md
- `sample-2.pdf Fixture` --references--> `Source PDF`  [INFERRED]
  tests/fixtures/sample-2.pdf → CONTEXT.md
- `Prefer Real Fixtures Over Mocks` --references--> `sample-1.pdf Fixture`  [INFERRED]
  CODING_STANDARDS.md → tests/fixtures/sample-1.pdf
- `Prefer Real Fixtures Over Mocks` --references--> `sample-2.pdf Fixture`  [INFERRED]
  CODING_STANDARDS.md → tests/fixtures/sample-2.pdf
- `Prefer Real Fixtures Over Mocks` --references--> `sample-multi-page.pdf Fixture`  [INFERRED]
  CODING_STANDARDS.md → tests/fixtures/sample-multi-page.pdf

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **File Tool Server-Side Flow** — context_source_pdf, context_file_tool, context_artifact, context_share_link, context_server_side_processing [INFERRED 0.85]
- **Server-Side SQLite Pivot Decisions** — 0001_server_side_pdf_with_sqlite_adr, 0001_server_side_pdf_with_sqlite_hono_backend, context_artifacts_table, context_share_link, 0001_server_side_pdf_with_sqlite_strangler_fig [EXTRACTED 0.90]
- **Agent Skill Configuration Surfaces** — claude_agent_skills, issue_tracker_github_issues, triage_labels_triage_labels, domain_domain_docs [EXTRACTED 0.90]

## Communities (26 total, 11 thin omitted)

### Community 0 - "Combine PDF Tool"
Cohesion: 0.11
Nodes (21): buildCombinedPdfFilename(), createCombinedPdf(), formatBytes(), formatUnit(), PerFileRejectionReason, REJECTION_MESSAGES, merge(), CombinePdfPage() (+13 more)

### Community 1 - "Architecture & Domain Model"
Cohesion: 0.10
Nodes (26): ADR-0001: Server-side PDF with SQLite, Hono Backend, Strangler Fig Per-Tool Migration, Agent Skills Configuration (CLAUDE.md), Loop Label Policy, Next.js App Router Architecture, 404 on Missing Artifact, API Response Shape (+18 more)

### Community 2 - "Runtime Dependencies"
Cohesion: 0.10
Nodes (20): dependencies, jszip, next, pdf-lib, react, react-dom, zustand, name (+12 more)

### Community 3 - "Split PDF Tool"
Cohesion: 0.19
Nodes (11): buildSplitZipFilename(), createSplitResult(), formatBytes(), formatUnit(), REJECTION_MESSAGES, SplitPdfPage(), entryName(), split() (+3 more)

### Community 4 - "TypeScript Config"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 5 - "Split Result & File Detection"
Cohesion: 0.18
Nodes (7): revokePreviousUrl(), analyzeFile(), FileAnalysis, SplitPdfResultPage(), SplitPdfState, useSplitPdfStore, SplitResult

### Community 6 - "PDF Domain & Test Fixtures"
Cohesion: 0.19
Nodes (13): Prefer Real Fixtures Over Mocks, Combined PDF, File Tool, Merge Order, Output Filename Pattern, PDF Combine Tool, PDF Split Tool, Source PDF (+5 more)

### Community 7 - "Dev Dependencies & Tooling"
Cohesion: 0.17
Nodes (12): devDependencies, @ai-hero/sandcastle, eslint, eslint-config-next, @playwright/test, tailwindcss, @tailwindcss/postcss, @types/node (+4 more)

### Community 8 - "App Layout & Header"
Cohesion: 0.33
Nodes (4): inter, metadata, plexMono, SiteHeader()

### Community 9 - "OpenCode MCP Config"
Cohesion: 0.33
Nodes (5): command, type, mcp, chrome-devtools, $schema

### Community 11 - "Coding Standards Rules"
Cohesion: 0.50
Nodes (4): Conventional Commits Only, RALPH Prefix Banned, Sandcastle Review Prompt Enforcer, TypeScript Only Style Rule

### Community 12 - "UI Icon Assets"
Cohesion: 0.67
Nodes (3): File / Document Icon, Globe Icon, Window / Browser Icon

## Knowledge Gaps
- **84 isolated node(s):** `eslintConfig`, `nextConfig`, `$schema`, `type`, `command` (+79 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `SourcePdf` connect `Combine PDF Tool` to `Split PDF Tool`, `Split Result & File Detection`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **Why does `Tool (domain concept)` connect `Architecture & Domain Model` to `PDF Domain & Test Fixtures`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `Dev Dependencies & Tooling` to `Runtime Dependencies`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `nextConfig`, `$schema` to the rest of the system?**
  _85 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Combine PDF Tool` be split into smaller, more focused modules?**
  _Cohesion score 0.11033681765389082 - nodes in this community are weakly interconnected._
- **Should `Architecture & Domain Model` be split into smaller, more focused modules?**
  _Cohesion score 0.09846153846153846 - nodes in this community are weakly interconnected._
- **Should `Runtime Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._