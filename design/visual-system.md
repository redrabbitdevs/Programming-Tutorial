# Visual System — Programming Tutorial

**Owner:** UI/UX agent · **Status:** v1 (contract the Writer writes against and the QA Tester / Accessibility Auditor check the built site against)

## 1. Design principles

1. **Learning first** — every layout decision serves the lesson; presentation never reorders the pedagogical sequence set by the Advisor.
2. **Fast by default** — zero frameworks, zero webfonts, single inline stylesheet. The page must be useful with JavaScript disabled (progress tracking and exercise checking enhance, but never gate, reading).
3. **Calm focus** — one primary action per view, generous whitespace, code is the visual hero.
4. **Accessible by default** — WCAG 2.1 AA contrast on every text pair, full keyboard operability, visible focus, reduced-motion support (Accessibility Auditor's bar).

## 2. Colour system (Radix)

Palette source: **radix-ui/colors**. Scales adopted in v1: `gray`, `blue` (primary), `violet` (accent/agents), `green` (success), `gold` (warning), `red` (danger), `orange` (code numbers, partial). All values are exposed as CSS custom properties (`--gray-1` … `--gray-12`, etc.).

### 2.1 Adopted scales (hex)

| Step | gray | blue | violet | green | gold | red | orange* |
|---|---|---|---|---|---|---|---|
| 1 | #fafafa | #f5fbff | #f7f5fe | #f2fbf6 | #fbfbeb | #fef5f5 | — |
| 2 | #f5f5f5 | #e6f4fe | #efeafe | #e8faf0 | #f7f8dc | #feeceb | — |
| 3 | #ececec | #cce7ff | #e4d9ff | #d4f5e4 | #f2f2bc | #fed7d7 | — |
| 4 | #e3e3e3 | #a9d4ff | #cdbbff | #b0ecd0 | #ecdf99 | #fbbcbc | — |
| 5 | #d9d9d9 | #7bc0ff | #b294ff | #82dfb5 | #e2c86f | #f7918d | #feab61 |
| 6 | #bfbfbf | #4da6ff | #9a6fff | #57c99a | #d4a72c | #ef635d | — |
| 7 | #a3a3a3 | #2f95ff | #8949ff | #3ab786 | #b7791f | #e5484d | — |
| 8 | #717171 | #1478ff | #7a2eff | #229a70 | #9a5f1d | #d93036 | #c95a10 |
| 9 | #525252 | #0b5ed7 | #641acb | #16845c | #7a4d19 | #bf2633 | #a84a0e |
| 10 | #383838 | #0747a6 | #52149c | #156e4d | #633d18 | #a11e2b | — |
| 11 | #262626 | #07357d | #3e1075 | #145940 | #4c3014 | #7d1a26 | — |
| 12 | #171717 | #05265c | #2b0b57 | #134634 | #392510 | #5c1a20 | — |

\* orange: only steps 5 and 9 are used (dark/light code-number tokens).

### 2.2 Semantic tokens

| Token | Light | Dark |
|---|---|---|
| `--bg` | gray-1 | gray-12 |
| `--surface` | #ffffff | gray-11 |
| `--surface-2` | gray-2 | gray-10 |
| `--border` | gray-12 @ 14% alpha | gray-2 @ 16% alpha |
| `--border-strong` | gray-12 @ 30% alpha | gray-2 @ 32% alpha |
| `--text` | gray-12 | gray-2 |
| `--text-muted` | gray-9 | gray-6 |
| `--text-faint` | gray-8 | gray-7 |
| `--primary` / hover | blue-9 / blue-10 | blue-9 / blue-8 |
| `--on-primary` | #fff | #fff |
| `--link` | blue-9 | blue-4 |
| `--accent-*` (bg/text/border) | violet-2 / violet-11 / violet-9 @ 25% | violet-8 @ 20% / violet-3 / violet-4 @ 30% |
| `--info-*` | blue-2 / blue-11 / blue-9 @ 25% | blue-8 @ 16% / blue-3 / blue-5 @ 30% |
| `--success-*` | green-2 / green-11 / green-9 @ 30% | green-9 @ 18% / green-4 / green-6 @ 35% |
| `--warning-*` | gold-2 / gold-11 / gold-7 @ 35% | gold-6 @ 14% / gold-4 / gold-5 @ 35% |
| `--danger-*` | red-2 / red-11 / red-9 @ 30% | red-9 @ 16% / red-4 / red-6 @ 35% |
| `--code-bg` | gray-2 | gray-10 |

### 2.3 Rules & verified contrast (WCAG 2.1 AA)

- **Primary button is blue-9 + white in both themes** (5.84 : 1). Deliberate: a brighter dark-theme primary would drop below 4.5 : 1 for 14–16 px button labels.
- Body/muted text on `--bg`: light 7.5 : 1 / dark 9.7 : 1 (AA + AAA).
- Links: blue-9 on white 5.8 : 1; blue-4 on gray-12 11.6 : 1.
- Code tokens on `--code-bg` — light: keyword violet-9 (7.5), string green-10 (5.7), number orange-9 (5.3), comment gray-9 (7.2), function blue-9 (5.4); dark: violet-4 (6.8), green-5 (7.3), orange-5 (6.3), gray-6 (6.4), blue-4 (7.6). All ≥ 4.5 : 1.
- **Non-colour signalling is mandatory**: success/error states always pair colour with an icon or label ("✓ Correct", "✕ Not quite"); progress bars carry `role="progressbar"` + aria values; locked lessons show a lock glyph, not just greyed text.
- Tinted surfaces: light uses scale 2 solid; dark uses a mid-scale at 14–20% alpha over the surface (keeps tints subtle without washing out text).

## 3. Typography

- **Body:** `system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif` — zero font requests.
- **Code:** `ui-monospace, "Cascadia Code", "SF Mono", Menlo, Consolas, monospace`.
- Scale: 12 (caption) · 13.5 (code) · 14.5 (secondary UI) · 16 (body/prose) · 20 (card title) · 28–32 (section h2) · 44–52 (hero h1, `clamp(34px, 5vw, 52px)`).
- Weights: 400 body / 500 nav & meta / 600 buttons & labels / 700 headings ≤ h3 / 800 hero only.
- Prose: line-height 1.75, measure **72 ch** (lesson column max-width 760 px). Headings `letter-spacing: -0.01em` (hero `-0.02em`).

## 4. Spacing & layout

- **Base unit:** 4 px. Scales: 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96 (page-section padding: desktop 96, mobile 64).
- **Containers:** page content max-width 1120 px; lesson prose column max-width 760 px, centered.
- **Breakpoints:** `sm` 640 · `md` 768 · `lg` 1024 · `xl` 1280. Mobile-first: base styles target < 640; enhancements at min-width queries.
- **Grids:** home tracks use CSS Grid, 3 columns → 2 (≤ 1024) → 1 (≤ 640). Track cards are equal-height flex columns so CTAs align at the bottom.

## 5. Components

### 5.1 Buttons
| Variant | Use | Style (light / dark) |
|---|---|---|
| Primary | single main CTA per view ("Start learning", "Continue") | blue-9 bg, #fff text; hover blue-10 / blue-8 |
| Secondary | paired with primary ("Browse all tracks") | transparent, 1px `--border-strong`, text color; hover `--surface-2` |
| Ghost icon | theme toggle, menu | 36 × 36 px, 1px border, radius 9 |

Sizes: MD (40 h, default) and SM (32 h, in-card). Radius 9 px. Focus ring per §7.

### 5.2 Cards
Track card: `--surface` bg, 1px `--border`, radius 14, padding 24, shadow-1; hover lifts to shadow-2 + border-strong (translateY(-2 px), 150 ms). Contains: icon tile (40 px, tinted per track colour), title (20 / 600), description (14.5, muted), footer row (lesson count + level chip).

### 5.3 Badges & chips
Pill radius 999, padding 4 × 10, font 12.5 / 600. Colours: track colour tints; levels — Beginner = green, Intermediate = gold, Advanced = red (text on tint, never white-on-colour).

### 5.4 Code blocks
`--code-bg`, radius 12 (inner of a card: 8), padding 16–18, font 13.5 / 1.75, horizontal scroll when overflowing (no wrap — code readability first). Header bar with filename + copy button (SM ghost); on copy, button label becomes "Copied ✓" for 2 s and the border flashes success-9. Token colours per §2.3. Output panes: dashed top border, `--surface-2`, `$`-prefixed monospace lines.

### 5.5 Callouts
4 px left accent bar + tinted bg (radius 8): **Tip** = info-blue, **Warning** = gold, **Success / You got it** = green, **Error** = red. Icon + bold label ("Tip", "Heads up") precede text; colour is never the only signal.

### 5.6 Progress
Track progress: 6 px bar, `--surface-2` track, blue fill (light) / blue-7 (dark). Lesson list: 18 px status dots — done = green-9 + white check, current = blue ring + pulse (disabled under reduced motion), locked = gray outline + lock glyph.

### 5.7 Forms & exercises
Exercise editor: `<textarea>` monospace 13.5, `--code-bg`, min-height 120 px, auto-grow off (fixed height + scroll). Run/Check buttons SM; result area is a success/error callout with `role="status"` so screen readers announce it. All inputs: 44 px touch target minimum on mobile.

### 5.8 Navigation
Sticky header, 64 px, surface bg at 90% opacity + blur(8), 1px bottom border. Brand left (logo glyph + wordmark), primary links centre-left, theme toggle right. Mobile: hamburger → full-width dropdown panel with the same links (no drawer animation beyond a 150 ms fade/slide).

## 6. Dark mode
- Token swap only — **no per-component overrides**; every component consumes semantic tokens (§2.2), so dark mode is one attribute change.
- Strategy: `@media (prefers-color-scheme: dark)` as default; explicit choice stored in `localStorage("pt-theme")` overrides the media query. Toggle cycles auto → light → dark, persists, and updates `<meta name="theme-color">`.
- Dark surfaces are never pure black (gray-12 #171717); shadows are replaced with 1 px border emphasis; tints use low-alpha overlays per §2.3.

## 7. Motion & focus
- Durations: micro 120 ms (hover, toggle), standard 200 ms (panels), never > 300 ms. Easing `cubic-bezier(.2,.8,.4,1)`.
- Only transform/opacity animate (compositor-friendly). No parallax, no scroll-triggered reveals on lesson content (content must be readable instantly; a single fade-in of the hero is allowed).
- `prefers-reduced-motion: reduce` → all transitions/animations off, smooth scroll off.
- **Focus:** 2 px solid blue outline (blue-9 light / blue-4 dark), offset 2 px, on `:focus-visible` only; never removed (`outline: none` without replacement is a defect the Accessibility Auditor fails).

## 8. Iconography & imagery
- Icons: inline SVG, 1.5 px stroke, currentColor, 20 px default (24 in cards). No icon fonts.
- Track identity glyphs: Python = `py` monogram tile; JavaScript = `{ }`; HTML/CSS = `</>`; Git = branch glyph. Tiles are tinted squares (radius 10) — no photographic assets anywhere, keeping the payload tiny.
- Favicon: inline SVG data URI (blue tile + `</>`), no extra request.

## 9. Content density rules
- One idea per paragraph; lesson prose ≤ ~45 words/paragraph with a code or visual between paragraphs.
- Every section heading is descriptive ("What variables are", not "Intro").
- Empty states get an illustration-free, text-first treatment: icon + one sentence + action button (QA Tester's empty-state checklist).
