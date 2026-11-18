#!/usr/bin/env node
// Map changed files in a git range to the page URLs they affect (for QA & A11y's
// per-PR audit scope). Shared infrastructure affects every page and prints ALL.
// Usage: node scripts/changed-pages.mjs [range]   (default: origin/main...HEAD)
// Output: one URL path per line, or the single token ALL.

import { execFileSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'
import { relative } from 'node:path'

export const SHARED_PATTERNS = [
  /^src\/components\//,
  /^src\/layouts\//,
  /^src\/styles\//,
  /^src\/scripts-islands\//,
  /^package\.json$/,
  /^astro\.config\.mjs$/
]
export const LESSON_FILE_RE = /^src\/content\/lessons\/[^/]+\/(beginner|intermediate|advanced)\/\d{2}-.+\.mdx$/
export const LANGUAGE_PAGE_RE = /^src\/content\/languages\/.+\.mdx$/

export function isSharedFile(rel) {
  return SHARED_PATTERNS.some((re) => re.test(rel))
}

// src/pages path -> URL path (index -> directory, dynamic segments kept).
// `rel` is a repo-root-relative POSIX path under src/pages/.
export function routePath(rel) {
  let p = relative('src/pages', rel).split('\\').join('/')
  if (p.endsWith('.astro') || p.endsWith('.mdx')) p = p.replace(/\.(astro|mdx)$/, '')
  if (p === 'index' || p.endsWith('/index')) p = p.replace(/\/?index$/, '')
  return '/' + p
}

// Map repo-root-relative changed file paths to affected URL paths.
// Returns { all: true } when any change affects every page (shared infra or the
// data feeds that drive home / languages index / track hubs), otherwise
// { all: false, urls: [...] } sorted and deduplicated (home maps to '').
export function mapChangedFiles(files) {
  if (files.some(isSharedFile)) return { all: true, urls: [] }
  const urls = new Set()
  let all = false
  for (const f of files) {
    if (f.startsWith('src/pages/')) {
      urls.add(routePath(f).replace(/\/$/, ''))
    } else if (LESSON_FILE_RE.test(f)) {
      const parts = f.split('/')
      urls.add(`/learn/${parts[3]}/${parts[4]}/${parts[5].replace(/\.mdx$/, '')}`.replace(/\/$/, ''))
    } else if (LANGUAGE_PAGE_RE.test(f)) {
      urls.add('/languages/' + f.split('/')[3].replace(/\.mdx$/, ''))
    } else if (f.startsWith('data/curriculum/') || f.startsWith('data/languages/')) {
      // data feeds the home page, /languages/ index and track hubs — treat as shared
      all = true
      break
    }
  }
  return { all, urls: [...urls].sort() }
}

export function getChangedFiles(range, cwd = process.cwd()) {
  return execFileSync('git', ['diff', '--name-only', range], { cwd, encoding: 'utf8' })
    .split('\n')
    .filter(Boolean)
}

function main() {
  const range = process.argv[2] ?? 'origin/main...HEAD'
  let files
  try {
    files = getChangedFiles(range)
  } catch (e) {
    console.error(`changed-pages.mjs: git diff failed for range "${range}" (${e.message})`)
    process.exit(1)
  }
  const { all, urls } = mapChangedFiles(files)
  if (all) {
    console.log('ALL')
  } else if (!urls.length) {
    console.log('(no page-affecting changes)')
  } else {
    for (const u of urls) console.log(u)
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main()
