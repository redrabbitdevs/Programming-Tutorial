// @ts-check
import { defineConfig } from 'astro/config'
import mdx from '@astrojs/mdx'
import tailwindcss from '@tailwindcss/vite'
import { satteri } from '@astrojs/markdown-satteri'
import { shikiLight, shikiDark } from './src/styles/shiki-theme.mjs'

// Lesson bodies open with a `# Title` that duplicates the h1 rendered by
// layouts/Lesson.astro (style guide: single h1 = title). Strip depth-1 headings
// from lesson content so each page keeps exactly one h1. The factory returns
// null for non-lesson documents, leaving all other markdown untouched.
/** @param {{ fileURL?: URL }} ctx */
const stripLessonH1 = (ctx) => {
  if (!ctx.fileURL || !ctx.fileURL.pathname.includes('src/content/lessons')) return null
  return {
    name: 'strip-lesson-h1',
    /** @param {{ depth?: number }} node @param {{ removeNode(n: unknown): void }} context */
    heading(node, context) {
      if (node.depth === 1) context.removeNode(node)
    }
  }
}

export default defineConfig({
  site: 'https://redrabbitdevs.github.io/Programming-Tutorial',
  base: '/Programming-Tutorial/',
  // Canonical URLs always carry the trailing slash so generated links match
  // the /learn/<lang>/<tier>/<NN>-<slug>/ convention (docs/content-conventions.md)
  // and the dashboard's pre-wired lesson links exactly.
  trailingSlash: 'always',
  integrations: [mdx()],
  markdown: {
    // Sätteri is Astro 7's default processor; set it explicitly to register the
    // lesson h1 plugin (defaults for everything else are preserved).
    processor: satteri({ mdastPlugins: [stripLessonH1] }),
    shikiConfig: {
      themes: { light: shikiLight, dark: shikiDark },
      defaultColor: 'light',
      wrap: true
    }
  },
  vite: {
    plugins: [tailwindcss()]
  }
})
