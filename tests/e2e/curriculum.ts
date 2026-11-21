// Shared curriculum loader for e2e specs — reads the same committed
// data/curriculum/*.json the build renders from, so specs and routes can never
// drift apart.
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))

export interface CurriculumLesson {
  order: number
  tier: string
  slug: string
  title?: string
  status?: string
}

export interface Curriculum {
  lang: string
  title?: string
  lessons: CurriculumLesson[]
}

export function loadCurricula(): Curriculum[] {
  return readdirSync(join(here, '../../data/curriculum'))
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(readFileSync(join(here, `../../data/curriculum/${f}`), 'utf8')))
    .filter((c: Curriculum) => Array.isArray(c.lessons) && c.lessons.length > 0)
}

/** Lesson URL convention /learn/<lang>/<tier>/<NN>-<slug>/ (docs/content-conventions.md). */
export function lessonUrl(lang: string, lesson: CurriculumLesson): string {
  return `learn/${lang}/${lesson.tier}/${String(lesson.order).padStart(2, '0')}-${lesson.slug}/`
}

/** Full slug key used by the track hub + progress store ("beginner/01-python-setup"). */
export function lessonSlugKey(lesson: CurriculumLesson): string {
  return `${lesson.tier}/${String(lesson.order).padStart(2, '0')}-${lesson.slug}`
}
