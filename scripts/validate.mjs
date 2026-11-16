#!/usr/bin/env node
// Content validation for the Programming-Tutorial site.
// Phase 0: core checks — frontmatter completeness, fence language tags, sample id
// registration/uniqueness, word-count bounds, no TODO/FIXME, --strict status gate.
// Phases 2–3 extend this (curriculum ↔ content consistency, data/languages records).
// Usage: node scripts/validate.mjs [--strict]   (--strict: every entry must be status: published)

import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import matter from 'gray-matter'

const root = process.cwd()
const strict = process.argv.includes('--strict')
const errors = []

function walk(dir) {
  if (!existsSync(dir)) return []
  const out = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...walk(p))
    else if (entry.name.endsWith('.mdx')) out.push(p)
  }
  return out
}

const LESSON_FIELDS = [
  'lang',
  'tier',
  'title',
  'description',
  'order',
  'prerequisites',
  'estimatedMinutes',
  'status',
  'sampleIds'
]
const TIERS = ['beginner', 'intermediate', 'advanced']
const STATUSES = ['draft', 'review', 'published']
const WORD_BOUNDS = { lesson: [300, 2000], encyclopedia: [150, 600] }

function bodyWords(body) {
  const prose = body.replace(/```[\s\S]*?```/g, ' ')
  return prose.split(/\s+/).filter(Boolean).length
}

const sampleIds = new Map()
let fileCount = 0

for (const base of ['src/content/lessons', 'src/content/languages']) {
  for (const file of walk(join(root, base))) {
    fileCount++
    const rel = relative(root, file).split('\\').join('/')
    const kind = base.includes('lessons') ? 'lesson' : 'encyclopedia'
    let data
    try {
      data = matter(readFileSync(file, 'utf8'))
    } catch (e) {
      errors.push(`${rel}: unparseable frontmatter (${e.message})`)
      continue
    }
    const fm = data.data || {}
    if (!fm.title) errors.push(`${rel}: missing frontmatter field "title"`)
    if (kind === 'lesson') {
      for (const f of LESSON_FIELDS) {
        if (!(f in fm)) errors.push(`${rel}: missing frontmatter field "${f}"`)
      }
      if (fm.tier && !TIERS.includes(fm.tier)) {
        errors.push(`${rel}: tier must be one of ${TIERS.join(' | ')}`)
      }
    }
    if (fm.status !== undefined && !STATUSES.includes(fm.status)) {
      errors.push(`${rel}: status must be one of ${STATUSES.join(' | ')}`)
    }
    if (strict && fm.status !== 'published') {
      errors.push(
        `${rel}: --strict requires status: published (got ${fm.status ?? 'none'})`
      )
    }
    const [min, max] = WORD_BOUNDS[kind]
    const words = bodyWords(data.content)
    if (words < min || words > max) {
      errors.push(`${rel}: ${words} prose words outside ${min}–${max}`)
    }
    const fenceRe = /```([^\n]*)\n/g
    let m
    while ((m = fenceRe.exec(data.content))) {
      const info = m[1].trim()
      if (!info) errors.push(`${rel}: code fence without a language tag`)
      const sm = info.match(/sample=([\w-]+)/)
      if (sm) {
        const id = sm[1]
        if (!sampleIds.has(id)) sampleIds.set(id, [])
        sampleIds.get(id).push(rel)
        if (!existsSync(join(root, 'tests/samples', `${id}.expected`))) {
          errors.push(
            `${rel}: sample "${id}" has no tests/samples/${id}.expected`
          )
        }
      }
    }
    if (/TODO|FIXME/.test(data.content)) {
      errors.push(`${rel}: contains TODO/FIXME`)
    }
  }
}

for (const [id, locs] of sampleIds) {
  if (locs.length > 1) {
    errors.push(`sample id "${id}" used in multiple files: ${locs.join(', ')}`)
  }
}

console.log(
  `validate.mjs: ${fileCount} content file(s), ${sampleIds.size} sample id(s), mode ${strict ? 'strict' : 'normal'}`
)
if (errors.length) {
  console.error(`\n${errors.length} error(s):`)
  for (const e of errors) console.error(`  - ${e}`)
  process.exit(1)
}
console.log('OK')
