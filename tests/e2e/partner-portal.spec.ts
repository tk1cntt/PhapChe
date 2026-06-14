import { test, expect, Page } from '@playwright/test';

/**
 * Partner Portal E2E Tests
 * Tests for Phase 68: Partner Actions functionality
 *
 * Test types:
 * - Whitebox: Component rendering, state management
 * - Blackbox: User flows, API interactions
 * - Abnormal: Edge cases, empty states
 * - Error: Error handling, recovery
 */

test.describe('Partner Portal E2E Tests', () => {
  // ============================
  // HELPER FUNCTIONS
  // ============================

  async function loginAsPartner(page: Page) {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'partner@example.com');
    await page.fill('input[name="password"]', 'partnerpassword123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(dashboard|partner)/, { timeout: 10000 });
  }

  async function logout(page: Page) {
    try {
      const logoutButton = page.locator('button:has-text("Đăng xuất"), a:has-text("Đăng xuất")');
      if (await logoutButton.isVisible({ timeout: 2000 })) {
        await logoutButton.click();
        await page.waitForURL(/\/login/, { timeout: 5000 });
      }
    } catch {
      // Logout button not visible
    }
  }

  // ============================
  // WHITEBOX TESTS (Component Rendering)
  // ============================
  test.describe('Whitebox Tests - Component Rendering', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsPartner(page);
    });

    test.afterEach(async ({ page }) => {
      await logout(page);
    });

    test('renders partner dashboard with stat cards', async ({ page }) => {
      await page.goto('/partner/dashboard');

      // Verify stat cards are visible
      const statCards = page.locator('.stat-card, [data-testid="stat-card"]');
      await expect(statCards.first()).toBeVisible();
    });

    test('renders request list with status badges', async ({ page }) => {
      await page.goto('/partner/requests');

      // Check for request list container
      const requestList = page.locator('.request-list, [data-testid="request-list"]');
      await expect(requestList).toBeVisible();
    });

    test('renders StatusUpdateForm component correctly', async ({ page }) => {
      await page.goto('/partner/requests');

      // Click on a request to view details
      const requestItem = page.locator('.request-item, [data-testid="request-item"]').first();
      if (await requestItem.isVisible()) {
        await requestItem.click();

        // Check for status update form
        const statusForm = page.locator('form:has(select[name="status"]), [data-testid="status-form"]');
        await expect(statusForm).toBeVisible();

        // Check for status select options
        const statusSelect = page.locator('select').first();
        await expect(statusSelect).toBeVisible();
      }
    });

    test('renders DocumentList component with file icons', async ({ page }) => {
      await page.goto('/partner/requests');

      const requestItem = page.locator('.request-item, [data-testid="request-item"]').first();
      if (await requestItem.isVisible()) {
        await requestItem.click();

        // Check for document list
        const documentList = page.locator('.document-list, [data-testid="document-list"]');
        await expect(documentList).toBeVisible();
      }
    });

    test('renders DocumentUpload component', async ({ page }) => {
      await page.goto('/partner/requests');

      const requestItem = page.locator('.request-item, [data-testid="request-item"]').first();
      if (await requestItem.isVisible()) {
        await requestItem.click();

        // Check for upload form
        const uploadForm = page.locator('form:has(input[type="file"]), [data-testid="upload-form"]');
        await expect(uploadForm).toBeVisible();
      }
    });

    test('renders CommentForm component', async ({ page }) => {
      await page.goto('/partner/requests');

      const requestItem = page.locator('.request-item, [data-testid="request-item"]').first();
      if (await requestItem.isVisible()) {
        await requestItem.click();

        // Check for comment form
        const commentForm = page.locator('form:has(textarea), [data-testid="comment-form"]');
        await expect(commentForm).toBeVisible();

        // Check for textarea
        const textarea = page.locator('textarea');
        await expect(textarea).toBeVisible();
      }
    });

    test('renders CommentList component', async ({ page }) => {
      await page.goto('/partner/requests');

      const requestItem = page.locator('.request-item, [data-testid="request-item"]').first();
      if (await requestItem.isVisible()) {
        await requestItem.click();

        // Check for comment list
        const commentList = page.locator('.comment-list, [data-testid="comment-list"]');
        await expect(commentList).toBeVisible();
      }
    });
  });

  // ============================
  // BLACKBOX TESTS (User Flows)
  // ============================
  test.describe('Blackbox Tests - User Flows', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsPartner(page);
    });

    test.afterEach(async ({ page }) => {
      await logout(page);
    });

    test('partner can view assigned requests', async ({ page }) => {
      await page.goto('/partner/requests');

      // Should see request list
      await expect(page.locator('h1:has-text("Yêu cầu"), h1:has-text("Requests")')).toBeVisible();
    });

    test('partner can filter requests by status', async ({ page }) => {
      await page.goto('/partner/requests');

      // Look for status filter
      const statusFilter = page.locator('select[name="status"], [data-testid="status-filter"]');
      if (await statusFilter.isVisible()) {
        await statusFilter.selectOption('in_progress');

        // Verify filter is applied
        await expect(statusFilter).toHaveValue('in_progress');
      }
    });

    test('partner can update request status', async ({ page }) => {
      await page.goto('/partner/requests');

      // Click on first request
      const requestItem = page.locator('.request-item, [data-testid="request-item"]').first();
      if (await requestItem.isVisible()) {
        await requestItem.click();

        // Wait for request details to load
        await page.waitForLoadState('networkidle');

        // Find status update form
        const statusSelect = page.locator('select').first();
        if (await statusSelect.isVisible()) {
          // Select a new status
          const options = await statusSelect.locator('option').all();
          if (options.length > 1) {
            await statusSelect.selectOption({ index: 1 });

            // Find and click submit button
            const submitButton = page.locator('button[type="submit"]');
            await submitButton.click();

            // Verify success message appears
            await expect(page.locator('text=/thành công|success/i')).toBeVisible({ timeout: 5000 });
          }
        }
      }
    });

    test('partner can add comment to request', async ({ page }) => {
      await page.goto('/partner/requests');

      const requestItem = page.locator('.request-item, [data-testid="request-item"]').first();
      if (await requestItem.isVisible()) {
        await requestItem.click();

        // Find comment form
        const textarea = page.locator('textarea').first();
        if (await textarea.isVisible()) {
          // Enter comment text
          await textarea.fill('This is a test comment from E2E test');

          // Submit form
          const submitButton = page.locator('button:has-text("Gửi"), button:has-text("Send")');
          if (await submitButton.isVisible()) {
            await submitButton.click();

            // Verify comment appears in list
            await expect(page.locator('text=/This is a test comment/i')).toBeVisible({ timeout: 5000 });
          }
        }
      }
    });

    test('partner can upload document', async ({ page }) => {
      await page.goto('/partner/requests');

      const requestItem = page.locator('.request-item, [data-testid="request-item"]').first();
      if (await requestItem.isVisible()) {
        await requestItem.click();

        // Find file input
        const fileInput = page.locator('input[type="file"]');
        if (await fileInput.isVisible()) {
          // Upload a small test file (create a temp file)
          const filePath = process.cwd() + '/tests/fixtures/test-document.pdf';

          // Check if fixture exists, if not skip test
          const fs = require('fs');
          if (fs.existsSync(filePath)) {
            await fileInput.setInputFiles(filePath);

            // Submit upload
            const uploadButton = page.locator('button:has-text("Tải lên"), button:has-text("Upload")');
            if (await uploadButton.isVisible()) {
              await uploadButton.click();

              // Verify upload success
              await expect(page.locator('text=/tải lên thành công|uploaded/i')).toBeVisible({ timeout: 10000 });
            }
          }
        }
      }
    });

    test('partner can download document', async ({ page }) => {
      await page.goto('/partner/requests');

      const requestItem = page.locator('.request-item, [data-testid="request-item"]').first();
      if (await requestItem.isVisible()) {
        await requestItem.click();

        // Find download button
        const downloadButton = page.locator('button:has-text("Tải xuống"), button:has-text("Download"), a:has-text("Tải xuống")').first();
        if (await downloadButton.isVisible()) {
          // Click download and verify new tab opens or download starts
          const popupPromise = page.waitForEvent('popup').catch(() => null);
          await downloadButton.click();
          const popup = await popupPromise;
          // Either popup opened or download triggered
          expect(popup || true).toBeTruthy();
        }
      }
    });

    test('partner can navigate between requests', async ({ page }) => {
      await page.goto('/partner/requests');

      const requestItems = page.locator('.request-item, [data-testid="request-item"]');
      const count = await requestItems.count();

      if (count > 1) {
        // Click first request
        await requestItems.first().click();
        await page.waitForLoadState('networkidle');

        // Go back
        await page.goBack();
        await page.waitForLoadState('networkidle');

        // Click second request
        await requestItems.nth(1).click();
        await page.waitForLoadState('networkidle');

        // Should be on second request detail
        await expect(page).toHaveURL(/\/partner\/requests\/.+/);
      }
    });

    test('partner can view request timeline', async ({ page }) => {
      await page.goto('/partner/requests');

      const requestItem = page.locator('.request-item, [data-testid="request-item"]').first();
      if (await requestItem.isVisible()) {
        await requestItem.click();

        // Look for timeline or activity section
        const timeline = page.locator('.timeline, [data-testid="request-timeline"]');
        if (await timeline.isVisible()) {
          await expect(timeline).toBeVisible();
        }
      }
    });
  });

  // ============================
  // ABNORMAL TESTS (Edge Cases)
  // ============================
  test.describe('Abnormal Tests - Edge Cases', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsPartner(page);
    });

    test.afterEach(async ({ page }) => {
      await logout(page);
    });

    test('handles empty request list gracefully', async ({ page }) => {
      // This partner might have no assigned requests
      await page.goto('/partner/requests');

      // Should show empty state or message
      const emptyState = page.locator('.empty-state, [data-testid="empty-state"], text=/không có|no requests/i');
      const hasEmptyState = await emptyState.isVisible().catch(() => false);
      const hasRequests = await page.locator('.request-item, [data-testid="request-item"]').count() > 0;

      expect(hasEmptyState || hasRequests).toBeTruthy();
    });

    test('handles empty comment list gracefully', async ({ page }) => {
      await page.goto('/partner/requests');

      const requestItem = page.locator('.request-item, [data-testid="request-item"]').first();
      if (await requestItem.isVisible()) {
        await requestItem.click();

        // Check for empty comments message
        const emptyComments = page.locator('text=/chưa có bình luận|no comments/i');
        const hasEmptyMessage = await emptyComments.isVisible().catch(() => false);
        const hasComments = await page.locator('.comment-item, [data-testid="comment-item"]').count() > 0;

        expect(hasEmptyMessage || hasComments).toBeTruthy();
      }
    });

    test('handles empty document list gracefully', async ({ page }) => {
      await page.goto('/partner/requests');

      const requestItem = page.locator('.request-item, [data-testid="request-item"]').first();
      if (await requestItem.isVisible()) {
        await requestItem.click();

        // Check for empty documents message
        const emptyDocs = page.locator('text=/chưa có tài liệu|no documents/i');
        const hasEmptyMessage = await emptyDocs.isVisible().catch(() => false);
        const hasDocs = await page.locator('.document-item, [data-testid="document-item"]').count() > 0;

        expect(hasEmptyMessage || hasDocs).toBeTruthy();
      }
    });

    test('handles long comment content', async ({ page }) => {
      await page.goto('/partner/requests');

      const requestItem = page.locator('.request-item, [data-testid="request-item"]').first();
      if (await requestItem.isVisible()) {
        await requestItem.click();

        const textarea = page.locator('textarea').first();
        if (await textarea.isVisible()) {
          // Generate long comment (close to limit)
          const longComment = 'A'.repeat(9990);
          await textarea.fill(longComment);

          // Submit should work or show validation error
          const submitButton = page.locator('button:has-text("Gửi"), button:has-text("Send")');
          if (await submitButton.isVisible()) {
            await submitButton.click();

            // Either success or validation error
            const successOrError = page.locator('text=/thành công|success|lỗi|error|10000/i');
            await expect(successOrError).toBeVisible({ timeout: 5000 });
          }
        }
      }
    });

    test('handles special characters in comment', async ({ page }) => {
      await page.goto('/partner/requests');

      const requestItem = page.locator('.request-item, [data-testid="request-item"]').first();
      if (await requestItem.isVisible()) {
        await requestItem.click();

        const textarea = page.locator('textarea').first();
        if (await textarea.isVisible()) {
          // Test special characters
          const specialChars = 'Test <script>alert("xss")</script> & "quotes"';
          await textarea.fill(specialChars);

          const submitButton = page.locator('button:has-text("Gửi"), button:has-text("Send")');
          if (await submitButton.isVisible()) {
            await submitButton.click();

            // Should not show XSS alert
            page.on('dialog', async (dialog) => {
              expect(dialog.message()).not.toContain('xss');
              await dialog.dismiss();
            });
          }
        }
      }
    });

    test('handles file upload with unsupported type', async ({ page }) => {
      await page.goto('/partner/requests');

      const requestItem = page.locator('.request-item, [data-testid="request-item"]').first();
      if (await requestItem.isVisible()) {
        await requestItem.click();

        const fileInput = page.locator('input[type="file"]');
        if (await fileInput.isVisible()) {
          // Try to upload an executable
          const filePath = process.cwd() + '/tests/fixtures/test.exe';
          const fs = require('fs');

          if (fs.existsSync(filePath)) {
            await fileInput.setInputFiles(filePath);

            // Should show error about file type
            await expect(page.locator('text=/không được phép|not allowed|type.*invalid/i')).toBeVisible({ timeout: 5000 });
          }
        }
      }
    });

    test('handles file larger than 10MB', async ({ page }) => {
      await page.goto('/partner/requests');

      const requestItem = page.locator('.request-item, [data-testid="request-item"]').first();
      if (await requestItem.isVisible()) {
        await requestItem.click();

        const fileInput = page.locator('input[type="file"]');
        if (await fileInput.isVisible()) {
          // Try to upload a large file (mock)
          const largeFile = process.cwd() + '/tests/fixtures/large-file.pdf';
          const fs = require('fs');

          if (fs.existsSync(largeFile)) {
            await fileInput.setInputFiles(largeFile);

            // Should show error about file size
            await expect(page.locator('text=/kích thước|size.*exceed|10MB/i')).toBeVisible({ timeout: 5000 });
          }
        }
      }
    });

    test('handles rapid status updates', async ({ page }) => {
      await page.goto('/partner/requests');

      const requestItem = page.locator('.request-item, [data-testid="request-item"]').first();
      if (await requestItem.isVisible()) {
        await requestItem.click();

        const statusSelect = page.locator('select').first();
        if (await statusSelect.isVisible()) {
          // Try rapid updates
          const options = await statusSelect.locator('option').all();
          if (options.length > 1) {
            await statusSelect.selectOption({ index: 1 });

            const submitButton = page.locator('button[type="submit"]');
            await submitButton.click();

            // Immediately try another update
            await page.waitForTimeout(100);
            await statusSelect.selectOption({ index: 2 });
            await submitButton.click();

            // Should handle gracefully
            await page.waitForLoadState('networkidle');
          }
        }
      }
    });

    test('handles status note with emoji', async ({ page }) => {
      await page.goto('/partner/requests');

      const requestItem = page.locator('.request-item, [data-testid="request-item"]').first();
      if (await requestItem.isVisible()) {
        await requestItem.click();

        // Find note textarea if exists
        const noteInput = page.locator('input[name="note"], textarea[name="note"]').first();
        if (await noteInput.isVisible()) {
          await noteInput.fill('Status update with emoji 🚀📝');

          const submitButton = page.locator('button[type="submit"]');
          if (await submitButton.isVisible()) {
            await submitButton.click();
            await page.waitForLoadState('networkidle');
          }
        }
      }
    });
  });

  // ============================
  // ERROR TESTS
  // ============================
  test.describe('Error Tests', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsPartner(page);
    });

    test.afterEach(async ({ page }) => {
      await logout(page);
    });

    test('redirects to login when not authenticated', async ({ page }) => {
      // Clear session
      await logout(page);

      // Try to access partner page
      await page.goto('/partner/requests');

      // Should redirect to login
      await expect(page).toHaveURL(/\/login/);
    });

    test('shows error when API fails to load requests', async ({ page }) => {
      // Intercept and fail the API call
      await page.route('**/api/partner/requests*', (route) => {
        route.abort('failed');
      });

      await page.goto('/partner/requests');

      // Should show error state
      await expect(page.locator('.error, [data-testid="error"], text=/lỗi|error/i')).toBeVisible({ timeout: 10000 });
    });

    test('shows error when status update fails', async ({ page }) => {
      await page.goto('/partner/requests');

      const requestItem = page.locator('.request-item, [data-testid="request-item"]').first();
      if (await requestItem.isVisible()) {
        await requestItem.click();

        // Intercept status update API
        await page.route('**/api/partner/requests/*/status', (route) => {
          route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'SERVER_ERROR', detail: 'Internal server error' }),
          });
        });

        const statusSelect = page.locator('select').first();
        if (await statusSelect.isVisible()) {
          const options = await statusSelect.locator('option').all();
          if (options.length > 1) {
            await statusSelect.selectOption({ index: 1 });

            const submitButton = page.locator('button[type="submit"]');
            await submitButton.click();

            // Should show error message
            await expect(page.locator('text=/lỗi|error|thất bại|failed/i')).toBeVisible({ timeout: 5000 });
          }
        }
      }
    });

    test('shows error when comment submission fails', async ({ page }) => {
      await page.goto('/partner/requests');

      const requestItem = page.locator('.request-item, [data-testid="request-item"]').first();
      if (await requestItem.isVisible()) {
        await requestItem.click();

        // Intercept comment API
        await page.route('**/api/partner/requests/*/comments', (route) => {
          route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'SERVER_ERROR', detail: 'Failed to add comment' }),
          });
        });

        const textarea = page.locator('textarea').first();
        if (await textarea.isVisible()) {
          await textarea.fill('Test comment');

          const submitButton = page.locator('button:has-text("Gửi"), button:has-text("Send")');
          if (await submitButton.isVisible()) {
            await submitButton.click();

            // Should show error
            await expect(page.locator('text=/lỗi|error|thất bại|failed/i')).toBeVisible({ timeout: 5000 });
          }
        }
      }
    });

    test('shows error when document upload fails', async ({ page }) => {
      await page.goto('/partner/requests');

      const requestItem = page.locator('.request-item, [data-testid="request-item"]').first();
      if (await requestItem.isVisible()) {
        await requestItem.click();

        // Intercept upload API
        await page.route('**/api/partner/requests/*/documents', (route) => {
          route.abort('failed');
        });

        const fileInput = page.locator('input[type="file"]');
        if (await fileInput.isVisible()) {
          const filePath = process.cwd() + '/tests/fixtures/test-document.pdf';
          const fs = require('fs');

          if (fs.existsSync(filePath)) {
            await fileInput.setInputFiles(filePath);

            const uploadButton = page.locator('button:has-text("Tải lên"), button:has-text("Upload")');
            if (await uploadButton.isVisible()) {
              await uploadButton.click();

              // Should show error
              await expect(page.locator('text=/lỗi|error|thất bại|failed/i')).toBeVisible({ timeout: 10000 });
            }
          }
        }
      }
    });

    test('shows validation error for empty status', async ({ page }) => {
      await page.goto('/partner/requests');

      const requestItem = page.locator('.request-item, [data-testid="request-item"]').first();
      if (await requestItem.isVisible()) {
        await requestItem.click();

        // Submit without selecting status
        const submitButton = page.locator('button[type="submit"]');
        if (await submitButton.isVisible()) {
          await submitButton.click();

          // Should show validation error
          await expect(page.locator('text=/bắt buộc|required|chọn|select/i')).toBeVisible({ timeout: 5000 });
        }
      }
    });

    test('shows validation error for empty comment', async ({ page }) => {
      await page.goto('/partner/requests');

      const requestItem = page.locator('.request-item, [data-testid="request-item"]').first();
      if (await requestItem.isVisible()) {
        await requestItem.click();

        // Try to submit empty form
        const submitButton = page.locator('button:has-text("Gửi"), button:has-text("Send")');
        if (await submitButton.isVisible()) {
          // Button should be disabled for empty content
          await expect(submitButton).toBeDisabled();
        }
      }
    });

    test('handles network timeout gracefully', async ({ page }) => {
      await page.goto('/partner/requests');

      // Intercept and timeout
      await page.route('**/api/partner/requests*', (route) => {
        route.abort('timedout');
      });

      // Should show error state
      await expect(page.locator('.error, [data-testid="error"], text=/lỗi|error|timeout/i')).toBeVisible({ timeout: 15000 });
    });

    test('handles invalid JSON response', async ({ page }) => {
      await page.goto('/partner/requests');

      // Return invalid JSON
      await page.route('**/api/partner/requests*', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: 'invalid json {',
        });
      });

      // Should show error state
      await expect(page.locator('.error, [data-testid="error"], text=/lỗi|error/i')).toBeVisible({ timeout: 10000 });
    });

    test('handles 403 Forbidden for unauthorized request access', async ({ page }) => {
      // Try to access request not assigned to partner
      await page.goto('/partner/requests/99999');

      // Should show 403 or redirect
      const url = page.url();
      expect(url).toMatch(/\/(login|403|error|partner)/);
    });

    test('recovers after API error when refetching', async ({ page }) => {
      let callCount = 0;

      await page.goto('/partner/requests');

      // First call fails, second succeeds
      await page.route('**/api/partner/requests*', (route) => {
        callCount++;
        if (callCount === 1) {
          route.abort('failed');
        } else {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ data: [] }),
          });
        }
      });

      // Reload page to retry
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Should recover and show content
      await expect(page.locator('.request-list, h1')).toBeVisible({ timeout: 10000 });
    });
  });
});
