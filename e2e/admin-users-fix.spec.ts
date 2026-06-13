/**
 * Admin Users Page E2E Test - Verify ReactQueryProvider Fix
 * Tests that the admin users page loads without QueryClientProvider error
 *
 * The critical test is that the "No QueryClient set" error is fixed.
 * Other tests may fail due to auth requirements in the test environment.
 */

import { test, expect } from '@playwright/test';

test.describe('Admin Users Page - QueryClientProvider Fix', () => {
  test('page loads without QueryClientProvider error', async ({ page }) => {
    // Navigate to admin users page
    await page.goto('/vi/admin/users');
    await page.waitForLoadState('networkidle');

    // Should NOT see "No QueryClient set" error
    const errorText = await page.locator('body').textContent();
    expect(errorText).not.toContain('No QueryClient set');
    expect(errorText).not.toContain('QueryClientProvider');
    expect(errorText).not.toContain('No QueryClient');
  });

  test('no React Query hydration error', async ({ page }) => {
    // Check for any React Query related errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error' && msg.text().includes('Query')) {
        errors.push(msg.text());
      }
    });

    await page.goto('/vi/admin/users');
    await page.waitForLoadState('networkidle');

    // Should not have Query-related errors
    const queryErrors = errors.filter(e => e.includes('Query') || e.includes('query'));
    expect(queryErrors.length).toBe(0);
  });

  test('page renders without error boundary', async ({ page }) => {
    await page.goto('/vi/admin/users');
    await page.waitForLoadState('networkidle');

    // Error boundary should not be visible
    await expect(page.locator('text=/Something went wrong|Lỗi rồi/i')).not.toBeVisible();
  });

  test('page loads within reasonable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/vi/admin/users');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    // Should load within 10 seconds
    expect(loadTime).toBeLessThan(10000);
  });

  test('page structure renders', async ({ page }) => {
    await page.goto('/vi/admin/users');
    await page.waitForLoadState('domcontentloaded');

    // Page should have content (may not be full content due to auth)
    const body = await page.locator('body').textContent();
    expect(body).toBeTruthy();
    expect(body!.length).toBeGreaterThan(10);
  });
});

test.describe('Admin Users API - Authenticated', () => {
  test.skip('API returns JSON response', async ({ request }) => {
    // This test requires authentication
    // Skipped unless running with proper auth setup
    const response = await request.get('/vi/api/admin/users?page=1&pageSize=10');

    // Should return JSON (not HTML)
    const contentType = response.headers()['content-type'];
    expect(contentType).toContain('application/json');
  });
});
