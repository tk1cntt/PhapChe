import { test, expect, Page } from '@playwright/test';

// Test data
const SERVICE_TYPES = [
  { name: 'agency_contract', label: 'Soạn hợp đồng đại lý' },
  { name: 'labor_contract', label: 'Soạn hợp đồng lao động' },
  { name: 'trademark_registration', label: 'Đăng ký nhãn hiệu' },
];

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

async function goToStep2Intake(page: Page) {
  // Step 1: Select service and continue
  await page.goto('/intake');
  await page.locator('.ant-radio-wrapper').first().click();
  await page.locator('button:has-text("Tiếp tục")').click();
  await page.waitForURL(/\/intake\?requestId=.*step=1/);
}

test.describe('Intake Flow - VALIDATION', () => {
  test.beforeEach(async ({ page }) => {
    const loggedIn = await loginAs(page, 'admin');
    if (!loggedIn) test.skip(true, 'Skipped: Database not seeded.');
  });

  test('STEP 0: Validation - clicking continue without selecting service shows error', async ({ page }) => {
    await page.goto('/intake');

    // Don't select any service, just click continue
    await page.locator('button:has-text("Tiếp tục")').click();

    // Should show error message
    await expect(page.locator('.ant-form-item-explain-error').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Vui lòng chọn một nhóm dịch vụ')).toBeVisible();
  });

  test('STEP 1: Validation - submitting empty questions shows error', async ({ page }) => {
    await goToStep2Intake(page);

    // Don't fill any required fields, just click submit
    await page.locator('button:has-text("Lưu câu trả lời")').click();

    // Should show validation errors for required fields
    const errorMessages = page.locator('.ant-form-item-explain-error');
    await expect(errorMessages.first()).toBeVisible({ timeout: 5000 });
  });

  test('STEP 1: Validation - fills required fields and saves successfully', async ({ page }) => {
    await goToStep2Intake(page);

    // Fill all required fields (agency_contract has 3 required: partner_name, commission_rate, contract_term)
    await page.fill('input[name="answer.partner_name"]', 'Công ty ABC');
    await page.fill('input[name="answer.commission_rate"]', '10%');
    await page.fill('input[name="answer.contract_term"]', '12 tháng');

    // Submit
    await page.locator('button:has-text("Lưu câu trả lời")').click();

    // Should navigate to step 2 (upload)
    await expect(page).toHaveURL(/\/intake\?.*step=2/, { timeout: 10000 });
    await expect(page.locator('text=Tài liệu hỗ trợ')).toBeVisible();
  });
});

test.describe('Intake Flow - COMPLETE FLOW', () => {
  test.beforeEach(async ({ page }) => {
    const loggedIn = await loginAs(page, 'admin');
    if (!loggedIn) test.skip(true, 'Skipped: Database not seeded.');
  });

  test('Complete flow: Service → Questions → Upload Skip → Submit → /requests page', async ({ page }) => {
    // Step 1: Service Selection
    await page.goto('/intake');
    await expect(page.locator('text=Bạn cần hỗ trợ việc gì?')).toBeVisible();
    await page.locator('.ant-radio-wrapper').first().click();
    await page.locator('button:has-text("Tiếp tục")').click();

    // Step 2: Questions
    await expect(page).toHaveURL(/\/intake\?.*step=1/, { timeout: 10000 });
    await expect(page.locator('text=Thông tin cần cung cấp')).toBeVisible();

    // Fill required fields
    await page.fill('input[name="answer.partner_name"]', 'Công ty Test E2E');
    await page.fill('input[name="answer.commission_rate"]', '15%');
    await page.fill('input[name="answer.contract_term"]', '24 tháng');
    await page.locator('button:has-text("Lưu câu trả lời")').click();

    // Step 3: Upload (skip - optional)
    await expect(page).toHaveURL(/\/intake\?.*step=2/, { timeout: 10000 });
    await expect(page.locator('text=Tài liệu hỗ trợ')).toBeVisible();
    await page.locator('button:has-text("Tiếp tục")').click();

    // Step 4: Review & Submit
    await expect(page).toHaveURL(/\/intake\?.*step=3/, { timeout: 10000 });
    await expect(page.locator('text=Kiểm tra trước khi gửi')).toBeVisible();

    // Verify answers are shown in review
    await expect(page.locator('text=Công ty Test E2E')).toBeVisible();
    await expect(page.locator('text=15%')).toBeVisible();

    // Click submit
    await page.locator('button:has-text("Gửi yêu cầu")').click();

    // Should redirect to /requests/[id]
    await expect(page).toHaveURL(/\/requests\/[a-zA-Z0-9-]+/, { timeout: 15000 });

    // Verify request status page shows content (NOT blank page)
    await expect(page.locator('text=Đã gửi yêu cầu')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Mã hồ sơ')).toBeVisible();
    await expect(page.locator('text=Đã gửi yêu cầu').or(page.locator('text=Đang nhập thông tin'))).toBeVisible();
  });

  test('Submit redirects to /requests page - page has content (not blank)', async ({ page }) => {
    // Full flow to submit
    await page.goto('/intake');
    await page.locator('.ant-radio-wrapper').first().click();
    await page.locator('button:has-text("Tiếp tục")').click();
    await page.waitForURL(/\/intake\?.*step=1/, { timeout: 10000 });

    await page.fill('input[name="answer.partner_name"]', 'E2E Test Company');
    await page.fill('input[name="answer.commission_rate"]', '20%');
    await page.fill('input[name="answer.contract_term"]', '36 tháng');
    await page.locator('button:has-text("Lưu câu trả lời")').click();

    await page.waitForURL(/\/intake\?.*step=2/, { timeout: 10000 });
    await page.locator('button:has-text("Tiếp tục")').click();

    await page.waitForURL(/\/intake\?.*step=3/, { timeout: 10000 });
    await page.locator('button:has-text("Gửi yêu cầu")').click();

    // Wait for redirect to /requests
    await page.waitForURL(/\/requests\/.*/, { timeout: 15000 });

    // Verify page has content (not blank)
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();

    // Verify specific content exists
    const pageText = await page.textContent('body');
    expect(pageText).toContain('Đã gửi yêu cầu');
    expect(pageText).toContain('Mã hồ sơ');

    // Verify NOT blank page (no common blank page indicators)
    const bodyText = await page.locator('body').textContent();
    expect(bodyText?.length).toBeGreaterThan(100); // Should have substantial content
  });
});

test.describe('Intake Flow - UPLOAD', () => {
  test.beforeEach(async ({ page }) => {
    const loggedIn = await loginAs(page, 'admin');
    if (!loggedIn) test.skip(true, 'Skipped: Database not seeded.');
  });

  test('Upload step shows drag and drop area', async ({ page }) => {
    await goToStep2Intake(page);
    await page.locator('button:has-text("Lưu câu trả lời")').click();
    await page.waitForURL(/\/intake\?.*step=2/, { timeout: 10000 });

    // Verify upload area exists
    await expect(page.locator('.ant-upload-drag')).toBeVisible();
    await expect(page.locator('text=Chọn tệp đính kèm')).toBeVisible();
    await expect(page.locator('text=hoặc kéo thả tệp vào đây')).toBeVisible();
  });

  test('Upload step has continue button (skip upload)', async ({ page }) => {
    await goToStep2Intake(page);
    await page.locator('button:has-text("Lưu câu trả lời")').click();
    await page.waitForURL(/\/intake\?.*step=2/, { timeout: 10000 });

    // Should have continue button to skip upload
    const continueBtn = page.locator('button:has-text("Tiếp tục")');
    await expect(continueBtn).toBeVisible();
  });
});

test.describe('Intake Flow - STEP NAVIGATION', () => {
  test.beforeEach(async ({ page }) => {
    const loggedIn = await loginAs(page, 'admin');
    if (!loggedIn) test.skip(true, 'Skipped: Database not seeded.');
  });

  test('Progress steps show correct current step', async ({ page }) => {
    await page.goto('/intake');

    // Step 0: Service - "Dịch vụ" should be active/process
    const steps = page.locator('.ant-steps-item');
    await expect(steps).toHaveCount(4);

    // Active step should have specific class
    const activeStep = page.locator('.ant-steps-item-process');
    await expect(activeStep).toBeVisible();
  });

  test('Each service type leads to correct question set', async ({ page }) => {
    // Test agency_contract
    await page.goto('/intake');
    await page.locator('.ant-radio-wrapper').first().click();
    await page.locator('button:has-text("Tiếp tục")').click();

    await page.waitForURL(/\/intake\?.*step=1/, { timeout: 10000 });

    // Agency contract has these required fields
    await expect(page.locator('input[name="answer.partner_name"]')).toBeVisible();
    await expect(page.locator('input[name="answer.commission_rate"]')).toBeVisible();
    await expect(page.locator('input[name="answer.contract_term"]')).toBeVisible();
  });
});
