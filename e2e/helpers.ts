import { Page } from '@playwright/test';

export const CREDENTIALS = {
  specialist: { email: 'specialist.demo@example.test', password: 'Demo@123456' },
  reviewer: { email: 'reviewer.demo@example.test', password: 'Demo@123456' },
  admin: { email: 'admin.demo@example.test', password: 'Demo@123456' },
  customer: { email: 'customer.demo@example.test', password: 'Demo@123456' },
};

/**
 * Sign in to the application with given role.
 * Uses demo credentials pre-filled in the form.
 */
export async function loginAs(page: Page, role: keyof typeof CREDENTIALS): Promise<void> {
  await page.context().clearCookies();

  // Navigate to locale-prefixed sign-in page
  await page.goto('/vi/sign-in', { waitUntil: 'networkidle', timeout: 30000 });

  // Wait for the page to be fully loaded with form
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1500); // Let Ant Design initialize

  const creds = CREDENTIALS[role];

  // Find the email input (first input with type text or first input)
  const emailInput = page.locator('input[type="text"]').first();
  const passwordInput = page.locator('input[type="password"]').first();

  // Wait for inputs to be visible
  await emailInput.waitFor({ state: 'visible', timeout: 10000 });

  // Clear and fill credentials
  await emailInput.clear();
  await emailInput.fill(creds.email);
  await passwordInput.fill(creds.password);

  // Click submit button
  await page.locator('button[type="submit"]').click();

  // Wait for navigation
  await page.waitForLoadState('networkidle', { timeout: 15000 });
  await page.waitForTimeout(2000);

  // Verify we're not still on sign-in page
  const currentUrl = page.url();
  if (currentUrl.includes('/sign-in')) {
    console.warn(`loginAs: Still on sign-in page after login attempt for role: ${role}`);
  }
}

/**
 * Wait for server to be reachable
 */
export async function waitForServer(page: Page): Promise<void> {
  for (let i = 0; i < 20; i++) {
    try {
      await page.goto('/vi/sign-in', { waitUntil: 'domcontentloaded', timeout: 5000 });
      return;
    } catch {
      await page.waitForTimeout(1000);
    }
  }
  throw new Error('Server not reachable');
}

/**
 * Navigate to admin dashboard
 */
export async function navigateToAdmin(page: Page): Promise<void> {
  await page.goto('/vi/admin');
  await page.waitForURL(url => !String(url).includes('/sign-in'), { timeout: 10000 });
}
