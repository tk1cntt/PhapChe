import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

test.describe('Internationalization routing', () => {
  test('renders sign-in without locale prefix', async ({ page }) => {
    await page.goto('/sign-in');

    await expect(page).toHaveURL(/\/sign-in/);
    await expect(page.locator('input[placeholder="Email"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('redirects unauthenticated localized customer route to sign-in', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/en/customer');

    await expect(page).toHaveURL(/\/sign-in/);
  });

  test('switches locale while preserving customer path', async ({ page }) => {
    await loginAs(page, 'customer');

    if (page.url().includes('/sign-in')) {
      test.skip(true, 'Skipped: Database not seeded.');
    }

    await page.goto('/vi/customer');
    await page.waitForLoadState('networkidle');

    if (page.url().includes('/sign-in')) {
      test.skip(true, 'Skipped: Database not seeded.');
    }

    await page.getByRole('button', { name: /Tiếng Việt|🇻🇳/ }).click();
    await page.getByText('English').click();

    await expect(page).toHaveURL(/\/en\/customer/);
  });
});
