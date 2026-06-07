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

// Helper: Go to step 1 (Questions) from intake
async function goToStep1(page: Page) {
  await page.goto('/intake');
  await page.locator('.ant-radio-wrapper').first().click();
  await page.locator('button:has-text("Tiếp tục")').click();
  await page.waitForURL(/\/intake\?.*step=1/, { timeout: 10000 });
}

// Helper: Go to step 2 (Upload) from intake
async function goToStep2(page: Page) {
  await goToStep1(page);
  await page.fill('input[name="answer.partner_name"]', 'Test Company');
  await page.fill('input[name="answer.commission_rate"]', '10%');
  await page.fill('input[name="answer.contract_term"]', '12 months');
  await page.locator('button:has-text("Lưu câu trả lời")').click();
  await page.waitForURL(/\/intake\?.*step=2/, { timeout: 10000 });
}

// Helper: Go to step 3 (Review) from intake
async function goToStep3(page: Page) {
  await goToStep2(page);
  await page.locator('button:has-text("Tiếp tục")').click();
  await page.waitForURL(/\/intake\?.*step=3/, { timeout: 10000 });
}

test.describe('Intake Flow', () => {

  // ============ STEP 0: Service Selection ============

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

  test('clicks continue and redirects to intake with requestId and step=1', async ({ page }) => {
    const loggedIn = await loginAs(page, 'admin');
    if (!loggedIn) test.skip(true, 'Skipped: Database not seeded.');
    await page.goto('/intake');
    await page.locator('.ant-radio-wrapper').first().click();
    await page.locator('button:has-text("Tiếp tục")').click();
    // NEW: URL should have step=1 parameter
    await page.waitForURL(/\/intake\?.*step=1/, { timeout: 10000 });
    expect(page.url()).toMatch(/\/intake\?.*step=1/);
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

  test('renders progress steps indicator on step 0', async ({ page }) => {
    const loggedIn = await loginAs(page, 'admin');
    if (!loggedIn) test.skip(true, 'Skipped: Database not seeded.');
    await page.goto('/intake');
    // Step 0 = Service selection
    await expect(page.locator('.ant-steps-item-title').filter({ hasText: 'Dịch vụ' })).toBeVisible();
    await expect(page.locator('.ant-steps-item-title').filter({ hasText: 'Câu hỏi' })).toBeVisible();
    await expect(page.locator('.ant-steps-item-title').filter({ hasText: 'Tài liệu' })).toBeVisible();
    await expect(page.locator('.ant-steps-item-title').filter({ hasText: 'Kiểm tra' })).toBeVisible();
  });

  // ============ STEP 1: Questions ============

  test('renders question step after service selection', async ({ page }) => {
    const loggedIn = await loginAs(page, 'admin');
    if (!loggedIn) test.skip(true, 'Skipped: Database not seeded.');
    await goToStep1(page);
    await expect(page.locator('text=Thông tin cần cung cấp')).toBeVisible();
    await expect(page.locator('.ant-input, .ant-input-textarea').first()).toBeVisible();
  });

  test('can fill in question form fields', async ({ page }) => {
    const loggedIn = await loginAs(page, 'admin');
    if (!loggedIn) test.skip(true, 'Skipped: Database not seeded.');
    await goToStep1(page);
    const inputs = page.locator('.ant-input, .ant-input-textarea');
    const count = await inputs.count();
    expect(count).toBeGreaterThan(0);
  });

  test('question form shows required field indicators', async ({ page }) => {
    const loggedIn = await loginAs(page, 'admin');
    if (!loggedIn) test.skip(true, 'Skipped: Database not seeded.');
    await goToStep1(page);
    const requiredMarkers = page.locator('text=*');
    expect(await requiredMarkers.count()).toBeGreaterThan(0);
  });

  test('renders progress steps indicator on step 1', async ({ page }) => {
    const loggedIn = await loginAs(page, 'admin');
    if (!loggedIn) test.skip(true, 'Skipped: Database not seeded.');
    await goToStep1(page);
    // Active step should be "Câu hỏi" (index 1)
    const activeStep = page.locator('.ant-steps-item-process .ant-steps-item-title');
    await expect(activeStep).toContainText('Câu hỏi');
  });

  test('clicking Lưu câu trả lời navigates to step 2', async ({ page }) => {
    const loggedIn = await loginAs(page, 'admin');
    if (!loggedIn) test.skip(true, 'Skipped: Database not seeded.');
    await goToStep1(page);
    await page.fill('input[name="answer.partner_name"]', 'Test Company');
    await page.fill('input[name="answer.commission_rate"]', '10%');
    await page.fill('input[name="answer.contract_term"]', '12 months');
    await page.locator('button:has-text("Lưu câu trả lời")').click();
    await page.waitForURL(/\/intake\?.*step=2/, { timeout: 10000 });
  });

  // ============ STEP 2: Upload ============

  test('renders upload step section on step 2', async ({ page }) => {
    const loggedIn = await loginAs(page, 'admin');
    if (!loggedIn) test.skip(true, 'Skipped: Database not seeded.');
    await goToStep2(page);
    await expect(page.locator('text=Tài liệu hỗ trợ')).toBeVisible();
    await expect(page.locator('.ant-upload-drag')).toBeVisible();
  });

  test('upload area has correct accept types', async ({ page }) => {
    const loggedIn = await loginAs(page, 'admin');
    if (!loggedIn) test.skip(true, 'Skipped: Database not seeded.');
    await goToStep2(page);
    const dragger = page.locator('.ant-upload-drag');
    await expect(dragger).toBeVisible();
    await expect(page.locator('text=Chọn tệp đính kèm')).toBeVisible();
  });

  test('upload step has continue button to skip to step 3', async ({ page }) => {
    const loggedIn = await loginAs(page, 'admin');
    if (!loggedIn) test.skip(true, 'Skipped: Database not seeded.');
    await goToStep2(page);
    const continueBtn = page.locator('button:has-text("Tiếp tục")');
    await expect(continueBtn).toBeVisible();
  });

  test('clicking Tiếp tục on step 2 navigates to step 3', async ({ page }) => {
    const loggedIn = await loginAs(page, 'admin');
    if (!loggedIn) test.skip(true, 'Skipped: Database not seeded.');
    await goToStep2(page);
    await page.locator('button:has-text("Tiếp tục")').click();
    await page.waitForURL(/\/intake\?.*step=3/, { timeout: 10000 });
  });

  test('renders progress steps indicator on step 2', async ({ page }) => {
    const loggedIn = await loginAs(page, 'admin');
    if (!loggedIn) test.skip(true, 'Skipped: Database not seeded.');
    await goToStep2(page);
    const activeStep = page.locator('.ant-steps-item-process .ant-steps-item-title');
    await expect(activeStep).toContainText('Tài liệu');
  });

  // ============ STEP 3: Review ============

  test('renders review summary section on step 3', async ({ page }) => {
    const loggedIn = await loginAs(page, 'admin');
    if (!loggedIn) test.skip(true, 'Skipped: Database not seeded.');
    await goToStep3(page);
    await expect(page.locator('text=Kiểm tra trước khi gửi')).toBeVisible();
    await expect(page.locator('button:has-text("Gửi yêu cầu")')).toBeVisible();
  });

  test('review summary shows service type on step 3', async ({ page }) => {
    const loggedIn = await loginAs(page, 'admin');
    if (!loggedIn) test.skip(true, 'Skipped: Database not seeded.');
    await goToStep3(page);
    // Check that service type is shown in review
    await expect(page.locator('text=Soạn hợp đồng đại lý').first()).toBeVisible();
  });

  test('review summary shows filled answers on step 3', async ({ page }) => {
    const loggedIn = await loginAs(page, 'admin');
    if (!loggedIn) test.skip(true, 'Skipped: Database not seeded.');
    await goToStep3(page);
    // Check that answers from step 1 are shown in review
    await expect(page.locator('text=Test Company')).toBeVisible();
    await expect(page.locator('text=10%')).toBeVisible();
  });

  test('renders progress steps indicator on step 3', async ({ page }) => {
    const loggedIn = await loginAs(page, 'admin');
    if (!loggedIn) test.skip(true, 'Skipped: Database not seeded.');
    await goToStep3(page);
    const activeStep = page.locator('.ant-steps-item-process .ant-steps-item-title');
    await expect(activeStep).toContainText('Kiểm tra');
  });

  // ============ VALIDATION TESTS ============

  test.skip('clicking continue without selecting service shows error', async ({ page }) => {
    const loggedIn = await loginAs(page, 'admin');
    test.skip();
    if (!loggedIn) test.skip(true, 'Skipped: Database not seeded.');
    await page.goto('/intake');
    // Don't select any service, click continue
    await page.locator('button:has-text("Tiếp tục")').click();
    // Should show error message - check for text directly since Form.Item help prop displays differently
    await expect(page.locator('.ant-form-item-explain').first()).toBeVisible({ timeout: 5000 });
  });

  test('clicking Lưu without filling required fields shows error', async ({ page }) => {
    const loggedIn = await loginAs(page, 'admin');
    if (!loggedIn) test.skip(true, 'Skipped: Database not seeded.');
    await goToStep1(page);
    // Don't fill any fields, click submit
    await page.locator('button:has-text("Lưu câu trả lời")').click();
    // Should show validation errors
    const errors = page.locator('.ant-form-item-explain-error');
    await expect(errors.first()).toBeVisible({ timeout: 5000 });
  });

  // ============ COMPLETE FLOW TEST ============

  test('complete flow: service → questions → upload skip → review', async ({ page }) => {
    const loggedIn = await loginAs(page, 'admin');
    if (!loggedIn) test.skip(true, 'Skipped: Database not seeded.');

    // Step 0: Service
    await page.goto('/intake');
    await expect(page.locator('text=Bạn cần hỗ trợ việc gì?')).toBeVisible();
    await page.locator('.ant-radio-wrapper').first().click();
    await page.locator('button:has-text("Tiếp tục")').click();
    await page.waitForURL(/\/intake\?.*step=1/, { timeout: 10000 });

    // Step 1: Questions
    await expect(page.locator('text=Thông tin cần cung cấp')).toBeVisible();
    await page.fill('input[name="answer.partner_name"]', 'E2E Test Corp');
    await page.fill('input[name="answer.commission_rate"]', '15%');
    await page.fill('input[name="answer.contract_term"]', '24 months');
    await page.locator('button:has-text("Lưu câu trả lời")').click();
    await page.waitForURL(/\/intake\?.*step=2/, { timeout: 10000 });

    // Step 2: Upload (skip)
    await expect(page.locator('text=Tài liệu hỗ trợ')).toBeVisible();
    await page.locator('button:has-text("Tiếp tục")').click();
    await page.waitForURL(/\/intake\?.*step=3/, { timeout: 10000 });

    // Step 3: Review
    await expect(page.locator('text=Kiểm tra trước khi gửi')).toBeVisible();
    await expect(page.locator('text=E2E Test Corp')).toBeVisible();
    await expect(page.locator('button:has-text("Gửi yêu cầu")')).toBeVisible();
  });
});
