#!/usr/bin/env node
// Extract runnable code samples from content sources into .samples/ (gitignored,
// rebuilt by CI) + a manifest for the sample-execution matrix.
// Convention: fenced blocks carry an info-string `sample=<id>` (e.g. ```python sample=py-001-hello).
// Output: .samples/<id>.<ext> and .samples/manifest.json
// Usage: node scripts/extract-samples.mjs   (exit 1 on malformed/duplicate sample ids)

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { join, relative } from 'node:path'

export const LANG_EXT = {
  python: '.py',
  javascript: '.js',
  js: '.js',
  typescript: '.ts',
  ts: '.ts',
  rust: '.rs',
  go: '.go',
  c: '.c',
  cpp: '.cpp',
  'c++': '.cpp',
  java: '.java',
  bash: '.sh',
  shell: '.sh',
  sh: '.sh',
  sql: '.sql'
}
export const SAMPLE_ID_RE = /^[a-z]{2,4}-\d{3}-[a-z0-9]+(?:-[a-z0-9]+)*$/

// Parse one content file's fenced blocks and collect its samples. Shared state is
// passed in so duplicate ids across files are detected: `seen` maps id -> source
// file, `errors` accumulates human-readable error strings (same format as before).
// Returns the extracted samples ({id, lang, source, ext, code}) for this file only;
// code is normalized to exactly one trailing newline.
export function extractSamplesFromContent(content, rel, seen, errors) {
  const out = []
  const fenceRe = /```([^\n]*)\n([\s\S]*?)```/g
  let m
  while ((m = fenceRe.exec(content))) {
    const info = m[1].trim()
    const sm = info.match(/sample=([\w-]+)/)
    if (!sm) continue
    const id = sm[1]
    const lang = info.split(/\s+/)[0]
    if (!SAMPLE_ID_RE.test(id)) {
      errors.push(`${rel}: sample id "${id}" does not match <prefix>-NNN-<name>`)
      continue
    }
    const ext = LANG_EXT[lang]
    if (!ext) {
      errors.push(`${rel}: sample "${id}" uses unsupported fence language "${lang}"`)
      continue
    }
    if (seen.has(id)) {
      errors.push(`sample id "${id}" defined in both ${seen.get(id)} and ${rel}`)
      continue
    }
    seen.set(id, rel)
    const code = m[2].replace(/\n$/, '') + '\n'
    out.push({ id, lang, source: rel, ext, code })
  }
  return out
}

function walk(dir, ext) {
  if (!existsSync(dir)) return []
  const out = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...walk(p, ext))
    else if (entry.name.endsWith(ext)) out.push(p)
  }
  return out
}

function main() {
  const root = process.cwd()
  const outDir = join(root, '.samples')

  mkdirSync(outDir, { recursive: true })
  const samples = []
  const errors = []
  const seen = new Map()

  for (const file of [
    ...walk(join(root, 'src/content/lessons'), '.mdx'),
    ...walk(join(root, 'src/content/languages'), '.mdx')
  ]) {
    const rel = relative(root, file).split('\\').join('/')
    const content = readFileSync(file, 'utf8')
    for (const s of extractSamplesFromContent(content, rel, seen, errors)) samples.push(s)
  }

  samples.sort((a, b) => a.id.localeCompare(b.id))
  for (const s of samples) writeFileSync(join(outDir, `${s.id}${s.ext}`), s.code)
  writeFileSync(
    join(outDir, 'manifest.json'),
    JSON.stringify(
      { generatedAt: new Date().toISOString(), samples: samples.map(({ id, lang, source, ext }) => ({ id, lang, source, ext })) },
      null,
      2
    ) + '\n'
  )

  console.log(`extract-samples.mjs: ${samples.length} sample(s) written to .samples/`)
  if (errors.length) {
    console.error(`\n${errors.length} error(s):`)
    for (const e of errors) console.error(`  - ${e}`)
    process.exit(1)
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main()
