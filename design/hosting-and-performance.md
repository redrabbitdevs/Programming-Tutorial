# Hosting & Performance — GitHub Pages

**Owner:** Publisher agent · v1.

## 1. Hosting model

- **Platform:** GitHub Pages, *project site* → live URL: `https://redrabbitdevs.github.io/Programming-Tutorial/`
- **Consequence:** the site lives under a subpath. **All URLs must be relative** (`./index.html`, `../LICENSE`) — never leading-slash absolute paths (`/css/site.css` would 404).
- **Content type:** pure static files (HTML/CSS/JS), no build step required in v1. This satisfies the Publisher's guardrails: reproducible builds (files are the artifact), versioned deployments (git tags per release), rollback-capable (re-deploy previous tag).

## 2. Deployment (recommended: GitHub Actions)

Deploy from `main` only (preview branches later, per Publisher CI/CD scope). Example workflow `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages
on:
  push: { branches: [main] }
  workflow_dispatch: {}
permissions:
  contents: read
  pages: write
  id-token: write
concurrency: { group: pages, cancel-in-progress: true }
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: { name: github-pages, url: ${{ steps.deployment.outputs.page_url }} }
    steps:
      - uses: actions/checkout@v4
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with: { path: . }          # v1: ship the repo root as-is (site files move to root when content lands)
      - id: deployment
        uses: actions/deploy-pages@v4
```

Alternative (no CI): Settings → Pages → Source "Deploy from a branch" → `main` / root. The Actions route is preferred because every deployment is versioned and auditable.

## 3. Performance budget (per page)

| Resource | Budget | How it's met |
|---|---|---|
| HTML document | ≤ 30 KB | Hand-authored, no templating bloat |
| CSS | ≤ 15 KB, **one file** | Inline `<style>` in head — zero render-blocking fetches |
| JS | ≤ 6 KB, no frameworks | One deferred inline script at end of body (theme, copy, exercises, nav) |
| Fonts | **0 requests** | System font stacks only |
| Images | Inline SVG only; none on critical path | Icons are 1–2 line SVG paths |
| Third-party requests | **0** | No analytics/CDN/fonts in v1 |
| Total transfer | < 60 KB raw / ~20 KB gzip | — |

Targets: LCP < 1.5 s on 4G, CLS < 0.1, INP < 100 ms (all trivially met by the above; QA Tester verifies per deployment).

## 4. Techniques locked in v1

1. **Pre-tokenised syntax highlighting** — lesson authors emit `tok-*` spans (or a build-time step later); no highlight.js runtime.
2. **Theme boot script** (< 300 B) in `<head>` sets `data-theme` pre-paint → no flash of wrong theme, no CLS from late CSS swap.
3. **Static-first interactivity** — reading works with JS off; JS only adds copy/run/progress/theme.
4. **No layout shift** — fixed header height, reserved space for feedback regions, `width/height` on any future raster images.

## 5. CI quality gate (optional, aligns with QA Tester)

A PR workflow can run: link check (e.g., `lychee`), HTML validation (`vnu-jar` or tidy), and a weight-budget check (fail if any page > 60 KB raw). Findings route to Improvement per the pipeline — the Publisher never edits content to make a build pass.
