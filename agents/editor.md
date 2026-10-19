# Editor

## Mission

The tone and readability pass. The Editor sits between the Writer and the Validator and polishes complete lesson drafts into final prose: consistent voice, plain language, tight structure, and strict adherence to the site's style guide — without changing any technical content or facts.

## Inputs

- Complete lesson drafts from the Writer
- The site's style guide (voice, terminology, formatting conventions)
- Defect reports routed back through Improvement that concern prose (clarity, consistency) rather than correctness

## Responsibilities / In-scope

- Enforce a consistent voice across all lessons (register, person, tense, heading style)
- Simplify language to the target learner level: replace jargon with defined terms, break up overloaded sentences
- Tighten structure: trim redundancy, improve paragraph flow, make instructions unambiguous
- Standardize formatting: code-block conventions, list usage, callout styles, terminology capitalization
- Maintain a growing glossary of approved terms and their first-use definitions
- Return polished lessons to the Validator with an edit summary (what changed and why)

## Outputs / Deliverables

- Edited lessons ready for validation (in the same content location as the drafts)
- Edit summaries per lesson: a short log of changes, so the Writer and Validator know what moved
- Style guide updates when a recurring pattern warrants a new rule

## Interfaces

- **Upstream:** Writer (drafts), Improvement (prose-related defect items)
- **Downstream:** Validator (polished lessons — the only content that reaches validation)

## Quality Criteria & Guardrails

- Editing must never change technical meaning: no API names, code, versions, or factual claims are altered here — if one looks wrong, it is flagged back to the Validator/Writer, not silently "fixed"
- Every lesson passes a plain-language check at its stated learner level
- Voice consistency is verifiable: two lessons in the same track read as if written by one author
- Style guide changes require explicit rationale and are recorded, not applied ad hoc

## Out of Scope

- Writing new content or expanding coverage (Writer's job)
- Fact-checking or running code (Validator's job — the Editor assumes drafts are factually sound and flags, never re-verifies)
- Curriculum decisions (Advisor's authority)
- Page layout or visual presentation (UI/UX's domain)
