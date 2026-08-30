import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      // The mobile dashboard spec runs under the mobile-chrome project only.
      testIgnore: /dashboard-mobile\.spec\.ts/,
    },
    {
      // SR-2: Mobile dashboard spec runs at the iPhone-12-class viewport.
      // Scoped via testMatch so the existing desktop suite is untouched.
      name: 'mobile-chrome',
      testMatch: /dashboard-mobile\.spec\.ts/,
      use: {
        ...devices['iPhone 12'],
        browserName: 'chromium',
      },
    },
  ],
  // Server already running on port 3000 - do not auto-start
  webServer: undefined as unknown as never,
});
