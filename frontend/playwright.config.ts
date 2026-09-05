import { defineConfig, devices } from '@playwright/test'

// The wizard's behaviour under test (step validation, drafts, scroll, duration
// maths) is all client-side, so these run against the dev server with no
// backend or Supabase project needed.
export default defineConfig({
  testDir: './e2e',
  // One worker: the Next dev server compiles routes on demand, and parallel
  // workers hitting a cold route push past the default timeout.
  workers: 1,
  timeout: 60_000,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : [['list']],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
