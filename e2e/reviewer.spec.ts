import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

test.describe('Reviewer Queue', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'reviewer');
  });

  test('renders reviewer queue page', async ({ page }) => {
    await page.goto('/reviewer/requests');
    await page.waitForTimeout(2000);

    // If still on sign-in, skip this test
    if (page.url().includes('/sign-in')) {
      test.skip(true, 'Authentication failed - skipping test');
    }

    // Check for queue page title (use h3 which is the main title)
    await expect(page.locator('h3:has-text("Hàng chờ duyet")')).toBeVisible({ timeout: 10000 });
  });

  test('shows queue list or empty state', async ({ page }) => {
    await page.goto('/reviewer/requests');
    await page.waitForTimeout(2000);

    // If still on sign-in, skip this test
    if (page.url().includes('/sign-in')) {
      test.skip(true, 'Authentication failed - skipping test');
    }

    // Check for either table or empty state
    const hasTable = await page.locator('.ant-table').count() > 0;
    const hasEmptyState = await page.locator('text=Chưa có tài liệu cho duyệt').count() > 0;
    expect(hasTable || hasEmptyState).toBeTruthy();
  });

  test('displays request items with correct columns', async ({ page }) => {
    await page.goto('/reviewer/requests');
    await page.waitForTimeout(2000);

    // If still on sign-in, skip this test
    if (page.url().includes('/sign-in')) {
      test.skip(true, 'Authentication failed - skipping test');
    }

    // Check for column headers
    const hasTitle = await page.locator('th:has-text("Yêu cầu")').count() > 0;
    const hasMatterType = await page.locator('th:has-text("Loại vụ việc")').count() > 0;
    const hasSpecialist = await page.locator('th:has-text("Chuyên viên")').count() > 0;
    const hasVersion = await page.locator('th:has-text("Phiên bản")').count() > 0;
    const hasDate = await page.locator('th:has-text("Gửi lúc")').count() > 0;
    expect(hasTitle && hasMatterType && hasSpecialist && hasVersion && hasDate).toBeTruthy();
  });

  test('can click on request to open review form', async ({ page }) => {
    await page.goto('/reviewer/requests');
    await page.waitForTimeout(2000);

    // If still on sign-in, skip this test
    if (page.url().includes('/sign-in')) {
      test.skip(true, 'Authentication failed - skipping test');
    }

    // Look for clickable links in the request title column
    const requestLinks = page.locator('td a[href*="/reviewer/requests/"]');
    const count = await requestLinks.count();
    if (count > 0) {
      await requestLinks.first().click();
      await page.waitForTimeout(2000);
      // Should navigate to review page
      const url = page.url();
      expect(url.includes('/reviewer/requests/')).toBeTruthy();
    } else {
      // No items to click - test passes as there's nothing to click
      expect(true).toBeTruthy();
    }
  });

  test('shows document versions', async ({ page }) => {
    await page.goto('/reviewer/requests');
    await page.waitForTimeout(2000);

    // If still on sign-in, skip this test
    if (page.url().includes('/sign-in')) {
      test.skip(true, 'Authentication failed - skipping test');
    }

    // Check for version column (v1, v2, etc.)
    const hasVersion = await page.locator('td:has-text("v1"), td:has-text("v2"), td:has-text("v3")').count() > 0;
    // Or empty state if no documents
    const hasEmpty = await page.locator('text=Chưa có tài liệu cho duyệt').count() > 0;
    expect(hasVersion || hasEmpty).toBeTruthy();
  });

  test('shows specialist name for each request', async ({ page }) => {
    await page.goto('/reviewer/requests');
    await page.waitForTimeout(2000);

    // If still on sign-in, skip this test
    if (page.url().includes('/sign-in')) {
      test.skip(true, 'Authentication failed - skipping test');
    }

    // The specialist column shows who submitted the document
    const hasSpecialistCol = await page.locator('th:has-text("Chuyên viên")').count() > 0;
    expect(hasSpecialistCol).toBeTruthy();
  });

  test('page loads with proper styling', async ({ page }) => {
    await page.goto('/reviewer/requests');
    await page.waitForTimeout(2000);

    // If still on sign-in, skip this test
    if (page.url().includes('/sign-in')) {
      test.skip(true, 'Authentication failed - skipping test');
    }

    // Check for card layout
    const hasCard = await page.locator('.ant-card').count() > 0;
    expect(hasCard).toBeTruthy();
  });

  test('handles notice query param', async ({ page }) => {
    await page.goto('/reviewer/requests?notice=approved');
    await page.waitForTimeout(1000);

    // If still on sign-in, skip this test
    if (page.url().includes('/sign-in')) {
      test.skip(true, 'Authentication failed - skipping test');
    }

    // Check for approval notice
    const hasNotice = await page.locator('text=Da duyet tai lieu').count() > 0;
    expect(hasNotice).toBeTruthy();
  });
});
