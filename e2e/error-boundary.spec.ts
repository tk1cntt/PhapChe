import { test, expect } from '@playwright/test';

/**
 * E2E tests for ErrorBoundary fix (commit 14d2ae5).
 *
 * Bug: ErrorBoundaryWrapper called useTranslations() outside NextIntlClientProvider,
 *      causing a crash on every page load because root layout has no i18n context.
 * Fix: Removed useTranslations, use hardcoded Vietnamese fallback translations.
 */

test.describe('ErrorBoundary — Whitebox Tests', () => {
  test('sign-in page renders without useTranslations context error', async ({ page }) => {
    const consoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/vi/sign-in', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');

    // Page should render - form inputs visible
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('input[type="password"]')).toBeVisible({ timeout: 10000 });

    // No useTranslations error in console
    const translationErrors = consoleErrors.filter(
      (msg) =>
        msg.includes('useTranslations') ||
        msg.includes('NextIntlClientProvider') ||
        msg.includes('context was not found')
    );
    expect(translationErrors).toHaveLength(0);
  });

  test('no uncaught errors on root layout render', async ({ page }) => {
    const uncaughtErrors = [];
    page.on('pageerror', (err) => {
      uncaughtErrors.push(err.message);
    });

    await page.goto('/vi/sign-in', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // No uncaught errors related to ErrorBoundary or translations
    const relatedErrors = uncaughtErrors.filter(
      (msg) =>
        msg.includes('ErrorBoundary') ||
        msg.includes('useTranslations') ||
        msg.includes('NextIntlClientProvider')
    );
    expect(relatedErrors).toHaveLength(0);
  });
});

test.describe('ErrorBoundary — Blackbox Tests', () => {
  test('page layout renders correctly with ErrorBoundary wrapper', async ({ page }) => {
    await page.goto('/vi/sign-in', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');

    // Body should be visible (ErrorBoundary renders children)
    await expect(page.locator('body')).toBeVisible();

    // Sign-in form content should be present (not error fallback)
    await expect(page.locator('form')).toBeVisible({ timeout: 10000 });

    // Error fallback UI should NOT be visible
    await expect(page.getByText('Đã xảy ra lỗi')).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Thử lại' })).not.toBeVisible();
  });

  test('multiple locale paths render without errors', async ({ page }) => {
    const locales = ['vi', 'en', 'zh', 'ja'];

    for (const locale of locales) {
      const consoleErrors = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
      });

      await page.goto(`/${locale}/sign-in`, { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle');

      // Form should render for each locale
      await expect(page.locator('form')).toBeVisible({ timeout: 10000 });

      const translationErrors = consoleErrors.filter(
        (msg) => msg.includes('useTranslations') || msg.includes('NextIntlClientProvider')
      );
      expect(translationErrors).toHaveLength(0);
    }
  });
});

test.describe('ErrorBoundary — Abnormal Tests', () => {
  test('page stays functional after transient API error', async ({ page }) => {
    // Simulate API failure - ErrorBoundary should NOT catch this (handled by component)
    await page.route('**/api/auth/**', (route) => {
      route.fulfill({ status: 500, body: 'Internal Server Error' });
    });

    await page.goto('/vi/sign-in', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');

    // Page should still render (ErrorBoundary not triggered for API errors)
    await expect(page.locator('form')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Đã xảy ra lỗi')).not.toBeVisible();
  });
});

test.describe('ErrorBoundary — Error Tests', () => {
  test('no white screen on any page after ErrorBoundary fix', async ({ page }) => {
    const pages = ['/vi/sign-in', '/vi/dashboard', '/vi/admin/dashboard'];

    for (const path of pages) {
      const pageErrors = [];
      page.on('pageerror', (err) => {
        pageErrors.push(err.message);
      });

      await page.goto(path, { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Body should have content (not a white screen)
      const bodyText = await page.locator('body').innerText();
      expect(bodyText.length).toBeGreaterThan(0);

      // No ErrorBoundary-related uncaught errors
      const boundaryErrors = pageErrors.filter(
        (msg) =>
          msg.includes('useTranslations') ||
          msg.includes('NextIntlClientProvider') ||
          msg.includes('context was not found')
      );
      expect(boundaryErrors).toHaveLength(0);
    }
  });
});
