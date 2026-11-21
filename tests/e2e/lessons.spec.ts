// Lesson routes + track hub: every published lesson renders with exactly one h1
// matching its title and shows its fixture-backed sample outputs; the track hub
// lists the full curriculum in order with the correct continue-CTA state.
import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadCurricula, lessonUrl, lessonSlugKey, type CurriculumLesson } from './curriculum'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '../..')

/** sampleIds frontmatter (single-line flow array or YAML block list) — the same
 *  field the lesson route maps to tests/samples/<id>.expected fixtures. */
function lessonSampleIds(lang: string, lesson: CurriculumLesson): string[] {
  const file = join(root, 'src/content/lessons', lang, `${lessonSlugKey(lesson)}.mdx`)
  const raw = readFileSync(file, 'utf8')
  const fm = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? ''
  const single = fm.match(/^sampleIds:\s*\[([^\]]*)\]/m)
  if (single) {
    return single[1].split(',').map((s) => s.trim().replace(/^['"`]|['"`]$/g, '')).filter(Boolean)
  }
  const multi = fm.match(/^sampleIds:\s*\n((?:[ \t]*-[ \t]*.+\n?)+)/m)
  if (multi) {
    return multi[1]
      .split('\n')
      .map((l) => l.replace(/^[ \t]*-[ \t]*/, '').trim().replace(/^['"`]|['"`]$/g, ''))
      .filter(Boolean)
  }
  return []
}

for (const curriculum of loadCurricula()) {
  const lang = curriculum.lang
  const published = curriculum.lessons.filter((l) => l.status === 'published')
  const allPublished = published.length === curriculum.lessons.length

  for (const lesson of published) {
    test(`lesson ${lessonUrl(lang, lesson)} renders with title and sample outputs`, async ({ page }) => {
      await page.goto(lessonUrl(lang, lesson))
      await expect(page.locator('main#main')).toBeVisible()

      // Exactly one h1 on the page, matching the curriculum/curriculum frontmatter title.
      const h1 = page.locator('h1')
      await expect(h1).toHaveCount(1)
      await expect(h1.first()).toHaveText(String(lesson.title))

      // Every frontmatter sampleId renders a fixture-backed CodeBlock whose
      // content matches the committed tests/samples/<id>.expected output.
      for (const id of lessonSampleIds(lang, lesson)) {
        const figure = page.locator(`[data-codeblock][data-sample="${id}"]`)
        await expect(figure).toBeVisible()
        const fixture = readFileSync(join(root, 'tests/samples', `${id}.expected`), 'utf8')
        const firstLine = fixture.split('\n').map((l) => l.trim()).find(Boolean)
        if (firstLine) {
          await expect(figure).toContainText(firstLine)
        }
      }
    })
  }

  test(`track hub learn/${lang}/ lists the curriculum in order with the correct CTA`, async ({ page }) => {
    await page.goto(`learn/${lang}/`)
    const h1 = page.locator('h1')
    await expect(h1).toHaveCount(1)

    // One item per curriculum lesson, published or not, in curriculum order.
    const items = page.locator('[data-lesson-link], [data-lesson-pending]')
    await expect(items).toHaveCount(curriculum.lessons.length)
    const slugs = await items.evaluateAll((els) => els.map((el) => el.dataset.lessonLink ?? el.dataset.lessonPending))
    expect(slugs).toEqual([...curriculum.lessons].sort((a, b) => a.order - b.order).map(lessonSlugKey))

    // Published lessons link to their routes; unpublished ones are "coming soon".
    for (const lesson of curriculum.lessons) {
      const key = lessonSlugKey(lesson)
      if (lesson.status === 'published') {
        await expect(page.locator(`[data-lesson-link="${key}"]`)).toBeVisible()
      } else {
        await expect(page.locator(`[data-lesson-pending="${key}"]`)).toBeVisible()
      }
    }

    // Continue CTA: lowest-order unpublished lesson, or the track-complete state
    // (label + first-lesson link) when every lesson is published.
    const cta = page.locator('[data-continue-link]')
    await expect(cta).toBeVisible()
    if (allPublished) {
      await expect(cta).toHaveText(/Track complete/)
      const first = [...curriculum.lessons].sort((a, b) => a.order - b.order)[0]
      await expect(cta).toHaveAttribute('href', new RegExp(`learn/${lang}/${lessonSlugKey(first)}/$`))
    } else {
      await expect(cta).toHaveText(/Continue learning/)
    }
  })
}
