#!/usr/bin/env node
// Terminal summary of pipeline state, read from the same committed files that
// /dashboard renders at build time.
// Usage: node scripts/dashboard.mjs   (exit 1 if state files are missing/invalid)

import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const tasksFile = join(root, 'data/pipeline/tasks.json')
const activityFile = join(root, 'data/pipeline/activity.jsonl')

if (!existsSync(tasksFile)) {
  console.error('dashboard.mjs: data/pipeline/tasks.json not found')
  process.exit(1)
}

let tasks
try {
  tasks = JSON.parse(readFileSync(tasksFile, 'utf8')).tasks
} catch (e) {
  console.error(`dashboard.mjs: invalid tasks.json (${e.message})`)
  process.exit(1)
}

const counts = {}
for (const t of tasks) counts[t.status] = (counts[t.status] ?? 0) + 1

console.log('Pipeline dashboard')
console.log('==================')
console.log(`Tasks: ${tasks.length} total — ` + Object.entries(counts).map(([s, n]) => `${n} ${s}`).join(', '))
console.log('')
const pad = (s, n) => String(s).padEnd(n)
console.log(pad('ID', 7) + pad('STATUS', 13) + pad('TYPE', 14) + pad('LANG', 8) + 'TITLE')
for (const t of tasks) {
  console.log(
    pad(t.id, 7) +
      pad(t.status, 13) +
      pad(t.type, 14) +
      pad(t.lang ?? '-', 8) +
      t.title
  )
}

if (existsSync(activityFile)) {
  const lines = readFileSync(activityFile, 'utf8')
    .split('\n')
    .filter(Boolean)
    .slice(-10)
    .map((l) => {
      try {
        const e = JSON.parse(l)
        return `${e.ts}  ${String(e.taskId ?? '-').padEnd(6)}  ${e.kind.padEnd(9)}  ${e.note}`
      } catch {
        return `(unparseable activity line)`
      }
    })
  console.log('')
  console.log('Recent activity (last 10):')
  for (const l of lines) console.log(`  ${l}`)
}
