import { test, expect } from '@playwright/test'

// Changed-pages smoke: CI feeds the output of `node scripts/changed-pages.mjs
// origin/main...HEAD` via CHANGED_PAGES (URL paths joined with spaces, or the
// single tokens ALL / "(no page-affecting changes)"). Local runs without the
// env var skip gracefully. ALL falls back to the core page set — the full
// page list is not enumerable from the script output alone. Note: a home-page
// change maps to an empty token and drops out of the env var; home is covered
// unconditionally by core.spec.ts.
const CORE_PAGES = ['/', '/docs/design-system/', '/dashboard/']

function resolvePaths(): string[] {
  const raw = process.env.CHANGED_PAGES?.trim() ?? ''
  if (!raw || raw === '(no page-affecting changes)') return []
  if (raw === 'ALL') return CORE_PAGES
  return Array.from(new Set(raw.split(/\s+/).filter(Boolean)))
}

const paths = resolvePaths()

if (paths.length) {
  for (const path of paths) {
    test(`HTTP 200 + <main> for ${path || '/'}`, async ({ request }) => {
      // baseURL carries the site base path, so drop the leading slash to stay under it
      const res = await request.get(path.replace(/^\//, ''))
      expect(res.status()).toBe(200)
      expect(await res.text()).toContain('<main')
    })
  }
} else {
  // Graceful no-op for local runs without CHANGED_PAGES (or PRs with no page-affecting changes)
  test('no changed pages to check (local run or no page-affecting changes)', () => {})
}
