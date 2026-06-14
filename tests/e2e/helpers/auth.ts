import { Page } from '@playwright/test';

/**
 * Login as a test user
 * Assumes test credentials exist in the database
 */
export async function loginAsTestUser(page: Page): Promise<void> {
  // Navigate to login page
  await page.goto('/login');

  // Fill in test credentials
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'testpassword123');

  // Submit login form
  await page.click('button[type="submit"]');

  // Wait for redirect to authenticated area
  await page.waitForURL(/\/(dashboard|home|vi|en)/, { timeout: 10000 });
}

/**
 * Login with specific credentials
 */
export async function loginWithCredentials(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  await page.goto('/login');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(dashboard|home|vi|en)/, { timeout: 10000 });
}

/**
 * Logout the current user
 */
export async function logout(page: Page): Promise<void> {
  try {
    // Try various logout selectors
    const selectors = [
      'button:has-text("Đăng xuất")',
      'a:has-text("Đăng xuất")',
      '[data-testid="logout"]',
      'button:has-text("Logout")',
      'a:has-text("Logout")',
      '.user-menu button',
      '.user-menu a',
    ];

    for (const selector of selectors) {
      const element = page.locator(selector).first();
      if (await element.isVisible({ timeout: 500 })) {
        await element.click();
        await page.waitForURL(/\/login/, { timeout: 5000 });
        return;
      }
    }
  } catch {
    // Logout not successful or user already logged out
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  try {
    // Check for presence of auth-related elements
    await page.waitForSelector(
      '.user-menu, [data-testid="user-menu"], .logout-button, button:has-text("Đăng xuất")',
      { timeout: 2000 }
    );
    return true;
  } catch {
    return false;
  }
}
