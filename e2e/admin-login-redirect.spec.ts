import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

/**
 * E2E test for: admin-login-redirect-admin
 * Bug: admin.demo@example.test login xong nhưng truy cập /vi/admin/dashboard bị redirect về login.
 * Root cause: requireAppSession() chỉ lấy 1 membership (take:1), nếu user có nhiều memberships
 * và membership đầu tiên không phải admin role thì admin layout reject.
 * Fix: Collect tất cả roles từ tất cả memberships.
 */
test.describe('Admin login redirect fix', () => {
  test('admin user can access /vi/admin/dashboard after login', async ({ page }) => {
    await loginAs(page, 'admin');

    await page.goto('/vi/admin/dashboard', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    const currentUrl = page.url();

    // Should NOT be redirected to sign-in
    expect(currentUrl).not.toContain('/sign-in');

    // Should still be on admin dashboard path
    expect(currentUrl).toContain('/admin');
  });

  test('admin user can access /vi/admin after login', async ({ page }) => {
    await loginAs(page, 'admin');

    await page.goto('/vi/admin', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    const currentUrl = page.url();

    // Should NOT be redirected to sign-in
    expect(currentUrl).not.toContain('/sign-in');

    // Should NOT be redirected to /dashboard (non-admin)
    expect(currentUrl).not.toMatch(/\/vi\/dashboard$/);
  });

  test('non-admin user is redirected away from admin pages', async ({ page }) => {
    await loginAs(page, 'customer');

    await page.goto('/vi/admin/dashboard', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    const currentUrl = page.url();

    // Non-admin should be redirected to their own dashboard or sign-in
    expect(currentUrl).not.toContain('/admin/dashboard');
  });
});
