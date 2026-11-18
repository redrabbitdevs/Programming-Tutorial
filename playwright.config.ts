import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 30 * 1000,
  expect: { timeout: 5 * 1000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    // astro preview serves dist/ under the site base path
    baseURL: 'http://localhost:4321/Programming-Tutorial/',
    trace: 'on-first-retry'
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run preview -- --ignore-lock',
    url: 'http://localhost:4321/Programming-Tutorial/',
    reuseExistingServer: !process.env.CI,
    timeout: 60 * 1000
  }
})
