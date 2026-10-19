# Page Specs — Programming Tutorial

**Owner:** UI/UX agent · v1. Every spec lists structure, components, states (empty / loading / error), mobile behaviour, and testable acceptance criteria (a QA Tester must be able to check conformance without judgment calls).

## 1. Home (`/`)

**Structure**
```
header (sticky) → main:
  hero        eyebrow · h1 · sub · CTAs (primary "Start learning", ghost "Browse tracks") · stat row ‖ code card (sample lesson snippet + expected output)
  tracks      section head + track card grid (3-up desktop / 2-up tablet / 1-up mobile)
  pipeline    "How this site is built" — main-flow chips (Advisor → Researcher → Writer → Editor → Validator → Publisher) + feedback row (QA · A11y · Gap · Feedback → Improvement ↺ Orchestrator)
footer        copyright · repo link · "WCAG 2.1 AA · GitHub Pages"
```

**States**
- *Empty:* zero published tracks → single full-width placeholder card: "Our first track is in the pipeline — check back soon." (No empty grid.)
- *Loading:* none — static page; if later SSG'd, no client-side wait states are permitted on home.
- *Error:* broken internal link → 404 page (§5). No inline error UI on home.

**Mobile:** hero stacks (text → code card); nav collapses to a disclosure button (`aria-expanded`); track grid single column; pipeline rows wrap.

**Acceptance criteria**
1. LCP element is the hero `h1`; renders fully with JavaScript disabled.
2. Every link/button reachable by Tab in visual order; visible focus ring on all.
3. Track card shows a progress bar **only** if the track has ≥ 1 started lesson; otherwise "Not started" text (non-colour signal).
4. Code card copy button announces "Copied ✓" and reverts after ≤ 2 s.
5. Page weight < 60 KB total transfer, 0 third-party requests.

## 2. Lesson page (`/tracks/<track>/<lesson>`)

**Structure**
```
breadcrumbs (Home › Track › Lesson)
h1 lesson title + meta row (level badge · read time · prerequisites link)
content sections: Setup → Concept → Worked example   (each may contain code blocks, callouts)
exercise card(s)
prev/next footer
sidebar TOC (desktop ≥ 960 px only; sticky, lists section anchors)
```

**Code block spec:** header bar = filename + language badge + Copy button; body is **pre-tokenised markup** (classes `tok-k/s/n/c/f` — no highlighter runtime); optional "Expected output" footer separated by a dashed rule. Horizontal scroll on overflow with visible affordance (no clipping).

**Exercise card spec**
- Prompt (unambiguous, states exact expected behaviour) → code input (monospace textarea) → **Run** button + "Ctrl/⌘+Enter" hint.
- Feedback region `aria-live="polite"`: *success* = green tint + ✓ + echoed output; *error* = red tint + ✕ + one concrete hint, always retryable (never destructive wording).
- Keyboard: Tab reaches textarea → button; Ctrl/⌘+Enter runs.

**States**
- *Empty:* no progress recorded → meta shows "Not started yet"; prev/next still present.
- *Loading:* none (static). Exercise check is synchronous client-side (< 50 ms); if the checker is unavailable, show an info callout with local-run instructions — never a silent dead button.
- *Error:* lesson content missing → 404 page; broken exercise link in content → QA failure report, not user-visible text.

**Mobile:** TOC collapses to a `<details>` block above the title; prev/next stacks full-width; code blocks scroll horizontally; exercise input min-height 88 px (thumb-friendly).

**Acceptance criteria**
1. Heading hierarchy: exactly one `h1`; sections are `h2` in DOM order matching TOC.
2. Copy button copies the code body text only (no filename/label chrome).
3. Exercise success and error states each contain a non-colour signal (icon/text) and pass 4.5 : 1 contrast.
4. All internal links (breadcrumbs, prev/next, prerequisites) resolve on the built artifact.
5. Layout identical between themes except token remaps (QA diffs structure, not colours).

## 3. Track overview (`/tracks/<track>`)

**Structure:** header (title, description, learning outcomes list) → progress summary (bar + "n of m lessons") → modules as lists; each lesson row = status glyph (✓ done / ▶ current / 🔒 locked) + title + read time. Locked rows are not links.

**States:** *empty* — unpublished module renders as a single "Coming soon" placeholder row (no empty list); *loading* — none; *error* — unknown track → 404.

**Mobile:** single column, status glyph stays left-aligned for scannability.

**Acceptance criteria**
1. Progress bar value equals completed ÷ total published lessons (ARIA values match visible text).
2. Locked lessons expose no `href`; screen reader reads "locked" via the glyph's accessible name.
3. Current lesson row is visually distinct **and** labelled ("Up next"), not colour-only.

## 4. Progress dashboard (`/progress`)

**Structure:** per-track cards: title, progress bar, "n of m lessons", last-visited date, **Resume** button (deep link to current lesson). No accounts; data from `localStorage`.

**States:** *empty* — "No progress yet" card + CTA to the first track (this is the default for first-time visitors); *loading* — none; *error* — corrupted storage → treated as empty (fail soft, never an error screen).

**Mobile:** cards stack; Resume button full-width.

**Acceptance criteria**
1. First visit with no storage renders the empty state (no console errors).
2. Completing a lesson updates its track card on next load (deterministic, testable via seeded `localStorage`).
3. All dates rendered in the visitor's locale.

## 5. 404 / error page

**Structure:** large "404" + "This page doesn't exist (or isn't published yet)" → links: Home, Tracks, Progress. Friendly tone; no jargon.

**Acceptance criteria**
1. Returned for unknown routes on the built site; has its own `<title>` and `h1`.
2. All three links resolve; page passes with JS disabled.
