// @ts-check
import { defineConfig } from 'astro/config'
import mdx from '@astrojs/mdx'
import tailwindcss from '@tailwindcss/vite'
import { shikiLight, shikiDark } from './src/styles/shiki-theme.mjs'

export default defineConfig({
  site: 'https://redrabbitdevs.github.io/Programming-Tutorial',
  base: '/Programming-Tutorial/',
  integrations: [mdx()],
  markdown: {
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
