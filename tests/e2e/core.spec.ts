import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))

test.describe('core pages', () => {
  test('home renders', async ({ page }) => {
    await page.goto('')
    await expect(page.locator('main#main')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Learn programming, end to end.' })).toBeVisible()
  })

  test('design system renders with a CodeBlock and TOC', async ({ page }) => {
    await page.goto('docs/design-system/')
    await expect(page.locator('main#main')).toBeVisible()
    const codeblock = page.locator('[data-codeblock]').first()
    await expect(codeblock).toBeVisible()
    // CodeBlock renders raw Shiki output (<pre class="shiki ...">); the
    // astro-code class only appears on markdown-pipeline blocks.
    await expect(codeblock.locator('pre')).toHaveCount(1)
    await expect(page.locator('nav[data-toc]')).toBeVisible()
    await expect(page.locator('[data-toc-link="overview"]')).toBeVisible()
  })

  test('dashboard renders from the committed JSON snapshot with no network access', async ({ page }) => {
    const failedRequests: string[] = []
    page.on('requestfailed', (req) => failedRequests.push(req.url()))
    // Simulate an unreachable/rate-limited GitHub API without touching the
    // network: the fetch resolves locally, so no request ever leaves the browser.
    await page.route('**/api.github.com/**', (route) =>
      route.fulfill({ status: 429, contentType: 'application/json', body: '{"message":"rate limit"}' })
    )
    await page.goto('dashboard/')
    // Task board from committed data/pipeline/tasks.json — scoped to the board
    // region because the title may also appear in the open-PRs snapshot.
    const board = page.getByRole('region', { name: 'Task board' })
    await expect(board.getByText('Author data/curriculum/python.json (~28 lessons, 3 tiers incl. capstone)')).toBeVisible()
    // The task id renders on the board and/or in the activity feed depending on
    // pipeline state, so resolve to the first match rather than strict mode.
    await expect(page.getByText('T-001', { exact: true }).first()).toBeVisible()
    // Activity feed from committed data/pipeline/activity.jsonl — assert the
    // newest committed entry renders (the feed shows the 30 most recent, so
    // older entries fall out as the pipeline progresses).
    const activityLines = readFileSync(join(here, '../../data/pipeline/activity.jsonl'), 'utf8')
      .split('\n').filter((l) => l.trim())
    const latestNote = JSON.parse(activityLines[activityLines.length - 1]).note as string
    await expect(page.getByText(latestNote)).toBeVisible()
    // Open-PRs snapshot mirrors the page rule (pr set and not yet published);
    // the committed snapshot stays on fetch failure and the fallback note is shown.
    const tasks = JSON.parse(readFileSync(join(here, '../../data/pipeline/tasks.json'), 'utf8')).tasks as { pr: number | null; status: string }[]
    if (tasks.some((t) => t.pr != null && t.status !== 'published')) {
      await expect(page.locator('#pr-empty')).toHaveCount(0)
    } else {
      await expect(page.locator('#pr-empty')).toBeVisible()
    }
    await expect(page.locator('#pr-fallback-note')).toBeVisible()
    expect(failedRequests.filter((u) => u.includes('api.github.com'))).toEqual([])
  })
})

test.describe('theme persistence', () => {
  test.use({ colorScheme: 'light' })

  test('toggle updates html.dark + pt-theme and survives reload', async ({ page }) => {
    await page.goto('')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
    expect(await page.evaluate(() => document.documentElement.classList.contains('dark'))).toBe(false)

    const toggle = page.locator('[data-theme-toggle]')
    await toggle.click() // system -> light
    await toggle.click() // light -> dark
    await expect(page.locator('html')).toHaveClass(/dark/)
    expect(await page.evaluate(() => localStorage.getItem('pt-theme'))).toBe('dark')

    await page.reload()
    await expect(page.locator('html')).toHaveClass(/dark/)
    expect(await page.evaluate(() => localStorage.getItem('pt-theme'))).toBe('dark')
  })
})

test.describe('progress persistence', () => {
  test('LessonCheckbox writes pt-progress-v1 and TrackProgress reflects it after reload', async ({ page }) => {
    await page.goto('docs/design-system/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()

    const checkbox = page.locator('input[data-progress-toggle="demo/python/01-hello"]')
    await expect(checkbox).not.toBeChecked()
    await checkbox.check()

    const store = await page.evaluate(() => JSON.parse(localStorage.getItem('pt-progress-v1') ?? '{}'))
    expect(Object.keys(store)).toEqual(['demo/python/01-hello'])
    expect(typeof store['demo/python/01-hello']).toBe('string')

    // Live update: beginner 1/3 = 33%, overall 1/4 = 25%
    const track = page.locator('[data-track-progress="demo"]')
    await expect(track.locator('[data-pct="beginner"]')).toHaveText('33%')
    await expect(track.locator('[data-pct="overall"]')).toHaveText('25%')

    await page.reload()
    await expect(checkbox).toBeChecked()
    await expect(track.locator('[data-pct="beginner"]')).toHaveText('33%')
    await expect(track.locator('[data-pct="overall"]')).toHaveText('25%')
  })
})
