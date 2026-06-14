import { test, expect, Page } from '@playwright/test';

/**
 * E2E Tests for Partner Actions (Phase 68)
 *
 * Tests cover:
 * - Partner status update flow
 * - Partner comment creation
 * - Partner document upload
 * - Permission checks
 */

test.describe('Partner Actions E2E', () => {
  let partnerPage: Page;
  let requestId: string;

  test.beforeEach(async ({ browser }) => {
    // Create authenticated partner session
    const context = await browser.newContext({
      storageState: './tests/e2e/fixtures/partner-session.json',
    });
    partnerPage = await context.newPage();
    requestId = 'test-request-123';
  });

  test.afterEach(async () => {
    await partnerPage.close();
  });

  // ========================================
  // STATUS UPDATE TESTS
  // ========================================
  test.describe('Status Update', () => {
    test('should update request status from submitted to in_progress', async () => {
      await partnerPage.goto(`/partners/requests/${requestId}`);

      // Wait for status dropdown
      const statusSelect = partnerPage.locator('select[name="status"]');
      await expect(statusSelect).toBeVisible();

      // Select new status
      await statusSelect.selectOption('in_progress');

      // Enter note
      const noteInput = partnerPage.locator('textarea[name="note"]');
      await noteInput.fill('Starting work on this request');

      // Submit
      const submitButton = partnerPage.locator('button[type="submit"]');
      await submitButton.click();

      // Verify success message
      await expect(partnerPage.locator('text=Cập nhật thành công')).toBeVisible({ timeout: 5000 });
    });

    test('should show validation error for invalid status', async () => {
      await partnerPage.goto(`/partners/requests/${requestId}`);

      // Try to submit without changing status
      const submitButton = partnerPage.locator('button[type="submit"]');
      await submitButton.click();

      // Should show validation or be disabled
      await expect(submitButton).toBeDisabled();
    });

    test('should not allow status update without note for completed', async () => {
      await partnerPage.goto(`/partners/requests/${requestId}`);

      const statusSelect = partnerPage.locator('select[name="status"]');
      await statusSelect.selectOption('completed');

      const submitButton = partnerPage.locator('button[type="submit"]');
      await submitButton.click();

      // Should show warning about missing note
      await expect(partnerPage.locator('text=cần nhập ghi chú')).toBeVisible();
    });
  });

  // ========================================
  // COMMENT TESTS
  // ========================================
  test.describe('Comments', () => {
    test('should add a new comment', async () => {
      await partnerPage.goto(`/partners/requests/${requestId}`);

      // Find comment form
      const commentInput = partnerPage.locator('textarea[name="content"]');
      await expect(commentInput).toBeVisible();

      // Enter comment
      await commentInput.fill('This is a test comment from partner');

      // Submit
      const sendButton = partnerPage.locator('button:has-text("Gửi")');
      await sendButton.click();

      // Verify comment appears in list
      await expect(partnerPage.locator('text=This is a test comment from partner')).toBeVisible({ timeout: 5000 });
    });

    test('should add internal comment with badge', async () => {
      await partnerPage.goto(`/partners/requests/${requestId}`);

      // Check internal checkbox
      const internalCheckbox = partnerPage.locator('input[name="isInternal"]');
      await internalCheckbox.check();

      // Enter comment
      const commentInput = partnerPage.locator('textarea[name="content"]');
      await commentInput.fill('Internal note for team only');

      // Submit
      const sendButton = partnerPage.locator('button:has-text("Gửi")');
      await sendButton.click();

      // Verify internal badge appears
      await expect(partnerPage.locator('text=Nội bộ')).toBeVisible({ timeout: 5000 });
    });

    test('should show error for empty comment', async () => {
      await partnerPage.goto(`/partners/requests/${requestId}`);

      // Try to submit empty comment
      const sendButton = partnerPage.locator('button:has-text("Gửi")');
      await sendButton.click();

      // Button should be disabled
      await expect(sendButton).toBeDisabled();
    });
  });

  // ========================================
  // DOCUMENT UPLOAD TESTS
  // ========================================
  test.describe('Document Upload', () => {
    test('should upload a document', async () => {
      await partnerPage.goto(`/partners/requests/${requestId}`);

      // Find file input
      const fileInput = partnerPage.locator('input[type="file"]');
      await expect(fileInput).toBeVisible();

      // Upload test file
      const filePath = './tests/e2e/fixtures/test-document.pdf';
      await fileInput.setInputFiles(filePath);

      // Verify file name appears
      await expect(partnerPage.locator('text=test-document.pdf')).toBeVisible();

      // Enter description
      const descInput = partnerPage.locator('input[name="description"]');
      await descInput.fill('Test document for request');

      // Upload
      const uploadButton = partnerPage.locator('button:has-text("Tải lên")');
      await uploadButton.click();

      // Verify success
      await expect(partnerPage.locator('text=Tải lên thành công')).toBeVisible({ timeout: 5000 });
    });

    test('should reject files larger than 10MB', async () => {
      await partnerPage.goto(`/partners/requests/${requestId}`);

      const fileInput = partnerPage.locator('input[type="file"]');

      // Try to upload oversized file
      const largeFilePath = './tests/e2e/fixtures/large-file.pdf';
      await fileInput.setInputFiles(largeFilePath);

      // Should show error
      await expect(partnerPage.locator('text=Dung lượng file vượt quá 10MB')).toBeVisible();
    });

    test('should show error for empty file', async () => {
      await partnerPage.goto(`/partners/requests/${requestId}`);

      const uploadButton = partnerPage.locator('button:has-text("Tải lên")');
      await uploadButton.click();

      // Button should be disabled without file
      await expect(uploadButton).toBeDisabled();
    });
  });

  // ========================================
  // PERMISSION TESTS
  // ========================================
  test.describe('Permission Checks', () => {
    test('should not allow non-partner to update status', async () => {
      // Login as regular user
      const userContext = await partnerPage.context();
      await userContext.clearCookies();

      // Set regular user session
      await partnerPage.goto('/login');
      // ... login flow for regular user

      await partnerPage.goto(`/partners/requests/${requestId}`);

      // Should redirect or show access denied
      await expect(partnerPage.locator('text=Không có quyền truy cập')).toBeVisible({ timeout: 5000 });
    });

    test('should not allow partner to access unassigned request', async () => {
      await partnerPage.goto('/partners/requests/unassigned-request-id');

      // Should show access denied
      await expect(partnerPage.locator('text=Không có quyền truy cập')).toBeVisible({ timeout: 5000 });
    });
  });

  // ========================================
  // ERROR HANDLING TESTS
  // ========================================
  test.describe('Error Handling', () => {
    test('should show error when API is unavailable', async () => {
      // Mock network error
      await partnerPage.route('**/api/partner/requests/**/status', route => {
        route.abort('failed');
      });

      await partnerPage.goto(`/partners/requests/${requestId}`);

      // Try to update status
      const statusSelect = partnerPage.locator('select[name="status"]');
      await statusSelect.selectOption('in_progress');
      const submitButton = partnerPage.locator('button[type="submit"]');
      await submitButton.click();

      // Should show error message
      await expect(partnerPage.locator('text=Không thể kết nối')).toBeVisible({ timeout: 5000 });
    });

    test('should handle session expiry gracefully', async () => {
      // Mock 401 response
      await partnerPage.route('**/api/partner/**', route => {
        route.fulfill({
          status: 401,
          body: JSON.stringify({ error: 'Unauthorized' }),
        });
      });

      await partnerPage.goto(`/partners/requests/${requestId}`);

      // Should redirect to login
      await expect(partnerPage).toHaveURL(/\/login/);
    });
  });
});
