// Dark-theme regression guard: the axe suite is light-only, which is why the
// dark-mode plaintext code-output contrast bug (pre-level shiki fg never
// swapped) shipped. This pins it: lesson 01's sample output must keep >= 4.5:1
// in dark mode. Fresh context + colorScheme 'dark' => the pre-paint theme
// island (Base.astro) resolves the system preference to data-theme="dark"
// before first paint — no localStorage involved, so the state is deterministic.
import { test, expect } from '@playwright/test'

test.use({ colorScheme: 'dark' })

function parseRgb(s: string): [number, number, number] | null {
  const m = s.match(/rgba?\(([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/)
  return m ? [+m[1], +m[2], +m[3]] : null
}

function luminance([r, g, b]: [number, number, number]): number {
  const f = (c: number) => {
    c /= 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}

function contrastRatio(a: [number, number, number], b: [number, number, number]): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

test('lesson 01 sample output keeps >= 4.5:1 contrast in dark theme', async ({ page }) => {
  await page.goto('learn/python/beginner/01-python-setup/')

  // Sanity: the theme island must have resolved to dark before first paint.
  expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe('dark')

  const pre = page.locator('[data-sample="py-001-first-script"] pre')
  // Plain-text (untokenized) line: a bare span carrying no --shiki-dark var,
  // so it inherits the pre's foreground. Before the fix this inherited the
  // inline light-mode #202020 on the swapped #111111 background (1.16:1).
  const colors = await pre.evaluate((el) => {
    const lineSpan = el.querySelector('span.line > span')
    return {
      fg: getComputedStyle(lineSpan ?? el).color,
      bg: getComputedStyle(el).backgroundColor
    }
  })

  const fg = parseRgb(colors.fg)
  const bg = parseRgb(colors.bg)
  expect(fg, `unparsable foreground "${colors.fg}"`).not.toBeNull()
  expect(bg, `unparsable background "${colors.bg}"`).not.toBeNull()
  // WCAG 2.1 AA normal text; the pt-dark theme pair is #eeeeee on #111111.
  expect(contrastRatio(fg!, bg!)).toBeGreaterThanOrEqual(4.5)
})

// Dark variant of the /languages/ article-typography guard (light twin in
// languages.spec.ts): heading scale, accent + underline links, and list style
// must all hold with the dark token set active. The accent comparison resolves
// var(--token-accent) in-page, so it tracks whichever theme is live.
test('/languages/python/ keeps .pt-article typography in dark theme', async ({ page }) => {
  await page.goto('languages/python/')

  // Sanity: the theme island must have resolved to dark before first paint.
  expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe('dark')

  const article = page.locator('.pt-article')
  await expect(article).toHaveCount(1)

  const h2Style = await article.locator('h2').first().evaluate((el) => {
    const cs = getComputedStyle(el)
    return { fontSize: cs.fontSize, fontWeight: cs.fontWeight }
  })
  expect(h2Style.fontSize).toBe('20px')
  expect(h2Style.fontWeight).toBe('600')

  const linkStyle = await article.locator('p > a').first().evaluate((el) => {
    const cs = getComputedStyle(el)
    const probe = document.createElement('span')
    probe.style.color = 'var(--token-accent)'
    probe.style.display = 'none'
    document.body.appendChild(probe)
    const accent = getComputedStyle(probe).color
    probe.remove()
    return { color: cs.color, textDecorationLine: cs.textDecorationLine, accent }
  })
  expect(linkStyle.color, 'prose links must use the dark accent token').toBe(linkStyle.accent)
  expect(linkStyle.textDecorationLine, 'prose links must be underlined').toContain('underline')
})
