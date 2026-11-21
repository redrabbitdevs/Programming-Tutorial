import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { loadCurricula, lessonUrl } from './curriculum'

// Analyze with reduced motion: page sections mount via a 300 ms pt-fade-up
// opacity animation (gated behind prefers-reduced-motion: no-preference).
// Axe must see the settled state — analyzing mid-animation reports false
// color-contrast failures from partially transparent text.
test.use({ reducedMotion: 'reduce' })

// baseURL-relative paths: the site is served under /Programming-Tutorial/
const PAGES = [
  '',
  'docs/design-system/',
  'dashboard/',
  // Track hubs + every published lesson route (T-007): same committed curriculum
  // JSON the build renders from, so coverage tracks content automatically.
  ...loadCurricula().flatMap((curriculum) => [
    `learn/${curriculum.lang}/`,
    ...curriculum.lessons.filter((l) => l.status === 'published').map((l) => lessonUrl(curriculum.lang, l))
  ])
]

for (const path of PAGES) {
  test(`no wcag2a/wcag2aa violations on ${path || '/'}`, async ({ page }) => {
    await page.goto(path)
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
    expect(results.violations).toEqual([])
  })
}
