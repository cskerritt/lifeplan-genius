import { defineConfig, devices } from '@playwright/test';

// Check if we should skip starting the web server
const skipWebServer = process.env.PLAYWRIGHT_SKIP_BROWSER_LAUNCH === '1';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30 * 1000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html'], ['list']],
  
  use: {
    baseURL: 'http://localhost:8082', // Current frontend port
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  // Only start the web server if not skipped
  ...(skipWebServer ? {} : {
    webServer: {
      command: 'npm run dev:all',
      url: 'http://localhost:8082', // URL to check for readiness
      reuseExistingServer: !process.env.CI,
      timeout: 120000, // Increase timeout to 2 minutes
    }
  }),
});
