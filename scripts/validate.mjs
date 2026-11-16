#!/usr/bin/env node
// Content validation for the Programming-Tutorial site.
// Checks: frontmatter completeness, fence language tags, sample id format +
// registration/uniqueness, word-count bounds, no TODO/FIXME, --strict status gate,
// curriculum <-> content consistency (data/curriculum/*.json), data/languages
// record schema + page<->record consistency, internal link resolution.
// Usage: node scripts/validate.mjs [--strict]   (--strict: every entry must be status: published)

import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, relative, basename } from 'node:path'
import matter from 'gray-matter'

const root = process.cwd()
const strict = process.argv.includes('--strict')
const BASE = '/Programming-Tutorial/'
const errors = []

function walk(dir, ext = '.mdx') {
  if (!existsSync(dir)) return []
  const out = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...walk(p, ext))
    else if (entry.name.endsWith(ext)) out.push(p)
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
const CURRICULUM_STATUSES = ['planned', 'published']
const LANG_RECORD_STATUSES = ['active', 'legacy', 'historical']
const PAGE_STATUSES = ['planned', 'written', 'published']
const WORD_BOUNDS = { lesson: [300, 2000], encyclopedia: [150, 600] }
const KEBAB_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const SAMPLE_ID_RE = /^[a-z]{2,4}-\d{3}-[a-z0-9]+(?:-[a-z0-9]+)*$/

function bodyWords(body) {
  const prose = body.replace(/```[\s\S]*?```/g, ' ')
  return prose.split(/\s+/).filter(Boolean).length
}

// ---------------------------------------------------------------- content files
const sampleIds = new Map()
let fileCount = 0
const lessonFiles = [] // { rel, lang, tier, order, slug, status }
const languagePages = new Set()

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
    const parts = rel.split('/')
    if (kind === 'lesson') {
      for (const f of LESSON_FIELDS) {
        if (!(f in fm)) errors.push(`${rel}: missing frontmatter field "${f}"`)
      }
      if (fm.tier && !TIERS.includes(fm.tier)) {
        errors.push(`${rel}: tier must be one of ${TIERS.join(' | ')}`)
      }
      // filename convention: src/content/lessons/<lang>/<tier>/<NN>-<slug>.mdx
      if (parts.length !== 6 || !parts[3] || !TIERS.includes(parts[4])) {
        errors.push(
          `${rel}: lesson path must be src/content/lessons/<lang>/<tier>/<NN>-<slug>.mdx`
        )
      } else {
        const m = parts[5].match(/^(\d{2})-(.+)\.mdx$/)
        if (!m) {
          errors.push(`${rel}: lesson filename must be <NN>-<slug>.mdx (zero-padded order)`)
        } else {
          lessonFiles.push({
            rel,
            lang: parts[3],
            tier: parts[4],
            order: Number(m[1]),
            slug: m[2],
            status: fm.status
          })
          if (fm.order !== undefined && fm.order !== Number(m[1])) {
            errors.push(`${rel}: frontmatter order (${fm.order}) does not match filename (${m[1]})`)
          }
        }
      }
    } else {
      const slug = parts[parts.length - 1].replace(/\.mdx$/, '')
      languagePages.add(slug)
    }
    if (fm.status !== undefined && !STATUSES.includes(fm.status)) {
      errors.push(`${rel}: status must be one of ${STATUSES.join(' | ')}`)
    }
    if (kind === 'encyclopedia' && fm.languageStatus !== undefined && !LANG_RECORD_STATUSES.includes(fm.languageStatus)) {
      errors.push(`${rel}: languageStatus must be one of ${LANG_RECORD_STATUSES.join(' | ')}`)
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
    const fenceRe = /```([^\n]*)\n([\s\S]*?)```/g
    let m
    while ((m = fenceRe.exec(data.content))) {
      const info = m[1].trim()
      if (!info) errors.push(`${rel}: code fence without a language tag`)
      const sm = info.match(/sample=([\w-]+)/)
      if (sm) {
        const id = sm[1]
        if (!SAMPLE_ID_RE.test(id)) {
          errors.push(`${rel}: sample id "${id}" does not match <prefix>-NNN-<name>`)
        }
        if (!sampleIds.has(id)) sampleIds.set(id, [])
        sampleIds.get(id).push(rel)
        if (!existsSync(join(root, 'tests/samples', `${id}.expected`))) {
          errors.push(`${rel}: sample "${id}" has no tests/samples/${id}.expected`)
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

// ---------------------------------------------------------------- curriculum <-> content
function loadCurriculum(file) {
  const rel = relative(root, file).split('\\').join('/')
  let raw
  try {
    raw = JSON.parse(readFileSync(file, 'utf8'))
  } catch (e) {
    errors.push(`${rel}: invalid JSON (${e.message})`)
    return null
  }
  const slug = basename(file).replace(/\.json$/, '')
  if (raw.lang !== slug) {
    errors.push(`${rel}: "lang" field (${raw.lang ?? 'missing'}) does not match filename (${slug})`)
  }
  if (!Array.isArray(raw.lessons) || raw.lessons.length === 0) {
    errors.push(`${rel}: "lessons" must be a non-empty array`)
    return null
  }
  const seenOrders = new Map()
  const slugs = new Set()
  for (const entry of raw.lessons) {
    if (!Number.isInteger(entry.order) || entry.order < 1) {
      errors.push(`${rel}: lesson "${entry.slug ?? '?'}" has invalid order ${entry.order}`)
    } else if (seenOrders.has(entry.order)) {
      errors.push(`${rel}: duplicate order ${entry.order} ("${entry.slug}" / "${seenOrders.get(entry.order)}")`)
    } else {
      seenOrders.set(entry.order, entry.slug)
    }
    if (!KEBAB_RE.test(entry.slug ?? '')) {
      errors.push(`${rel}: slug "${entry.slug}" must be kebab-case`)
    }
    slugs.add(entry.slug)
    if (entry.tier && !TIERS.includes(entry.tier)) {
      errors.push(`${rel}: lesson "${entry.slug}" tier must be one of ${TIERS.join(' | ')}`)
    }
    if (entry.status !== undefined && !CURRICULUM_STATUSES.includes(entry.status)) {
      errors.push(`${rel}: lesson "${entry.slug}" status must be one of ${CURRICULUM_STATUSES.join(' | ')}`)
    }
    if (!Array.isArray(entry.prerequisites)) {
      errors.push(`${rel}: lesson "${entry.slug}" prerequisites must be an array`)
    } else {
      for (const p of entry.prerequisites) {
        if (p === entry.slug) errors.push(`${rel}: lesson "${entry.slug}" lists itself as a prerequisite`)
        else if (!slugs.has(p)) errors.push(`${rel}: prerequisite "${p}" of "${entry.slug}" is not in the curriculum`)
      }
    }
  }
  // prerequisite DAG: reject cycles (Kahn's algorithm)
  const indeg = new Map([...slugs].map((s) => [s, 0]))
  const adj = new Map([...slugs].map((s) => [s, []]))
  for (const entry of raw.lessons) {
    for (const p of entry.prerequisites ?? []) {
      if (adj.has(p)) {
        adj.get(p).push(entry.slug)
        indeg.set(entry.slug, (indeg.get(entry.slug) ?? 0) + 1)
      }
    }
  }
  const queue = [...indeg].filter(([, d]) => d === 0).map(([s]) => s)
  let visited = 0
  while (queue.length) {
    const s = queue.shift()
    visited++
    for (const t of adj.get(s)) {
      indeg.set(t, indeg.get(t) - 1)
      if (indeg.get(t) === 0) queue.push(t)
    }
  }
  if (visited < slugs.size) errors.push(`${rel}: prerequisite graph contains a cycle`)
  return raw
}

const curricula = new Map() // lang -> entries
for (const file of walk(join(root, 'data/curriculum'), '.json')) {
  const raw = loadCurriculum(file)
  if (raw) curricula.set(basename(file).replace(/\.json$/, ''), raw.lessons)
}

// content ⊆ curriculum: every lesson file must appear in its language's curriculum
for (const lf of lessonFiles) {
  const entries = curricula.get(lf.lang)
  if (!entries) {
    errors.push(`${lf.rel}: no data/curriculum/${lf.lang}.json found`)
    continue
  }
  const entry = entries.find(
    (e) => e.order === lf.order && e.tier === lf.tier && e.slug === lf.slug
  )
  if (!entry) {
    errors.push(
      `${lf.rel}: not in data/curriculum/${lf.lang}.json (order ${lf.order}, tier ${lf.tier}, slug ${lf.slug})`
    )
  } else if (entry.status === 'published' && lf.status !== 'published') {
    errors.push(`${lf.rel}: curriculum marks it published but lesson status is ${lf.status}`)
  }
}

// strict: every published curriculum entry must have a lesson file
if (strict) {
  for (const [lang, entries] of curricula) {
    for (const e of entries) {
      if (e.status !== 'published') continue
      const expected = join(root, 'src/content/lessons', lang, e.tier, `${String(e.order).padStart(2, '0')}-${e.slug}.mdx`)
      if (!existsSync(expected)) {
        errors.push(`data/curriculum/${lang}.json: entry ${e.order} "${e.slug}" is published but has no lesson file`)
      }
    }
  }
}

// ---------------------------------------------------------------- data/languages records
function loadLanguageRecord(file) {
  const rel = relative(root, file).split('\\').join('/')
  const slug = basename(file).replace(/\.json$/, '')
  if (!KEBAB_RE.test(slug)) {
    errors.push(`${rel}: filename slug must be kebab-case`)
  }
  let raw
  try {
    raw = JSON.parse(readFileSync(file, 'utf8'))
  } catch (e) {
    errors.push(`${rel}: invalid JSON (${e.message})`)
    return null
  }
  const req = { name: 'string', aliases: 'array', paradigms: 'array', year: 'number' }
  for (const [f, t] of Object.entries(req)) {
    const ok = t === 'array' ? Array.isArray(raw[f]) : typeof raw[f] === t
    if (!ok) errors.push(`${rel}: missing or invalid field "${f}" (expected ${t})`)
  }
  if (!LANG_RECORD_STATUSES.includes(raw.status)) {
    errors.push(`${rel}: status must be one of ${LANG_RECORD_STATUSES.join(' | ')}`)
  }
  if (!raw.helloWorld || typeof raw.helloWorld.lang !== 'string' || typeof raw.helloWorld.code !== 'string') {
    errors.push(`${rel}: helloWorld must be {lang: string, code: string}`)
  }
  if (!PAGE_STATUSES.includes(raw.pageStatus)) {
    errors.push(`${rel}: pageStatus must be one of ${PAGE_STATUSES.join(' | ')}`)
  }
  if (raw.tiobeRank !== undefined && (!Number.isInteger(raw.tiobeRank) || raw.tiobeRank < 1)) {
    errors.push(`${rel}: tiobeRank must be a positive integer`)
  }
  if (raw.trackSlug !== undefined) {
    if (!KEBAB_RE.test(raw.trackSlug)) errors.push(`${rel}: trackSlug must be kebab-case`)
    else if (!existsSync(join(root, 'data/curriculum', `${raw.trackSlug}.json`))) {
      errors.push(`${rel}: trackSlug "${raw.trackSlug}" has no data/curriculum/${raw.trackSlug}.json`)
    }
  }
  return raw
}

const languageRecords = new Map() // slug -> record
for (const file of walk(join(root, 'data/languages'), '.json')) {
  const raw = loadLanguageRecord(file)
  if (raw) languageRecords.set(basename(file).replace(/\.json$/, ''), raw)
}

// page <-> record consistency
for (const slug of languagePages) {
  if (!languageRecords.has(slug)) {
    errors.push(`src/content/languages/${slug}.mdx: no matching data/languages/${slug}.json`)
  }
}
for (const [slug, rec] of languageRecords) {
  if ((rec.pageStatus === 'written' || rec.pageStatus === 'published') && !languagePages.has(slug)) {
    errors.push(`data/languages/${slug}.json: pageStatus is ${rec.pageStatus} but no src/content/languages/${slug}.mdx exists`)
  }
}

// ---------------------------------------------------------------- internal links
function routePath(file) {
  // src/pages path -> URL path (index -> directory, dynamic segments kept)
  let p = relative(join(root, 'src/pages'), file).split('\\').join('/')
  if (p.endsWith('.astro') || p.endsWith('.mdx')) p = p.slice(0, -5)
  if (p === 'index' || p.endsWith('/index')) p = p.replace(/\/?index$/, '')
  return '/' + p
}

const pageRoutes = walk(join(root, 'src/pages'), '.astro').map(routePath)
for (const f of walk(join(root, 'src/pages'), '.mdx')) pageRoutes.push(routePath(f))
// content-collection URLs that will exist once their routes ship
for (const lf of lessonFiles) {
  pageRoutes.push(`/learn/${lf.lang}/${lf.tier}/${String(lf.order).padStart(2, '0')}-${lf.slug}`)
}
for (const slug of languagePages) pageRoutes.push(`/languages/${slug}`)
// public/ static files
for (const f of walk(join(root, 'public'))) {
  pageRoutes.push('/' + relative(join(root, 'public'), f).split('\\').join('/'))
}

function normalizeUrl(u) {
  let p = u.split('#')[0].split('?')[0]
  if (p.startsWith(BASE)) p = p.slice(BASE.length - 1)
  if (!p.startsWith('/')) p = '/' + p
  if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1)
  return p
}

function matchesRoute(p, route) {
  const ps = p.split('/').filter(Boolean)
  const rs = route.split('/').filter(Boolean)
  if (ps.length !== rs.length) return false
  return rs.every((seg, i) => {
    if (seg.startsWith('[[') && seg.endsWith(']]')) return true // optional segment
    if (seg.startsWith('[')) return true // dynamic segment
    return seg === ps[i]
  })
}

function linkResolves(rawTarget) {
  const p = normalizeUrl(rawTarget)
  if (p === '/') return true
  if (pageRoutes.some((r) => r === p || matchesRoute(p, r))) return true
  // allow links to a page's directory even without trailing slash already handled above
  return false
}

const LINK_RE = /(?:href="([^"]+)"|\]\(([^)\s]+)(?:\s+"[^"]*")?\))/g
for (const base of ['src/content/lessons', 'src/content/languages']) {
  for (const file of walk(join(root, base))) {
    const rel = relative(root, file).split('\\').join('/')
    const content = readFileSync(file, 'utf8')
    let m
    while ((m = LINK_RE.exec(content))) {
      const target = m[1] ?? m[2]
      if (!target) continue
      if (/^(https?:)?\/\//.test(target) && !target.includes('redrabbitdevs.github.io')) continue
      if (/^(mailto:|tel:|data:|#)/.test(target)) continue
      if (!linkResolves(target)) {
        errors.push(`${rel}: internal link "${target}" does not resolve to a known route`)
      }
    }
  }
}

// ---------------------------------------------------------------- report
console.log(
  `validate.mjs: ${fileCount} content file(s), ${sampleIds.size} sample id(s), ` +
    `${curricula.size} curriculum(s), ${languageRecords.size} language record(s), mode ${strict ? 'strict' : 'normal'}`
)
if (errors.length) {
  console.error(`\n${errors.length} error(s):`)
  for (const e of errors) console.error(`  - ${e}`)
  process.exit(1)
}
console.log('OK')
