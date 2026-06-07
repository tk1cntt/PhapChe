import { test, expect } from '@playwright/test';

test.describe('Sign-In Screen', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/sign-in');
  });

  test('renders login form correctly', async ({ page }) => {
    await expect(page.locator('input[placeholder*="Email"]')).toBeVisible();
    await expect(page.locator('input[placeholder*="Mật khẩu"]')).toBeVisible();
    await expect(page.locator('button:has-text("Đăng nhập")')).toBeVisible();
  });

  test('shows validation errors for empty fields', async ({ page }) => {
    await page.click('button:has-text("Đăng nhập")');
    await expect(page.locator('text=Email là bắt buộc')).toBeVisible();
  });

  test('shows error for invalid credentials', async ({ page }) => {
    await page.fill('input[placeholder*="Email"]', 'wrong@test.com');
    await page.fill('input[placeholder*="Mật khẩu"]', 'wrongpass');
    await page.click('button:has-text("Đăng nhập")');
    await expect(page.locator('text=Email hoặc mật khẩu không đúng')).toBeVisible({ timeout: 5000 });
  });

  test('redirects to intake on successful login', async ({ page }) => {
    await page.fill('input[placeholder*="Email"]', 'admin.demo@example.test');
    await page.fill('input[placeholder*="Mật khẩu"]', 'Demo@123456');
    await page.click('button:has-text("Đăng nhập")');
    await page.waitForURL('**/intake**', { timeout: 10000 });
    await expect(page.url()).toContain('/intake');
  });
});
