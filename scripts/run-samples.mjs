#!/usr/bin/env node
// Execute extracted code samples (.samples/manifest.json, built by
// `npm run samples:extract`) with native toolchains and diff stdout+stderr
// against tests/samples/<id>.expected — byte-exact after trailing-newline
// normalization (all trailing \r\n stripped from both sides).
// Toolchains: python -> python3, js/javascript -> node, ts/typescript ->
// node --experimental-strip-types (skipped with a note if the host Node does
// not support it), rust -> rustc + run, go -> go run, c -> gcc + run,
// cpp/c++ -> g++ + run, java -> javac to a temp dir + java. Languages without
// a native runner toolchain (e.g. bash, sql) and absent toolchains report
// `skipped (no toolchain)` — never a failure.
// Samples run in a throwaway temp dir; per-sample timeout is 10 s.
// Usage: node scripts/run-samples.mjs   (exit 1 on any sample failure or missing manifest)

import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs'
import { spawn, spawnSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const TIMEOUT_MS = 10_000

function hasTool(name) {
  const r = spawnSync(process.platform === 'win32' ? 'where' : 'which', [name], { stdio: 'ignore' })
  return r.status === 0
}

// Run a command, capturing stdout+stderr; resolves with { code, output } or
// rejects with { timedOut: true } after `timeoutMs`.
function run(cmd, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] })
    let out = ''
    let settled = false
    const timer = setTimeout(() => {
      settled = true
      child.kill('SIGKILL')
      reject({ timedOut: true })
    }, TIMEOUT_MS)
    child.stdout.on('data', (d) => (out += d))
    child.stderr.on('data', (d) => (out += d))
    child.on('error', (e) => {
      if (!settled) {
        settled = true
        clearTimeout(timer)
        reject({ spawnError: e.message })
      }
    })
    child.on('close', (code) => {
      if (!settled) {
        settled = true
        clearTimeout(timer)
        resolve({ code, output: out })
      }
    })
  })
}

// Trailing-newline normalization for byte-exact comparison.
function normalize(s) {
  return s.replace(/[\r\n]+$/, '')
}

function firstDiff(a, b) {
  const n = Math.min(a.length, b.length)
  for (let i = 0; i < n; i++) if (a[i] !== b[i]) return i
  return a.length === b.length ? -1 : n
}

function snippet(s, max = 120) {
  const oneLine = s.replace(/\n/g, '\\n')
  return oneLine.length > max ? `${oneLine.slice(0, max)}…` : oneLine
}

// One runner per supported language; each receives the absolute sample path and
// a working (temp) dir, and resolves { code, output } or throws an Error with
// a human-readable reason.
async function execute(lang, file, workDir) {
  switch (lang) {
    case 'python':
      return run('python3', [file], workDir)
    case 'javascript':
    case 'js':
      return run('node', [file], workDir)
    case 'typescript':
    case 'ts': {
      if (!tsStripSupported()) throw new Error('no toolchain: host Node lacks --experimental-strip-types')
      return run('node', ['--experimental-strip-types', file], workDir)
    }
    case 'rust': {
      const bin = join(workDir, 'sample-bin')
      const c1 = await run('rustc', ['-o', bin, file], workDir)
      if (c1.code !== 0) return { code: c1.code, output: c1.output }
      return run(bin, [], workDir)
    }
    case 'go':
      return run('go', ['run', file], workDir)
    case 'c': {
      const bin = join(workDir, 'sample-bin')
      const c1 = await run('gcc', ['-o', bin, file], workDir)
      if (c1.code !== 0) return { code: c1.code, output: c1.output }
      return run(bin, [], workDir)
    }
    case 'cpp':
    case 'c++': {
      const bin = join(workDir, 'sample-bin')
      const c1 = await run('g++', ['-o', bin, file], workDir)
      if (c1.code !== 0) return { code: c1.code, output: c1.output }
      return run(bin, [], workDir)
    }
    case 'java': {
      const out = join(workDir, 'classes')
      mkdirSync(out, { recursive: true })
      const j1 = await run('javac', ['-d', out, file], workDir)
      if (j1.code !== 0) return { code: j1.code, output: j1.output }
      // Single-file samples: find the compiled class carrying a main method.
      const classes = readClassNames(out)
      let mainClass
      for (const name of classes) {
        const javap = await run('javap', ['-cp', out, name], workDir)
        if (javap.code === 0 && /static void main/.test(javap.output)) {
          mainClass = name
          break
        }
      }
      if (!mainClass) throw new Error(`no compiled class with a main method in ${classes.join(', ') || '(none)'}`)
      return run('java', ['-cp', out, mainClass], workDir)
    }
    default:
      throw new Error(`no toolchain for "${lang}" on this host`)
  }
}

function readClassNames(dir) {
  return readdirSync(dir)
    .filter((f) => f.endsWith('.class') && !f.includes('$'))
    .map((f) => f.replace(/\.class$/, ''))
    .sort()
}

let tsSupport
function tsStripSupported() {
  if (tsSupport === undefined) {
    const r = spawnSync(process.execPath, ['--experimental-strip-types', '-e', '0'], { stdio: 'ignore' })
    tsSupport = r.status === 0
  }
  return tsSupport
}

const TOOLCHECK = {
  python: () => hasTool('python3'),
  javascript: () => hasTool('node'),
  js: () => hasTool('node'),
  typescript: () => hasTool('node') && tsStripSupported(),
  ts: () => hasTool('node') && tsStripSupported(),
  rust: () => hasTool('rustc'),
  go: () => hasTool('go'),
  c: () => hasTool('gcc'),
  cpp: () => hasTool('g++'),
  'c++': () => hasTool('g++'),
  java: () => hasTool('javac') && hasTool('java')
}

async function main() {
  const root = process.cwd()
  const manifestPath = join(root, '.samples', 'manifest.json')
  if (!existsSync(manifestPath)) {
    console.error('run-samples.mjs: .samples/manifest.json not found — run `npm run samples:extract` first')
    process.exit(1)
  }
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
  const samples = Array.isArray(manifest.samples) ? manifest.samples : []
  if (!samples.length) {
    console.log('run-samples.mjs: 0 sample(s) in manifest — nothing to run')
    return
  }

  let passed = 0
  let failed = 0
  let skipped = 0

  for (const s of samples) {
    const file = join(root, '.samples', `${s.id}${s.ext}`)
    const expectedPath = join(root, 'tests', 'samples', `${s.id}.expected`)
    try {
      if (!existsSync(file)) throw new Error(`sample file .samples/${s.id}${s.ext} missing — run \`npm run samples:extract\``)
      if (!existsSync(expectedPath)) throw new Error(`missing expected output tests/samples/${s.id}.expected`)

      const toolCheck = TOOLCHECK[s.lang]
      if (!toolCheck || !toolCheck()) {
        skipped++
        console.log(`SKIP ${s.id} (${s.lang}): skipped (no toolchain)`)
        continue
      }

      const workDir = mkdtempSync(join(tmpdir(), `pt-sample-${s.id}-`))
      let result
      try {
        result = await execute(s.lang, file, workDir)
      } finally {
        rmSync(workDir, { recursive: true, force: true })
      }

      const expected = readFileSync(expectedPath, 'utf8')
      if (result.code !== 0) {
        failed++
        console.log(`FAIL ${s.id} (${s.lang}): exited with code ${result.code}${result.output ? ` — output: ${snippet(result.output)}` : ''}`)
        continue
      }
      const actual = result.output
      if (normalize(actual) === normalize(expected)) {
        passed++
        console.log(`PASS ${s.id} (${s.lang})`)
      } else {
        failed++
        const i = firstDiff(normalize(actual), normalize(expected))
        const at = i < 0 ? 'length' : `byte ${i}`
        console.log(
          `FAIL ${s.id} (${s.lang}): output mismatch at ${at} — expected ${JSON.stringify(snippet(normalize(expected)))}, got ${JSON.stringify(snippet(normalize(actual)))}`
        )
      }
    } catch (e) {
      if (e && e.timedOut) {
        failed++
        console.log(`FAIL ${s.id} (${s.lang}): timed out after ${TIMEOUT_MS / 1000}s`)
      } else if (e && e.spawnError) {
        skipped++
        console.log(`SKIP ${s.id} (${s.lang}): skipped (no toolchain — ${e.spawnError})`)
      } else {
        failed++
        console.log(`FAIL ${s.id} (${s.lang}): ${e.message}`)
      }
    }
  }

  console.log(`run-samples.mjs: ${passed} passed, ${failed} failed, ${skipped} skipped (${samples.length} total)`)
  if (failed > 0) process.exit(1)
}

main()
