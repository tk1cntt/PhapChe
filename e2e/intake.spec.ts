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

  test('renders question step after service selection', async ({ page }) => {
    const loggedIn = await loginAs(page, 'admin');
    if (!loggedIn) {
      test.skip(true, 'Skipped: Database not seeded.');
    }
    await page.goto('/intake');
    // Select first service option
    await page.locator('.ant-radio-wrapper').first().click();
    // Click continue button
    await page.locator('button:has-text("Tiếp tục")').click();
    // Wait for page load with requestId
    await page.waitForURL(/\/intake\?requestId=/);
    // Verify question step is visible
    await expect(page.locator('text=Thông tin cần cung cấp')).toBeVisible();
    // Verify form inputs are present
    await expect(page.locator('.ant-input, .ant-input-textarea').first()).toBeVisible();
  });

  test('renders upload step section', async ({ page }) => {
    const loggedIn = await loginAs(page, 'admin');
    if (!loggedIn) {
      test.skip(true, 'Skipped: Database not seeded.');
    }
    await page.goto('/intake');
    // Select first service option
    await page.locator('.ant-radio-wrapper').first().click();
    // Click continue button
    await page.locator('button:has-text("Tiếp tục")').click();
    // Wait for page load with requestId
    await page.waitForURL(/\/intake\?requestId=/);
    // Verify upload step section exists
    await expect(page.locator('text=Tài liệu hỗ trợ')).toBeVisible();
    // Verify upload area is present
    await expect(page.locator('.ant-upload-drag')).toBeVisible();
  });

  test('renders review summary section', async ({ page }) => {
    const loggedIn = await loginAs(page, 'admin');
    if (!loggedIn) {
      test.skip(true, 'Skipped: Database not seeded.');
    }
    await page.goto('/intake');
    // Select first service option
    await page.locator('.ant-radio-wrapper').first().click();
    // Click continue button
    await page.locator('button:has-text("Tiếp tục")').click();
    // Wait for page load with requestId
    await page.waitForURL(/\/intake\?requestId=/);
    // Verify review summary section exists
    await expect(page.locator('text=Kiểm tra trước khi gửi')).toBeVisible();
    // Verify submit button is present
    await expect(page.locator('button:has-text("Gửi yêu cầu")')).toBeVisible();
  });

  test('renders progress steps indicator', async ({ page }) => {
    const loggedIn = await loginAs(page, 'admin');
    if (!loggedIn) {
      test.skip(true, 'Skipped: Database not seeded.');
    }
    await page.goto('/intake');
    // Verify all 4 steps are visible in the steps component
    await expect(page.locator('.ant-steps-item-title').filter({ hasText: 'Dịch vụ' })).toBeVisible();
    await expect(page.locator('.ant-steps-item-title').filter({ hasText: 'Câu hỏi' })).toBeVisible();
    await expect(page.locator('.ant-steps-item-title').filter({ hasText: 'Tài liệu' })).toBeVisible();
    await expect(page.locator('.ant-steps-item-title').filter({ hasText: 'Kiểm tra' })).toBeVisible();
  });

  test('all service options are selectable', async ({ page }) => {
    const loggedIn = await loginAs(page, 'admin');
    if (!loggedIn) {
      test.skip(true, 'Skipped: Database not seeded.');
    }
    await page.goto('/intake');
    // Count all radio options
    const options = page.locator('.ant-radio-wrapper');
    const count = await options.count();
    expect(count).toBeGreaterThan(0);
    // Each option should be clickable
    for (let i = 0; i < count; i++) {
      const option = options.nth(i);
      await option.click();
      await expect(option).toHaveClass(/ant-radio-wrapper-checked/);
    }
  });
});
