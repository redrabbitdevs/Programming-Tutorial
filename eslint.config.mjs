// @ts-check
import js from '@eslint/js'
import eslintPluginAstro from 'eslint-plugin-astro'
import prettierConfig from 'eslint-config-prettier'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default [
  { ignores: ['dist/', '.astro/', 'node_modules/'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...eslintPluginAstro.configs['flat/recommended'],
  prettierConfig,
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node }
    }
  }
]
