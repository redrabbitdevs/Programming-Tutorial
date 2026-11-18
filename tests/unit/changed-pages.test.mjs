import { describe, expect, it } from 'vitest'
import { isSharedFile, mapChangedFiles, routePath } from '../../scripts/changed-pages.mjs'

describe('routePath', () => {
  it('maps index to the directory root', () => {
    expect(routePath('src/pages/index.astro')).toBe('/')
  })

  it('maps nested pages to their URL path', () => {
    expect(routePath('src/pages/docs/design-system.astro')).toBe('/docs/design-system')
    expect(routePath('src/pages/dashboard.astro')).toBe('/dashboard')
  })

  it('strips .mdx and keeps dynamic segments', () => {
    expect(routePath('src/pages/languages/[slug].mdx')).toBe('/languages/[slug]')
  })
})

describe('isSharedFile', () => {
  it('flags shared infrastructure files', () => {
    expect(isSharedFile('src/components/Header.astro')).toBe(true)
    expect(isSharedFile('src/layouts/Base.astro')).toBe(true)
    expect(isSharedFile('src/styles/global.css')).toBe(true)
    expect(isSharedFile('src/scripts-islands/theme.js')).toBe(true)
    expect(isSharedFile('package.json')).toBe(true)
    expect(isSharedFile('astro.config.mjs')).toBe(true)
  })

  it('ignores content and docs files', () => {
    expect(isSharedFile('src/content/lessons/python/beginner/01-hello.mdx')).toBe(false)
    expect(isSharedFile('docs/content-conventions.md')).toBe(false)
  })
})

describe('mapChangedFiles', () => {
  it('returns ALL for shared infrastructure changes', () => {
    expect(mapChangedFiles(['src/components/Header.astro'])).toEqual({ all: true, urls: [] })
  })

  it('returns ALL for curriculum and language data feeds (even alongside other files)', () => {
    expect(mapChangedFiles(['data/curriculum/python.json'])).toEqual({ all: true, urls: [] })
    expect(mapChangedFiles(['README.md', 'data/languages/python.json'])).toEqual({ all: true, urls: [] })
  })

  it('maps lesson files to /learn URLs', () => {
    const r = mapChangedFiles(['src/content/lessons/python/beginner/01-hello.mdx'])
    expect(r).toEqual({ all: false, urls: ['/learn/python/beginner/01-hello'] })
  })

  it('maps language pages to /languages URLs', () => {
    const r = mapChangedFiles(['src/content/languages/python.mdx'])
    expect(r).toEqual({ all: false, urls: ['/languages/python'] })
  })

  it('maps src/pages files via routePath and dedupes (home maps to empty string)', () => {
    const r = mapChangedFiles(['src/pages/index.astro', 'src/pages/dashboard.astro', 'src/pages/index.astro'])
    expect(r.urls).toEqual(['', '/dashboard'])
  })

  it('returns empty urls for page-neutral changes', () => {
    expect(mapChangedFiles(['README.md'])).toEqual({ all: false, urls: [] })
  })
})
