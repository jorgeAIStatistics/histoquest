import { defineConfig, devices } from '@playwright/test'
const port = Number(process.env.PLAYWRIGHT_PORT ?? 4173)

export default defineConfig({
  testDir: './e2e',
  snapshotPathTemplate: '{testDir}/goldens/{testFilePath}/{arg}{ext}',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : 4,
  timeout: 30_000,
  expect: { timeout: 8_000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://127.0.0.1:${port}/histoquest/`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    reducedMotion: 'reduce',
    colorScheme: 'light',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        // GPU-less Linux CI otherwise blocklists WebGL2 (AllowWebgl2:false).
        // Exercise the actual software renderer; the separate unavailable-WebGL test covers fallback.
        launchOptions: process.env.CI
          ? {
              headless: process.platform !== 'linux',
              firefoxUserPrefs: { 'webgl.force-enabled': true, 'webgl.forbid-software': false },
            }
          : {},
      },
    },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: `npm run preview -- --host 127.0.0.1 --port ${port} --strictPort`,
    url: `http://127.0.0.1:${port}/histoquest/`,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
})
