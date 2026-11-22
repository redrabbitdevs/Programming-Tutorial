# Content conventions

Binding conventions for all content work. Machine-enforced by `scripts/validate.mjs` where noted **[V]**. Source of truth: the plan's "Content model & conventions" section — this doc makes it operational and records two documented refinements (marked **refinement**).

## Slugs & paths

- **Lessons**: `src/content/lessons/<lang>/<tier>/<NN>-<slug>.mdx` **[V]** — `NN` is the zero-padded curriculum order (2 digits), `tier` ∈ `beginner|intermediate|advanced`, `slug` kebab-case. URLs: `/learn/<lang>/<tier>/<NN>-<slug>/`.
- **Encyclopedia pages**: `src/content/languages/<slug>.mdx`, URL `/languages/<slug>/`; records at `data/languages/<slug>.json`. Slugs are kebab-case language names.
- **Curricula**: `data/curriculum/<lang>.json`, one file per track.
- Slugs are **immutable once published**. If a rename is unavoidable, commit a meta-refresh HTML stub under `public/` at the old path (GitHub Pages has no native redirect files).

## Curriculum schema (`data/curriculum/<lang>.json`) **[V]**

```jsonc
{
  "lang": "python",            // must match filename slug
  "title": "Python Track",
  "lessons": [
    {
      "order": 1,              // positive int, unique across the whole track
      "tier": "beginner",
      "slug": "hello-world",   // kebab-case
      "title": "Hello, World",
      "prerequisites": [],     // slugs within this curriculum; must form a DAG
      "status": "planned"      // planned | published (default: planned)  [refinement]
    }
  ]
}
```

**Refinement — per-entry `status`**: the plan's bidirectional check ("every curriculum entry has a lesson file and vice versa") is enforced at the *published* level so incremental batch delivery works:

- **Normal mode (CI on branches)**: every lesson file must exist in its language's curriculum with matching order/tier/slug (content ⊆ curriculum); prerequisites reference existing slugs; orders unique; no prerequisite cycles.
- **Strict mode (deploy build on `main`)**: additionally, every curriculum entry with `status: published` must have its lesson file, and every lesson file must be `status: published`. Entries still `planned` are fine — a track is simply incomplete.
- A track is **complete** when all entries are `published`; only then does the home page show its track link (plan: "track links appear only for completed tracks").
- Who flips entry status: the Lesson Writer sets `status: published` on their batch's entries in the PR; the Orchestrator verifies consistency during final review.

## Lesson frontmatter (Zod collection, Phase 4) **[V]**

| Field | Type | Notes |
|---|---|---|
| `lang` | string | must match path segment |
| `tier` | `beginner\|intermediate\|advanced` | must match path segment |
| `title` / `description` | string | description = 1–2 sentences, used in lists/SEO |
| `order` | number | must match filename `NN` **[V]** |
| `prerequisites` | string[] | curriculum slugs |
| `estimatedMinutes` | number | 5–25 (word bounds imply pacing) |
| `status` | `draft\|review\|published` | see status rules |
| `sampleIds` | string[] | every `sample=` id in the body must appear here and vice versa |
| `minLangVersion` | string? | for refresh-task targeting |

## Encyclopedia record schema (`data/languages/<slug>.json`) **[V]**

Required: `name`, `aliases[]`, `paradigms[]`, `year` (number), `status` ∈ `active|legacy|historical`, `helloWorld {lang, code}`, `pageStatus` ∈ `planned|written|published`. Optional: `era?`, `tiobeRank?` (positive int), `trackSlug?` (must have a matching curriculum file **[V]**).

Page ↔ record consistency **[V]**: every `src/content/languages/<slug>.mdx` has a record; every record with `pageStatus: written|published` has a page. Encyclopedia pages: 150–600 words, frontmatter mirrors the record plus `summary` prose.

**Refinement — `languageStatus` on pages**: the record's `status` field (`active|legacy|historical`) collides with the publish-lifecycle `status` (`draft|review|published`) that `--strict` gates on. On page frontmatter the record's field is therefore named **`languageStatus`** **[V]**; the page's own `status` is always the lifecycle value. The JSON record keeps `status`.

## Status rules

- PRs may contain `status: draft | review | published`; authors submit batches as `review`.
- The deploy build (push to `main`) runs `validate.mjs --strict` and **fails** if any lesson or encyclopedia entry is not `published`. Drafts live only on branches.
- Pipeline task statuses (`data/pipeline/tasks.json`) are separate: `backlog → assigned → in_progress → review → approved | rejected → published`.

## Size & fence rules **[V]**

- Lessons 300–2000 prose words / `estimatedMinutes` 5–25; encyclopedia 150–600 words.
- Every code fence carries a language tag; no TODO/FIXME anywhere in content.
- Sample ids: `<langprefix>-NNN-<name>` (e.g. `py-001-hello`), unique site-wide, each with a committed `tests/samples/<id>.expected`. See `tests/samples/README.md` for the determinism policy.

## Internal links **[V]**

Absolute paths in content may omit or include the base prefix `/Programming-Tutorial/`; both validate. Links must resolve to a known route (page, lesson URL, language page, or `public/` asset). Relative links are resolved against the file's own output URL.

## Layouts & content typography

Any layout (or page) that renders an MDX/prose body **must** wrap the slot in `.pt-article` (defined in `src/styles/global.css`). Content typography — heading scale, paragraph rhythm, list styles, link accent + underline, inline code, tables — is scoped to that class because Tailwind preflight strips native heading/list/paragraph/link styles; unscoped content renders flat (headings at body size/weight, links indistinguishable from prose) in both themes.

Rules:

- Only the MDX body goes inside `.pt-article`. Page chrome around the slot (back link, `h1`, status badges, metadata `dl`) stays **outside** the scope and keeps its explicit Tailwind classes.
- Components rendered *from* the MDX body (Callout, Tabs, CodeBlock) need no extra wrapping — they render as descendants of `.pt-article` and inherit the scoped rules.
- Reference implementations: `src/layouts/Lesson.astro`, `src/layouts/Encyclopedia.astro`. Guarded by e2e: `tests/e2e/languages.spec.ts` (article typography on `/languages/python/`) and `tests/e2e/dark-theme.spec.ts` (dark variant).

**Defect class this prevents**: `/languages/<slug>/` encyclopedia pages shipped without the scope — h2 sections rendered at body size, prose links unaccented and ununderlined, reference list unstyled (both themes). Caught by the e2e guard above; see the 2026-11-22 hotfix.

## Sample execution toolchain matrix

| Runner | Languages |
|---|---|
| Native (GitHub runner) | Python, Node (JS/TS), Rust, Go, GCC/Clang (C/C++), JDK (Java) |
| Docker jobs | others, as tracks are added |
| `review-only` flag | MATLAB, SAS, ABAP, Scratch (no toolchain; justified in Code Validator attestation) |
