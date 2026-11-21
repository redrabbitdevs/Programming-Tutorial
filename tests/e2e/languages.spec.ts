// Encyclopedia routes (T-010): /languages/ renders the data-driven table from
// data/languages/*.json with client-side filter/sort + aria-live count;
// /languages/<slug>/ renders a published MDX entry through the Encyclopedia
// layout. The index assertions read the same committed records the build does,
// so coverage tracks content automatically (same pattern as lessons.spec.ts).
import { test, expect } from '@playwright/test'
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '../..')

interface DataRecord {
  name: string
  paradigms?: string[]
  year?: number
  era?: string
  status: 'active' | 'legacy' | 'historical'
  trackSlug?: string
}

// The same committed data records the index route renders at build time.
const dataRecords = readdirSync(join(root, 'data/languages'))
  .filter((f) => f.endsWith('.json'))
  .map((f) => ({ slug: f.replace(/\.json$/, ''), record: JSON.parse(readFileSync(join(root, 'data/languages', f), 'utf8')) as DataRecord }))
const total = dataRecords.length

test.describe('encyclopedia index', () => {
  test('renders the table with the Python row and Track badge', async ({ page }) => {
    await page.goto('languages/')
    await expect(page.locator('main#main')).toBeVisible()
    const h1 = page.locator('h1')
    await expect(h1).toHaveCount(1)

    const table = page.locator('[data-encyclopedia-table]')
    await expect(table).toBeVisible()
    // One row per committed record; the aria-live count is applied client-side on load.
    await expect(table.locator('[data-rows] tr')).toHaveCount(total)
    await expect(table.locator('[data-count]')).toHaveText(`${total} of ${total} languages`)

    // Python row: its name links to the language page and shows the Track badge
    // (python.json declares trackSlug).
    const python = dataRecords.find(({ slug }) => slug === 'python')
    expect(python, 'data/languages/python.json must exist').toBeDefined()
    const row = table.locator('[data-rows] tr', { has: page.getByRole('link', { name: python!.record.name, exact: true }) })
    await expect(row).toHaveCount(1)
    await expect(row.getByRole('link', { name: 'Python', exact: true })).toHaveAttribute('href', /\/languages\/python\/$/)
    await expect(row.getByText('Track', { exact: true })).toBeVisible()
  })

  test('filtering updates rows and the aria-live count client-side', async ({ page }) => {
    await page.goto('languages/')
    const table = page.locator('[data-encyclopedia-table]')
    const count = table.locator('[data-count]')
    await expect(count).toHaveText(`${total} of ${total} languages`)

    // Walk every status filter and assert the live count + row order match what
    // the committed records predict — proves filtering runs client-side. The
    // component reorders rows (matching first) rather than removing them from
    // the DOM, so assert the leading rows are exactly the matching records in
    // the default name-ascending sort.
    for (const status of ['active', 'legacy', 'historical'] as const) {
      const matching = dataRecords
        .filter(({ record }) => record.status === status)
        .sort((a, b) => a.record.name.localeCompare(b.record.name))
        .map(({ record }) => record.name)
      await table.locator('[data-filter="status"]').selectOption(status)
      await expect(count).toHaveText(`${matching.length} of ${total} languages`)
      const names = await table.locator('[data-rows] tr').evaluateAll((els) =>
        els.map((el) => JSON.parse(el.dataset.record ?? '{}').name as string)
      )
      expect(names.slice(0, matching.length)).toEqual(matching)
    }

    // Reset back to all records.
    await table.locator('[data-filter="status"]').selectOption('')
    await expect(count).toHaveText(`${total} of ${total} languages`)
  })
})

test.describe('encyclopedia language page', () => {
  test('/languages/python/ renders the name h1 and MDX body', async ({ page }) => {
    await page.goto('languages/python/')
    await expect(page.locator('main#main')).toBeVisible()

    // Exactly one h1, matching the frontmatter name.
    const h1 = page.locator('h1')
    await expect(h1).toHaveCount(1)
    await expect(h1).toHaveText('Python')

    // Metadata shell from frontmatter: back link + "Full track" CTA (trackSlug set).
    await expect(page.getByRole('link', { name: '← All languages' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Full track →' })).toHaveAttribute('href', /\/learn\/python\/$/)

    // First sentence of the MDX body (skipping headings) — proves the content
    // collection entry renders through the layout, not just the metadata shell.
    // Only the first sentence is asserted: Sätteri typographically converts
    // straight quotes to curly ones in the rendered HTML.
    const mdx = readFileSync(join(root, 'src/content/languages/python.mdx'), 'utf8')
    const body = mdx.split(/^---\r?\n[\s\S]*?\r?\n---/)[1] ?? ''
    const firstLine = body.split('\n').map((l) => l.trim()).find((l) => l && !l.startsWith('#'))
    expect(firstLine, 'python.mdx must have prose content').toBeTruthy()
    const firstSentence = firstLine!.split(/(?<=[.!?])\s+/)[0]
    await expect(page.getByText(firstSentence)).toBeVisible()
  })
})
