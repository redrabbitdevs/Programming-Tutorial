# Style guide

Binding writing standard for all lessons. The Editorial Reviewer gates against this doc; `scripts/validate.mjs` enforces the mechanical parts (word bounds, fence tags, no TODO/FIXME).

## Voice & audience

- Second person ("you"), present tense, active voice. Short sentences. One idea per paragraph.
- Write to the tier: **beginner** assumes only prior beginner lessons — define every technical term on first use; **intermediate** assumes the full beginner tier and introduces paradigm concepts; **advanced** assumes both earlier tiers.
- No filler openings ("In this lesson we will…"). Start with the concept or the problem it solves.
- Jargon policy: introduce a term in bold on first use, give a one-sentence plain-language definition, then use the term consistently afterwards. Never swap in a synonym for an established term (terminology consistency is an Editorial gate).

## Lesson structure

```
# <Title>                    ← frontmatter title; ≤ 60 chars
<1–3 sentence lede: what you'll be able to do after this lesson>

## <First concept heading>
…prose + code interleaved…

## …
## Common mistakes            ← required when the tier has plausible error patterns
## Summary                    ← 3–6 bullets, no new information
```

- Headings: one `h1` (the title), `h2` for sections, `h3` sparingly. In increasing order, no skipped levels.
- Prose 300–2000 words; code blocks don't count toward the bound but each must earn its place — a sample teaches something the prose can't.

## Code samples

- Every runnable block is tagged: ` ```python sample=py-001-hello ` (id format in `docs/content-conventions.md`). Non-runnable illustrative snippets (pseudo-code, UI output) use the language tag without `sample=` and must still be syntactically plausible.
- Samples are complete and runnable as written — no `...`, no "fill in the rest" unless the exercise explicitly says so.
- Show expected output immediately after a `sample=` block, in an unlabeled text fence or callout, matching `tests/samples/<id>.expected`.
- Determinism: no wall-clock, network, or unseeded randomness (see `tests/samples/README.md`).
- Multi-language comparisons use the Tabs widget; single-language lessons don't.

## Callouts

| Type | Use for |
|---|---|
| `tip` | shortcuts, idioms, "nice to know" |
| `info` | context, background, why-it-works |
| `warning` | common pitfalls that cause bugs |
| `danger` | data loss, security, irreversible actions |

Max 4 callouts per lesson; never two of the same type back-to-back.

## Prerequisites & pacing

- List only what the lesson actually requires — no "just in case" prerequisites (Editorial checks coherence both ways).
- Target ~120 words/minute of reading: a 30-minute lesson is ~1500–2000 words including code. `estimatedMinutes` must reflect real pacing, not aspiration.

## Research duty

Lesson-level factual accuracy against **current official documentation** is the Lesson Writer's responsibility (not the reviewers'). Cite the official source in a task note when a fact is version-sensitive; set `minLangVersion` accordingly so refresh tasks can target it later.
