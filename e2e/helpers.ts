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
  await page.goto('/sign-in', { waitUntil: 'networkidle', timeout: 30000 });

  // Wait for form inputs to be visible
  await page.waitForSelector('input[placeholder="Email"]', { timeout: 5000 });

  const creds = CREDENTIALS[role];

  // Get inputs
  const inputs = page.locator('input');
  const count = await inputs.count();
  if (count < 2) {
    throw new Error('Sign-in form fields not found');
  }

  // Clear any pre-filled values and enter credentials
  await inputs.nth(0).clear();
  await inputs.nth(1).clear();
  await inputs.nth(0).fill(creds.email);
  await inputs.nth(1).fill(creds.password);

  // Click submit button instead of pressing Enter
  await page.locator('button[type="submit"]').click();

  // Wait for navigation or response
  try {
    await page.waitForURL(url => !url.includes('/sign-in'), { timeout: 5000 });
  } catch {
    // If no navigation, wait a bit more and check state
    await page.waitForTimeout(2000);
  }

  // Verify we're not still on sign-in page
  const url = page.url();
  if (url.includes('/sign-in')) {
    console.warn(`loginAs: Still on sign-in page after login attempt for role: ${role}`);
  }
}

/**
 * Wait for server to be reachable
 */
export async function waitForServer(page: Page): Promise<void> {
  for (let i = 0; i < 20; i++) {
    try {
      await page.goto('/sign-in', { waitUntil: 'domcontentloaded', timeout: 5000 });
      return;
    } catch {
      await page.waitForTimeout(1000);
    }
  }
  throw new Error('Server not reachable');
}
