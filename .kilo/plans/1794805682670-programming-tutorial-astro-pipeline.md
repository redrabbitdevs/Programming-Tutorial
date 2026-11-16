# Programming Tutorial Site — Implementation Plan

## Context

Greenfield repo (`README.md` + `LICENSE` only), remote `git@github.com:redrabbitdevs/Programming-Tutorial.git`. Goal: a one-stop static site for learning programming from beginner to advanced, covering all major languages — current first, then older-but-still-in-use. Hosted on GitHub Pages; all work via branches with a protected `main`; an orchestrator agent is the sole gate before anything publishes.

## Resolved Decisions

| Decision          | Outcome                                                                                                                                                                                                                                            |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stack             | Astro 7 + `@astrojs/mdx` (confirmed; no alternative needed — static-first, Zod content collections, first-class MDX, GitHub Pages friendly). Amended 2026-11-16: Astro 5 → Astro 7 (latest major) per user.                                        |
| v1 scope          | Python full track first (proves pipeline end-to-end), then top-35-by-TIOBE tracks                                                                                                                                                                  |
| End state         | **900+ language encyclopedia pages** (all known languages incl. major dialects/variants); 34 of them get full beginner→advanced tracks (~25–30 lessons each — the top-35 TIOBE list with JavaScript+TypeScript as one combined track)              |
| CS fundamentals   | No standalone track — data structures, complexity, algorithms are woven into each language track's intermediate tier (user decision)                                                                                                               |
| Features in v1    | Pagefind search, localStorage progress tracking, CI code-sample validation, SEO/OG basics, E2E + a11y test suite                                                                                                                                   |
| Out of scope (v1) | In-browser code playground, i18n, analytics, accounts/backend                                                                                                                                                                                      |
| Agent model       | 9 specialized agents; only the Orchestrator may approve + merge to `main`; authors never self-merge (separate-reviewer requirement satisfied by the roster itself: Code Validator, Editorial Reviewer, QA sign off before the Orchestrator merges) |
| Git/PR execution  | Single GitHub account already authenticated on this system for all git ops. Agents push branches, open PRs (`gh pr create`), and merge (`gh pr merge`) with per-command permission confirmations. No bot account in v1 (upgrade path noted below)  |
| Colors/a11y       | Radix Colors token pairs (WCAG-safe light/dark), WCAG 2.1 AA target                                                                                                                                                                                |

TIOBE top 35 (Nov 2026, for roadmap data): Python, C, Java, C++, C#, JavaScript (+TypeScript companion, TIOBE #41), R, SQL, Visual Basic, Go, Rust, PHP, Fortran, Scratch, Perl, MATLAB, Assembly, Swift, Delphi/Object Pascal, Dart, VBScript, Classic Visual Basic, Julia, COBOL, ABAP, SAS, PL/SQL, Ada, Objective-C, Ruby, Prolog, Lua, Kotlin, OCaml, D.

## Architecture

```
src/
  content.config.ts          # Astro Content Layer collections (Zod schemas)
  content/lessons/<lang>/<tier>/<NN>-<slug>.mdx   # full track lessons
  content/languages/*.mdx    # encyclopedia pages (written languages only; see data/languages/)
  components/                # design-system widgets (.astro)
  layouts/                   # Base, Lesson, Track, Encyclopedia
  pages/
    index.astro              # home: hero, featured tracks, full language directory, browse-by-paradigm
    learn/[lang]/index.astro # track hub: curriculum map + progress
    learn/[lang]/[...slug].astro
    languages/index.astro    # encyclopedia index (filter/sort)
    languages/[slug].astro
    dashboard.astro          # pipeline dashboard (public, linked from footer)
    docs/design-system.astro # internal widget reference
    404.astro                # branded not-found
  styles/                    # tokens.css (Radix Colors → semantic), shiki theme, global
  scripts-islands/           # vanilla JS: theme, progress, tabs, copy, TOC, Pagefind init
data/
  curriculum/<lang>.json     # topic graph per language (ordering, tiers, prereqs)
  languages/<slug>.json      # ONE file per language (900+ files; avoids merge conflicts);
                             # site index generated at build from these files
  pipeline/tasks.json        # task state machine (orchestrator-owned)
  pipeline/activity.jsonl    # consolidated interaction log (orchestrator-only writer)
  pipeline/notes/<task-id>.md# per-task agent notes (each task owns its own file → no conflicts)
tests/samples/<id>.<ext> + <id>.expected   # code-sample validation fixtures
scripts/validate.mjs, extract-samples.mjs, gen-og.mjs, changed-pages.mjs
docs/style-guide.md, docs/content-conventions.md
.kilo/agent/*.md             # 9 agent role configs
.kilo/command/pipeline.md    # driver command: "run the orchestrator"
AGENTS.md                    # session-wide conduct (token economy, role tags) — auto-loaded by every new Kilo session
.github/workflows/ci.yml, deploy.yml
public/robots.txt            # + generated sitemap.xml, per-track og images
```

### Content model & conventions

- `lessons` collection (glob loader over `src/content/lessons/<lang>/**`), Zod schema: `lang`, `tier: beginner|intermediate|advanced`, `title`, `description`, `order`, `prerequisites[]`, `estimatedMinutes`, `status: draft|review|published`, `sampleIds[]`, `minLangVersion?`.
- **Track naming**: JavaScript and TypeScript ship as one combined track (TIOBE ranks them separately; TS is taught from the intermediate tier up). The encyclopedia still gets separate TypeScript and JavaScript pages — only the _track_ is merged.
- **Two language stores**: `data/languages/<slug>.json` is the canonical roadmap record for _every_ known language (900+, including planned) — `name`, `aliases[]`, `paradigms[]`, `year`, `era?`, `status: active|legacy|historical`, `tiobeRank?`, `trackSlug?`, `helloWorld {lang, code}`, `pageStatus: planned|written|published`. `src/content/languages/*.mdx` are the encyclopedia _pages_ (Zod collection with the same fields + `summary` prose) and exist only for written languages. `validate.mjs` checks both directions: every page has a matching JSON record, and every record with `pageStatus: published` has a page.
- **Slugs**: lessons at `<lang>/<tier>/<NN>-<slug>` (zero-padded order → stable URLs for SEO/links); encyclopedia slugs kebab-case language names; sample ids `<langprefix>-NNN-<name>`, unique site-wide. Slugs are immutable once published; if a rename is unavoidable, commit a meta-refresh HTML stub under `public/` at the old path (GitHub Pages has no native redirect files).
- **Status rule**: PRs may contain `draft|review|published`; the deploy build (push to `main`) runs `validate.mjs --strict` and **fails** if any lesson or encyclopedia entry is not `status: published`. Drafts therefore live only on branches.
- **Size bounds**: lessons 300–2000 words / `estimatedMinutes` 5–25; encyclopedia entries 150–600 words (orchestrator may adjust per tier).
- **Curriculum ↔ content bidirectional check** in `validate.mjs`: every curriculum entry has a lesson file and vice versa; prerequisites reference existing slugs.
- Home page shows the full language directory from day one (all roadmap entries with status); track links appear only for completed tracks.

### Curriculum structure (standard shape for every track)

- **Beginner (~10)**: environment setup, syntax & core types, control flow, functions, core collections, simple I/O.
- **Intermediate (~10)**: the language's core paradigm concepts (OOP/functional/etc. as appropriate), data structures & complexity + core algorithms (language-agnostic CS fundamentals woven in here), error handling, files/IO, modules/packages, testing basics.
- **Advanced (~8–10)**: concurrency, memory/performance, metaprogramming or advanced features, architecture patterns, and a closing **capstone project** lesson combining track skills.
- Track shape varies where the language demands it: SQL = query-focused (samples run against Postgres), Scratch = guided visual lessons (review-only validation), MATLAB/SAS/ABAP = review-only.

## Agent Roster (9 roles, each a `.kilo/agent/<name>.md` config)

Each config specifies: mission, inputs/outputs, owned paths, branch naming, definition-of-done, communication protocol (shared board posts for handoffs/blockers/gate results).

1. **Orchestrator** — owns roadmap + `data/pipeline/*`; assigns tasks; runs the publish gate; sole approver/merger. Never authors content directly.
2. **Curriculum Architect** — owns `data/curriculum/*.json`: topic graphs, tier mapping, prerequisite DAGs per language (the "curriculum researcher" role).
3. **Lesson Writer** — writes MDX lessons from curriculum specs; one branch per batch (5–7 lessons); lesson-level factual research against current official docs is this role's duty.
4. **Code Validator** — runs every code sample against expected output, maintains `tests/samples/`, per-language runner configs, issues the sample attestation in each PR.
5. **Reference Curator** — owns the 900+ encyclopedia pages: external research (Wikipedia language lists, TIOBE), metadata schema, paradigm/era/status classification, hello-world snippets, external-link freshness. Batch workload; lighter gate checklist than lessons.
6. **Editorial Reviewer** — pedagogy gate for lesson PRs: difficulty calibration vs tier, style guide, terminology consistency, prerequisite coherence. (Correctness is Code Validator's job; teachability is this role's.)
7. **Design Engineer** — design system: tokens, widgets, animations, layout components, theme system, Shiki theme file.
8. **QA & Accessibility Auditor** — axe audits, keyboard-navigation checks, contrast verification, link checks, content lint; signs off a11y/quality in each PR.
9. **Site Ops** — CI/CD workflows, GitHub Pages deploy, tooling/scripts (`validate.mjs`, `extract-samples.mjs`, `changed-pages.mjs`), dashboard implementation, branch hygiene.

## Execution Model

- **Driver**: `.kilo/command/pipeline.md` ("run the orchestrator") loads the Orchestrator role into the main session; it reads `data/pipeline/tasks.json`, picks ready tasks, and spawns sub-agents via Task using the matching `.kilo/agent/<name>.md` as the role prompt. Ad-hoc instructions (e.g. "write Python batch 2") work the same way without the command.
- **Coordination**: agents use the shared board for handoffs/blockers/gate results; each task also commits `data/pipeline/notes/<task-id>.md` in its own branch (one file per task → no cross-branch conflicts).
- **Single-writer state**: only the Orchestrator writes `tasks.json` / `activity.jsonl`. As the final step of reviewing a PR, the Orchestrator commits the state update (task → approved/published; activity entries consolidated from the task note + board posts) **to the PR branch**, then approves and squash-merges. No separate state PRs.
- **Git permissions**: agents push branches, open PRs, and merge under the single GitHub account already on this system (verify with `gh auth status` in Phase 0), with per-command confirmation prompts.
- **Content refresh**: lesson frontmatter carries `minLangVersion`; when a language ships a new major version, Orchestrator seeds `refresh` tasks for affected tracks; refresh PRs go through the same gate.
- **Agent conduct** — keep all output succinct: no restated context, no filler, minimal tool narration (token economy); each agent opens its work with its role name prominently displayed (e.g. `[Lesson Writer]`) and prefixes board posts, task notes, PR descriptions, and gate attestations with that role tag. Enforced in two layers so **every** new session inherits it: (1) repo-root `AGENTS.md` (auto-loaded by Kilo into all sessions, incl. ad-hoc and the orchestrator's main session — created in Phase 0), (2) restated per-role in each `.kilo/agent/*.md` config and the driver command.

## Publish Gate (orchestrator requirement #5)

A PR may merge to `main` only when **all** hold:

1. **CI green**: `astro check`, build, content-schema validation, `scripts/validate.mjs` (frontmatter complete + status=published, all code fences tagged with a language, every `sample=` id registered in the samples manifest with an expected-output file and unique site-wide, internal links resolve, no TODO/FIXME, word-count bounds, curriculum ↔ content consistency), sample execution matrix, Playwright+axe on changed pages, link check.
2. **Code Validator attestation** posted in the PR (sample results; any `review-only` flag justified).
3. **Editorial Reviewer sign-off** (lesson PRs only).
4. **QA & A11y sign-off**.
5. **Orchestrator final review**: accuracy spot-check, requirement fit, pipeline state finalized on the PR branch → approve + squash-merge via `gh pr merge`.

- **Rejection flow**: Orchestrator sets the task to `rejected`, records the reason in task history + activity log; the author fixes on the same branch and re-pushes (PR updates); the full gate re-runs.

Gate checklist by task type:

| Task type            | CI green                      | Code Validator attestation | Editorial sign-off | QA & A11y sign-off            | Orchestrator merge |
| -------------------- | ----------------------------- | -------------------------- | ------------------ | ----------------------------- | ------------------ |
| `lesson` / `refresh` | yes                           | all samples in the PR      | required           | required                      | yes                |
| `encyclopedia`       | schema + links + hello-worlds | hello-world snippets only  | not required       | required                      | yes                |
| `design` / `infra`   | yes                           | not required               | not required       | a11y checks on changed routes | yes                |

All phases — including Phase 0–3 infrastructure PRs — go through this same branch/PR gate flow (Site Ops opens the PR; applicable sign-offs apply).

Enforcement: `main` branch protection (PR required, status checks required, no force-push/direct push) + `CODEOWNERS` mapping `src/content/**`, `data/**`, `src/pages/**` to the owner's login. Note: since all agents share one GitHub account, "only the orchestrator may merge" is enforced by **process** (role configs forbid self-merge; only the Orchestrator runs `gh pr merge`; every gate decision is recorded in pipeline state + board), not by platform-level identity separation. CI checks are machine-enforced regardless of identity. **Upgrade path**: if stronger guarantees are wanted later, introduce a bot account for agent pushes and make the human owner the CODEOWNER reviewer.

## Dashboard (requirement #3)

- **Data**: `data/pipeline/tasks.json` — tasks `{id, agent, type: lesson|encyclopedia|design|infra|refresh, lang?, branch, pr, status: backlog→assigned→in_progress→review→approved|rejected→published, updatedAt, history[]}`; `data/pipeline/activity.jsonl` — consolidated `{ts, taskId, from, to, kind: assign|handoff|reply|review|gate_pass|gate_fail|merge, note}` (orchestrator-only writer, sourced from task notes + board posts).
- **Page** `/dashboard` (public, linked from footer): progress matrix per language (lessons by tier + status), task board grouped by agent, activity timeline of inter-agent interactions, and live PR badges via client-side `api.github.com` fetch (public repo, unauthenticated) with graceful fallback to the committed JSON snapshot when rate-limited.
- **Local**: `npm run dashboard` prints a terminal summary from the same files.

## Progress Tracking (user feature)

- localStorage key `pt-progress-v1` → `{ "<lang>/<slug>": <ISO timestamp> }`; local-only, no accounts; reset control on the track hub.
- Lesson pages: completion checkbox (persisted, aria-labeled). Track hub: per-tier % + overall progress bar. Home/track-hub "Continue learning" links to the first uncompleted lesson in curriculum order.

## Design System (requirement #1, #8)

- **Tokens**: map `@radix-ui/colors` CSS variables into semantic tokens (the `@radix-ui/colors` CSS-variable package — not the React component library; the site keeps zero framework dependencies) — `--color-bg`, `--color-surface`, `--color-text`, `--color-text-muted`, `--color-accent`, `--color-border`, plus success/warning/danger from green/yellow/red hues. Radix light/dark pairs guarantee WCAG-safe contrast in both themes.
- **Theme**: 3 modes (system/light/dark), `data-theme` on `<html>`, persisted, ≤150 ms crossfade; custom Shiki theme file mapped to the same tokens for light/dark code blocks.
- **Widgets**: Header/Nav (language switcher, search trigger, theme toggle) + SkipLink, Footer, CodeBlock (Shiki, copy button with aria-live feedback, language label, sample badge), Callout (tip/info/warning/danger), LessonNav (prev/next + tier), TOC with scrollspy, TierBadge, LanguageCard, TrackProgress bar, LessonCheckbox, Tabs (multi-language snippets), SearchBar (Pagefind), EncyclopediaTable (client-side filter/sort over embedded compact JSON: paradigm/era/status), dashboard widgets (TaskBoard, ActivityFeed, ProgressMatrix).
- **Animations**: CSS transitions/keyframes only (no animation library): staggered fade-up on section mount, hover lift on cards, progress-bar width transitions. All gated behind `prefers-reduced-motion`.
- **A11y baseline**: semantic landmarks, focus-visible styles everywhere, keyboard-complete nav/tabs/checkboxes/search, AA contrast (verified by axe in CI), alt-text policy, labeled form controls.
- **Performance budget**: LCP < 2.5 s (simulated 4G), client JS < ~15 KB gz per page, images lazy-loaded, Astro per-route CSS; e2e asserts a page-weight budget on the core set.

## Code-Sample Validation (orchestrator gate input)

- Convention: fenced code blocks carry an info-string `sample=<id>` (e.g. ` ```python sample=py-001-hello `). `scripts/extract-samples.mjs` parses lesson sources into `.samples/<id>.<ext>` + a manifest; expected outputs live at `tests/samples/<id>.expected`. `.samples/` is a generated artifact (gitignored, rebuilt by CI); the only committed sample files are fixtures under `tests/samples/`.
- **Determinism policy**: samples must produce deterministic output — no wall-clock time, network access, or unseeded randomness; seeded randomness allowed with a pinned seed. Expected-output comparison is byte-exact after trailing-newline normalization.
- CI matrix runs samples natively where GitHub runners have toolchains: Python, Node (JS/TS), Rust, Go, GCC/Clang (C/C++), JDK (Java); Docker jobs for others as tracks are added.
- **Toolchain matrix** (pinned in `ci.yml`, documented in `docs/content-conventions.md`): Python 3.12, Node 22 LTS, Rust/Go latest stable, GCC/Clang runner defaults, JDK 21 LTS, gfortran for Fortran; SQL samples run against a Postgres container. Samples must pass on the pinned versions; `minLangVersion` in frontmatter records the floor each lesson assumes.
- Languages without a runnable toolchain in CI (MATLAB, SAS, ABAP, Scratch, …) use a `review-only` flag: Code Validator documents why; orchestrator may approve with that flag but it must be explicit in the PR.

## CI/CD & Deployment (requirements #6, #7)

- Tooling: npm, Node 22, `@astrojs/check`, ESLint + Prettier, Playwright + `@axe-core/playwright`.
- `ci.yml` (on `pull_request`): install → `astro check` + build → `validate.mjs` → sample matrix (per language present in diff) → Playwright+axe against the built site (changed pages via `scripts/changed-pages.mjs` from the PR diff, plus core set: home, a track hub, a lesson, encyclopedia index, a language page, dashboard) → lychee link check.
- `deploy.yml` (on push to `main`): `validate.mjs --strict` (published-only) → build (incl. Pagefind index + OG images) → `actions/upload-pages-artifact` → `actions/deploy-pages`. Vite `base: '/Programming-Tutorial/'`; PagefindUI initialized with explicit `baseUrl` matching that base (subpath handling verified in e2e).
- **SEO/OG**: `@astrojs/sitemap`, meta tags per page; OG images generated at build for the 34 track languages + one site default (encyclopedia pages use the default) via satori/sharp, with one bundled open-source font (Inter, OFL) committed under `public/fonts/` so generation is deterministic and offline.
- Branching: `agent/<role>/<topic>` (e.g. `agent/lesson-writer/python-01-fundamentals`); one PR per task; squash merge.

## Ordered Implementation Tasks

**Phase 0 — Repo foundation** (Site Ops + human):

1. Verify GitHub identity (`gh auth status`); scaffold Astro 7 + MDX + TypeScript on Node 22 (`.nvmrc`), Tailwind v4, ESLint/Prettier, `package.json` scripts (`check`, `build`, `validate`, `samples:extract`, `test`, `dashboard`, `postbuild: pagefind`).
2. Add `ci.yml`, `deploy.yml`, `CODEOWNERS`, `.gitignore`; set Vite base path.
3. Create `AGENTS.md` with the session-wide conduct rules (succinct output / token economy, `[Role Name]` prefix on all agent communication) plus a pointer to the pipeline docs — this is what makes new sessions respect the rules before Phase 2 configs exist.
4. **Human one-time setup**: enable GitHub Pages with source = GitHub Actions; create branch protection on `main` (require PR + status checks + review approval, no force-push/direct push).

**Phase 1 — Design system** (Design Engineer): tokens, Shiki theme, layout shell, all widgets, theme toggle island, reduced-motion support, `/docs/design-system` reference page.

**Phase 2 — Pipeline infrastructure** (Site Ops + Orchestrator): the 9 `.kilo/agent/*.md` configs; `.kilo/command/pipeline.md` driver; `data/pipeline/*` schemas + initial state + notes convention (orchestrator seeds the backlog with Phase 4–6 work items so the dashboard is live from pilot start); `/dashboard` page + GitHub API client with fallback; `validate.mjs`, `extract-samples.mjs`, `changed-pages.mjs`; `docs/style-guide.md` + `docs/content-conventions.md` (slugs, sample ids, frontmatter, status rules).

**Phase 3 — Validation harness** (Code Validator + Site Ops): sample convention doc, `tests/samples/` layout, CI matrix jobs, Playwright+axe setup (incl. dashboard renders from the committed JSON snapshot when the GitHub API is unreachable), lychee config, Vitest unit tests for `scripts/` edge cases (slug parsing, sample extraction).

**Phase 4 — Python track end-to-end** (full pipeline run): Curriculum Architect authors `data/curriculum/python.json` (~28 lessons across 3 tiers, incl. intermediate-tier data structures/complexity/algorithms and a final capstone project); Lesson Writer delivers in batches of 5–7 through the complete gate; Code Validator + Editorial Reviewer + QA sign off each batch; Orchestrator finalizes state + merges. Track hub + Python encyclopedia entry included.

**Phase 5 — Encyclopedia foundation** (Reference Curator): `data/languages/<slug>.json` for the full ~900+ roadmap sourced from Wikipedia's list of programming languages + TIOBE index (schema-validated, one file per language); `/languages/` index embeds compact JSON for all records (name, paradigms, era, status, hasTrack) and filters/sorts client-side in vanilla JS (avoids a 900+ row server-rendered table); first batch = top-35 TIOBE language pages (incl. Python); remaining pages generated in batches through the lighter encyclopedia gate (schema + links + hello-world verification where a toolchain exists).

**Phase 6 — Pilot release**: OG image generation + sitemap + robots.txt verified, Pagefind index built, full e2e green; Orchestrator final pass on the release PR → merge → deploy → smoke test `https://redrabbitdevs.github.io/Programming-Tutorial/` (key routes, search, theme persistence, progress persistence, base-path assets); README updated with pipeline docs.

## v1 Release Criteria

- Python full track published (~28 lessons incl. intermediate-tier CS fundamentals + capstone).
- Encyclopedia: top-35 TIOBE language pages live (incl. a separate TypeScript page) with verified hello-worlds where toolchains exist; remaining roadmap entries present as index rows (status: planned).
- Search, progress tracking, dashboard, SEO/OG all live on the deployed URL; CI + e2e green; branch protection active.

## Validation Plan

- Per PR: CI green (all jobs above) — this is the machine half of the gate.
- Local before merge: `npm run check`, `npm run build`, `node scripts/validate.mjs`, `npm test` (Playwright).
- Post-deploy smoke: curl key routes (`/`, `/learn/python/`, one lesson, `/languages/`, `/dashboard`, 404); verify search returns results; theme + progress checkboxes persist across reloads; axe clean on a sample of pages.

## Risks & Mitigations

- **Quality drift at 900+ pages** → schema gate, batch reviews, orchestrator samples ~10% of encyclopedia pages per batch.
- **Proprietary/absent toolchains** (MATLAB, SAS, ABAP, Scratch) → explicit `review-only` flag convention.
- **Pages base-path breakage** → e2e asserts relative asset URLs against built dist; Pagefind `baseUrl` set explicitly; post-deploy smoke covers it.
- **GitHub API rate limit on dashboard** (60/h unauthenticated) → committed JSON snapshot fallback.
- **Orchestrator bottleneck** → batch PRs (5–7 lessons), gate is script-first with human judgment second.
- **Single-account identity risk** (agents could in principle merge their own work) → role configs forbid self-merge, CI blocks bad content regardless of who merges, all gate decisions recorded; bot-account upgrade path documented.

## Open Items

- Phase 0 step 3 requires a human (or `gh` with repo-admin permission) to set Pages source and branch protection — exact settings listed above.
- Recommend stating in README that tutorial content ships under the repo's MIT license unless a lesson notes otherwise.
- Site display name TBD — default working title "Programming Tutorial" used in `<title>`/OG until chosen (single-string change, no structural impact).
