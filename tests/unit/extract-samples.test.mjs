import { describe, expect, it } from 'vitest'
import { extractSamplesFromContent, SAMPLE_ID_RE } from '../../scripts/extract-samples.mjs'

const FILE_A = 'src/content/lessons/python/beginner/01-hello.mdx'
const FILE_B = 'src/content/languages/python.mdx'

function extract(content, rel = FILE_A) {
  const seen = new Map()
  const errors = []
  return { samples: extractSamplesFromContent(content, rel, seen, errors), errors, seen }
}

describe('SAMPLE_ID_RE', () => {
  it('accepts well-formed ids', () => {
    expect(SAMPLE_ID_RE.test('py-001-hello')).toBe(true)
    expect(SAMPLE_ID_RE.test('js-042-closures')).toBe(true)
    expect(SAMPLE_ID_RE.test('cpp-010-vector-init')).toBe(true)
  })

  it('rejects malformed ids', () => {
    expect(SAMPLE_ID_RE.test('p-001-x')).toBe(false) // prefix too short
    expect(SAMPLE_ID_RE.test('python-001-x')).toBe(false) // prefix too long
    expect(SAMPLE_ID_RE.test('py-1-hello')).toBe(false) // not zero-padded to 3 digits
    expect(SAMPLE_ID_RE.test('py_001_hello')).toBe(false) // underscores are not separators
  })
})

describe('fence info-string parsing', () => {
  it('accepts extra tokens before and after sample=', () => {
    const { samples, errors } = extract('```python foo=bar sample=py-001-hello baz\nprint(1)\n```\n')
    expect(errors).toEqual([])
    expect(samples).toHaveLength(1)
    expect(samples[0].id).toBe('py-001-hello')
    expect(samples[0].lang).toBe('python')
  })

  it('ignores fences without a sample token', () => {
    const { samples } = extract('```python\nprint(1)\n```\n')
    expect(samples).toEqual([])
  })

  it('rejects invalid id shapes with an actionable error', () => {
    const { samples, errors } = extract('```python sample=PY_001_HELLO\nprint(1)\n```\n')
    expect(samples).toEqual([])
    expect(errors).toHaveLength(1)
    expect(errors[0]).toContain(`${FILE_A}: sample id "PY_001_HELLO" does not match <prefix>-NNN-<name>`)
  })

  it('flags duplicate ids across two files', () => {
    const seen = new Map()
    const errors = []
    const first = extractSamplesFromContent('```python sample=py-001-hello\nprint(1)\n```\n', FILE_A, seen, errors)
    expect(first).toHaveLength(1)
    const second = extractSamplesFromContent('```python sample=py-001-hello\nprint(2)\n```\n', FILE_B, seen, errors)
    expect(second).toEqual([])
    expect(errors).toHaveLength(1)
    expect(errors[0]).toBe(`sample id "py-001-hello" defined in both ${FILE_A} and ${FILE_B}`)
  })

  it('rejects unsupported fence languages', () => {
    const { samples, errors } = extract('```matlab sample=ml-001-hello\ndisp(1)\n```\n')
    expect(samples).toEqual([])
    expect(errors).toHaveLength(1)
    expect(errors[0]).toContain(`uses unsupported fence language "matlab"`)
  })
})

describe('extracted code normalization', () => {
  it('keeps exactly one trailing newline when the body has one', () => {
    const { samples } = extract('```python sample=py-001-hello\nprint(1)\n```\n')
    expect(samples[0].code).toBe('print(1)\n')
  })

  it('adds a trailing newline when the body has none', () => {
    const { samples } = extract('```python sample=py-002-vars\nx = 1```\n')
    expect(samples[0].code).toBe('x = 1\n')
  })

  it('preserves interior blank lines and indentation', () => {
    const { samples } = extract('```python sample=py-003-func\ndef f():\n    return 1\n```\n')
    expect(samples[0].code).toBe('def f():\n    return 1\n')
  })
})
