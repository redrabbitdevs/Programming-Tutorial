#!/usr/bin/env node
// Map changed files in a git range to the page URLs they affect (for QA & A11y's
// per-PR audit scope). Shared infrastructure affects every page and prints ALL.
// Usage: node scripts/changed-pages.mjs [range]   (default: origin/main...HEAD)
// Output: one URL path per line, or the single token ALL.

import { execFileSync } from 'node:child_process'
import { join, relative } from 'node:path'

const root = process.cwd()
const range = process.argv[2] ?? 'origin/main...HEAD'

let files
try {
  files = execFileSync('git', ['diff', '--name-only', range], {
    cwd: root,
    encoding: 'utf8'
  })
    .split('\n')
    .filter(Boolean)
} catch (e) {
  console.error(`changed-pages.mjs: git diff failed for range "${range}" (${e.message})`)
  process.exit(1)
}

const SHARED = [
  /^src\/components\//,
  /^src\/layouts\//,
  /^src\/styles\//,
  /^src\/scripts-islands\//,
  /^package\.json$/,
  /^astro\.config\.mjs$/
]
if (files.some((f) => SHARED.some((re) => re.test(f)))) {
  console.log('ALL')
  process.exit(0)
}

// src/pages path -> URL path (index -> directory, dynamic segments kept)
function routePath(rel) {
  let p = relative(join(root, 'src/pages'), rel).split('\\').join('/')
  if (p.endsWith('.astro') || p.endsWith('.mdx')) p = p.slice(0, -5)
  if (p === 'index' || p.endsWith('/index')) p = p.replace(/\/?index$/, '')
  return '/' + p
}

const urls = new Set()
for (const f of files) {
  if (f.startsWith('src/pages/')) {
    urls.add(routePath(f).replace(/\/$/, ''))
  } else if (/^src\/content\/lessons\/[^/]+\/(beginner|intermediate|advanced)\/\d{2}-.+\.mdx$/.test(f)) {
    const parts = f.split('/')
    urls.add(`/learn/${parts[3]}/${parts[4]}/${parts[5].replace(/\.mdx$/, '')}`.replace(/\/$/, ''))
  } else if (/^src\/content\/languages\/.+\.mdx$/.test(f)) {
    urls.add('/languages/' + f.split('/')[3].replace(/\.mdx$/, ''))
  } else if (f.startsWith('data/curriculum/') || f.startsWith('data/languages/')) {
    // data feeds the home page, /languages/ index and track hubs — treat as shared
    console.log('ALL')
    process.exit(0)
  }
}

if (!urls.size) {
  console.log('(no page-affecting changes)')
  process.exit(0)
}
for (const u of [...urls].sort()) console.log(u)
