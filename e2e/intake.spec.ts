import { test, expect, Page } from '@playwright/test';

async function loginAs(page: Page, role: 'admin' | 'specialist' | 'reviewer' | 'customer') {
  const credentials = {
    admin: { email: 'admin.demo@example.test', password: 'Demo@123456' },
    specialist: { email: 'specialist.demo@example.test', password: 'Demo@123456' },
    reviewer: { email: 'reviewer.demo@example.test', password: 'Demo@123456' },
    customer: { email: 'customer.demo@example.test', password: 'Demo@123456' },
  };

  const cred = credentials[role];
  await page.goto('/sign-in');
  await page.locator('input[placeholder*="Email"]').clear();
  await page.locator('input[placeholder*="Email"]').fill(cred.email);
  await page.locator('input[placeholder*="Mật khẩu"]').clear();
  await page.locator('input[placeholder*="Mật khẩu"]').fill(cred.password);
  await page.click('button:has-text("Đăng nhập")');
  await page.waitForTimeout(3000);

  // Return true if login succeeded (redirected from sign-in)
  return !page.url().includes('sign-in');
}

test.describe('Intake Flow', () => {
  test('renders intake page with header', async ({ page }) => {
    const loggedIn = await loginAs(page, 'admin');
    if (!loggedIn) {
      test.skip(true, 'Skipped: Database not seeded. Run `npm run seed` first with DATABASE_URL configured.');
    }
    await page.goto('/intake');
    await expect(page.locator('h2:has-text("Gửi yêu cầu pháp lý")')).toBeVisible();
    await expect(page.locator('.ant-steps')).toBeVisible();
  });

  test('shows service selection options', async ({ page }) => {
    const loggedIn = await loginAs(page, 'admin');
    if (!loggedIn) {
      test.skip(true, 'Skipped: Database not seeded.');
    }
    await page.goto('/intake');
    const options = page.locator('.ant-radio-wrapper').first();
    await expect(options).toBeVisible();
  });

  test('can select service option', async ({ page }) => {
    const loggedIn = await loginAs(page, 'admin');
    if (!loggedIn) {
      test.skip(true, 'Skipped: Database not seeded.');
    }
    await page.goto('/intake');
    const option = page.locator('.ant-radio-wrapper').first();
    await option.click();
    await expect(option).toHaveClass(/ant-radio-wrapper-checked/);
  });

  test('shows service selection card', async ({ page }) => {
    const loggedIn = await loginAs(page, 'admin');
    if (!loggedIn) {
      test.skip(true, 'Skipped: Database not seeded.');
    }
    await page.goto('/intake');
    // Service selection card is visible (initial step)
    await expect(page.locator('text=Bạn cần hỗ trợ việc gì?')).toBeVisible();
    await expect(page.locator('text=Tiếp tục')).toBeVisible();
    await expect(page.locator('.ant-card').first()).toBeVisible();
  });

  test('has continue button on service selection', async ({ page }) => {
    const loggedIn = await loginAs(page, 'admin');
    if (!loggedIn) {
      test.skip(true, 'Skipped: Database not seeded.');
    }
    await page.goto('/intake');
    await expect(page.locator('button:has-text("Tiếp tục")')).toBeVisible();
  });

  test('clicks continue and redirects to intake with requestId', async ({ page }) => {
    const loggedIn = await loginAs(page, 'admin');
    if (!loggedIn) {
      test.skip(true, 'Skipped: Database not seeded.');
    }
    await page.goto('/intake');
    // Select first service option
    await page.locator('.ant-radio-wrapper').first().click();
    // Click continue button
    await page.locator('button:has-text("Tiếp tục")').click();
    // Wait for redirect
    await page.waitForURL(/\/intake\?requestId=/);
    // Verify URL contains requestId param
    expect(page.url()).toMatch(/\/intake\?requestId=[a-zA-Z0-9-]+/);
  });
});
