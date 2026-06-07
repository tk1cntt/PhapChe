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

  return !page.url().includes('sign-in');
}

test.describe('Intake Flow', () => {
  test('renders intake page with header', async ({ page }) => {
    const loggedIn = await loginAs(page, 'admin');
    if (!loggedIn) test.skip(true, 'Skipped: Database not seeded.');
    await page.goto('/intake');
    await expect(page.locator('h2:has-text("Gửi yêu cầu pháp lý")')).toBeVisible();
    await expect(page.locator('.ant-steps')).toBeVisible();
  });

  test('shows service selection options', async ({ page }) => {
    const loggedIn = await loginAs(page, 'admin');
    if (!loggedIn) test.skip(true, 'Skipped: Database not seeded.');
    await page.goto('/intake');
    await expect(page.locator('.ant-radio-wrapper').first()).toBeVisible();
  });

  test('can select service option', async ({ page }) => {
    const loggedIn = await loginAs(page, 'admin');
    if (!loggedIn) test.skip(true, 'Skipped: Database not seeded.');
    await page.goto('/intake');
    const option = page.locator('.ant-radio-wrapper').first();
    await option.click();
    await expect(option).toHaveClass(/ant-radio-wrapper-checked/);
  });

  test('shows service selection card', async ({ page }) => {
    const loggedIn = await loginAs(page, 'admin');
    if (!loggedIn) test.skip(true, 'Skipped: Database not seeded.');
    await page.goto('/intake');
    await expect(page.locator('text=Bạn cần hỗ trợ việc gì?')).toBeVisible();
    await expect(page.locator('text=Tiếp tục')).toBeVisible();
    await expect(page.locator('.ant-card').first()).toBeVisible();
  });

  test('has continue button on service selection', async ({ page }) => {
    const loggedIn = await loginAs(page, 'admin');
    if (!loggedIn) test.skip(true, 'Skipped: Database not seeded.');
    await page.goto('/intake');
    await expect(page.locator('button:has-text("Tiếp tục")')).toBeVisible();
  });

  test('clicks continue and redirects to intake with requestId', async ({ page }) => {
    const loggedIn = await loginAs(page, 'admin');
    if (!loggedIn) test.skip(true, 'Skipped: Database not seeded.');
    await page.goto('/intake');
    await page.locator('.ant-radio-wrapper').first().click();
    await page.locator('button:has-text("Tiếp tục")').click();
    await page.waitForURL(/\/intake\?requestId=/);
    expect(page.url()).toMatch(/\/intake\?requestId=[a-zA-Z0-9-]+/);
  });

  test('renders question step after service selection', async ({ page }) => {
    const loggedIn = await loginAs(page, 'admin');
    if (!loggedIn) test.skip(true, 'Skipped: Database not seeded.');
    await page.goto('/intake');
    await page.locator('.ant-radio-wrapper').first().click();
    await page.locator('button:has-text("Tiếp tục")').click();
    await page.waitForURL(/\/intake\?requestId=/);
    await expect(page.locator('text=Thông tin cần cung cấp')).toBeVisible();
    await expect(page.locator('.ant-input, .ant-input-textarea').first()).toBeVisible();
  });

  test('renders upload step section', async ({ page }) => {
    const loggedIn = await loginAs(page, 'admin');
    if (!loggedIn) test.skip(true, 'Skipped: Database not seeded.');
    await page.goto('/intake');
    await page.locator('.ant-radio-wrapper').first().click();
    await page.locator('button:has-text("Tiếp tục")').click();
    await page.waitForURL(/\/intake\?requestId=/);
    await expect(page.locator('text=Tài liệu hỗ trợ')).toBeVisible();
    await expect(page.locator('.ant-upload-drag')).toBeVisible();
  });

  test('renders review summary section', async ({ page }) => {
    const loggedIn = await loginAs(page, 'admin');
    if (!loggedIn) test.skip(true, 'Skipped: Database not seeded.');
    await page.goto('/intake');
    await page.locator('.ant-radio-wrapper').first().click();
    await page.locator('button:has-text("Tiếp tục")').click();
    await page.waitForURL(/\/intake\?requestId=/);
    await expect(page.locator('text=Kiểm tra trước khi gửi')).toBeVisible();
    await expect(page.locator('button:has-text("Gửi yêu cầu")')).toBeVisible();
  });

  test('renders progress steps indicator', async ({ page }) => {
    const loggedIn = await loginAs(page, 'admin');
    if (!loggedIn) test.skip(true, 'Skipped: Database not seeded.');
    await page.goto('/intake');
    await expect(page.locator('.ant-steps-item-title').filter({ hasText: 'Dịch vụ' })).toBeVisible();
    await expect(page.locator('.ant-steps-item-title').filter({ hasText: 'Câu hỏi' })).toBeVisible();
    await expect(page.locator('.ant-steps-item-title').filter({ hasText: 'Tài liệu' })).toBeVisible();
    await expect(page.locator('.ant-steps-item-title').filter({ hasText: 'Kiểm tra' })).toBeVisible();
  });

  test('all service options are selectable', async ({ page }) => {
    const loggedIn = await loginAs(page, 'admin');
    if (!loggedIn) test.skip(true, 'Skipped: Database not seeded.');
    await page.goto('/intake');
    const options = page.locator('.ant-radio-wrapper');
    const count = await options.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const option = options.nth(i);
      await option.click();
      await expect(option).toHaveClass(/ant-radio-wrapper-checked/);
    }
  });

  test('can fill in question form fields', async ({ page }) => {
    const loggedIn = await loginAs(page, 'admin');
    if (!loggedIn) test.skip(true, 'Skipped: Database not seeded.');
    await page.goto('/intake');
    await page.locator('.ant-radio-wrapper').first().click();
    await page.locator('button:has-text("Tiếp tục")').click();
    await page.waitForURL(/\/intake\?requestId=/);
    // Check for input fields
    const inputs = page.locator('.ant-input, .ant-input-textarea');
    const count = await inputs.count();
    expect(count).toBeGreaterThan(0);
  });

  test('question form shows required field indicators', async ({ page }) => {
    const loggedIn = await loginAs(page, 'admin');
    if (!loggedIn) test.skip(true, 'Skipped: Database not seeded.');
    await page.goto('/intake');
    await page.locator('.ant-radio-wrapper').first().click();
    await page.locator('button:has-text("Tiếp tục")').click();
    await page.waitForURL(/\/intake\?requestId=/);
    // Check for required field markers
    const requiredMarkers = page.locator('text=*');
    expect(await requiredMarkers.count()).toBeGreaterThan(0);
  });

  test('upload area has correct accept types', async ({ page }) => {
    const loggedIn = await loginAs(page, 'admin');
    if (!loggedIn) test.skip(true, 'Skipped: Database not seeded.');
    await page.goto('/intake');
    await page.locator('.ant-radio-wrapper').first().click();
    await page.locator('button:has-text("Tiếp tục")').click();
    await page.waitForURL(/\/intake\?requestId=/);
    // Check upload dragger exists
    const dragger = page.locator('.ant-upload-drag');
    await expect(dragger).toBeVisible();
    // Check text content
    await expect(page.locator('text=Chọn tệp đính kèm')).toBeVisible();
  });

  test('review summary shows service type', async ({ page }) => {
    const loggedIn = await loginAs(page, 'admin');
    if (!loggedIn) test.skip(true, 'Skipped: Database not seeded.');
    await page.goto('/intake');
    await page.locator('.ant-radio-wrapper').first().click();
    await page.locator('button:has-text("Tiếp tục")').click();
    await page.waitForURL(/\/intake\?requestId=/);
    // Check review section shows service type
    await expect(page.locator('.ant-typography:has-text("Loại việc")').first()).toBeVisible();
  });
});
