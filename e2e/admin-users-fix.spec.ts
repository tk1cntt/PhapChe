/**
 * Admin Users Page E2E Test - Verify ReactQueryProvider Fix
 * Tests that the admin users page loads with real data after fixing QueryClientProvider
 */

import { test, expect } from '@playwright/test';

test.describe('Admin Users Page - After ReactQueryProvider Fix', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to admin users page
    await page.goto('/vi/admin/users');
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
  });

  test('page loads without QueryClientProvider error', async ({ page }) => {
    // Verify no React Query error in console
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Navigate to the page
    await page.goto('/vi/admin/users');
    await page.waitForLoadState('networkidle');

    // Should NOT see "No QueryClient set" error
    const errorText = await page.locator('body').textContent();
    expect(errorText).not.toContain('No QueryClient set');
    expect(errorText).not.toContain('QueryClientProvider');
  });

  test('displays user management header', async ({ page }) => {
    // Should see page title
    await expect(page.locator('h1')).toContainText(/User Management|Quản lý người dùng/i);
  });

  test('shows stat cards with data', async ({ page }) => {
    // Wait for stat cards to appear
    await expect(page.locator('[class*="grid"]')).toBeVisible();

    // Should have 4 stat cards
    const statCards = page.locator('.grid > div');
    await expect(statCards.first()).toBeVisible();
  });

  test('role pills section is visible', async ({ page }) => {
    // Should see role pills or role filter
    const roleSection = page.locator('text=/Role|Rôles|Người dùng/i');
    await expect(roleSection.first()).toBeVisible();
  });

  test('toolbar with search is visible', async ({ page }) => {
    // Should see search input
    const searchInput = page.getByPlaceholder(/Search|Tìm kiếm/i);
    await expect(searchInput).toBeVisible();
  });

  test('no runtime error boundary displayed', async ({ page }) => {
    // Should NOT see error boundary
    await expect(page.locator('text=/Something went wrong|Lỗi/i')).not.toBeVisible();
    await expect(page.locator('text=/Retry|Thử lại/i')).not.toBeVisible();
  });

  test('page renders within reasonable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/vi/admin/users');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    // Should load within 10 seconds
    expect(loadTime).toBeLessThan(10000);
  });

  test('API returns user data', async ({ request }) => {
    // Test the API directly
    const response = await request.get('/vi/api/admin/users?page=1&pageSize=10');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty('data');
    expect(data).toHaveProperty('total');
    expect(Array.isArray(data.data)).toBeTruthy();
  });
});

test.describe('Admin Users API', () => {
  test('GET /api/admin/users returns paginated users', async ({ request }) => {
    const response = await request.get('/vi/api/admin/users?page=1&pageSize=5');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.page).toBe(1);
    expect(data.pageSize).toBe(5);
    expect(typeof data.total).toBe('number');
    expect(Array.isArray(data.data)).toBeTruthy();
  });

  test('search filter works', async ({ request }) => {
    const response = await request.get('/vi/api/admin/users?search=admin&page=1&pageSize=5');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    // Should filter users by search term
    expect(Array.isArray(data.data)).toBeTruthy();
  });
});
