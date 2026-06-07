import { Page } from '@playwright/test';

/**
 * Login helper for E2E tests
 * Uses demo credentials from the sign-in form
 */
export async function loginAs(page: Page, role: 'admin' | 'specialist' | 'reviewer' = 'admin'): Promise<void> {
  await page.goto('/sign-in');
  await page.waitForLoadState('networkidle');

  // Demo credentials - prefilled in the form
  const demoCredentials = {
    admin: { email: 'admin@phapche.vn', password: 'admin123' },
    specialist: { email: 'specialist@phapche.vn', password: 'specialist123' },
    reviewer: { email: 'reviewer@phapche.vn', password: 'reviewer123' },
  };

  const creds = demoCredentials[role];

  // Fill login form if not prefilled
  const emailInput = page.locator('input[type="email"], input[id="email"], input[placeholder*="email"]');
  const passwordInput = page.locator('input[type="password"]');

  if (await emailInput.isVisible()) {
    await emailInput.fill(creds.email);
  }
  if (await passwordInput.isVisible()) {
    await passwordInput.fill(creds.password);
  }

  // Submit form
  const submitButton = page.locator('button[type="submit"]');
  await submitButton.click();

  // Wait for navigation after login
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
}

/**
 * Navigate to admin section
 */
export async function navigateToAdmin(page: Page): Promise<void> {
  await page.goto('/admin');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
}

/**
 * Take a screenshot with descriptive name
 */
export async function takeScreenshot(page: Page, name: string): Promise<void> {
  await page.screenshot({ path: `e2e/screenshots/${name}.png`, fullPage: true });
}
