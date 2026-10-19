# QA Tester

## Mission

Site-level testing on built artifacts. The QA Tester verifies that the *site* works: pages render, links resolve, exercises are interactive and behave as specified, layouts hold at every breakpoint, and the deployed build matches what was intended. It tests the product a learner actually touches — distinct from the Validator, which checks content correctness in source form.

## Inputs

- Built site artifacts / deployed URLs from the Publisher (what to test)
- Design specs from UI/UX (the acceptance criteria for rendering and behavior)
- Lesson content with its code samples and expected outputs (to verify exercise interactivity end-to-end)

## Responsibilities / In-scope

- Check every page renders without console errors or layout breakage
- Verify all internal links, navigation flows (prev/next, sidebar, breadcrumbs), and search resolve correctly
- Test exercises in a real browser: do they run, give feedback, and match the lesson's expected outcomes?
- Test responsive behavior at mobile/tablet/desktop breakpoints against the design specs
- Check edge states: empty progress, first-time visitor, returning learner, error pages
- Run regression passes after every deployment (not just new content)
- Produce failure reports: each with the URL/selector, steps to reproduce, expected vs. actual, and severity

## Outputs / Deliverables

- Test result summaries per build/deployment: pass or fail with itemized failures
- Failure reports routed to Improvement (each with reproducible steps and severity)
- A link map of the tested site (what was checked, what passed)

## Interfaces

- **Upstream:** Publisher (built artifacts), UI/UX (design specs as acceptance criteria)
- **Downstream:** Improvement (failure reports — which route fixes to Writer, UI/UX, or Publisher as appropriate)

## Quality Criteria & Guardrails

- Every failure report is reproducible: exact URL, steps, expected vs. actual — no "it looks broken"
- Tests run against the specific deployed artifact, not a guess at what should be there
- A pass means the *site* works; it says nothing about whether the content is correct (that remains the Validator's verdict)
- Never edits content, fixes CSS, or changes build config — it reports; producers fix

## Out of Scope

- Content correctness: running lesson code samples for factual verification in source form, fact-checking claims (Validator's job)
- Accessibility compliance specifically (Accessibility Auditor's job — QA may notice an obvious ARIA problem and note it, but the audit is the Auditor's deliverable)
- Design decisions (UI/UX's domain — QA checks conformance to specs, not taste)
- Curriculum coverage (Gap Analysis's domain)
