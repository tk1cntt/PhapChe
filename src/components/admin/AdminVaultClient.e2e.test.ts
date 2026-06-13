import { test, expect, Page } from '@playwright/test';

/**
 * E2E Test: Admin Vault Page
 *
 * Tests the complete flow of the Admin Vault page including:
 * - Page loads with correct structure
 * - Stats display correctly
 * - Folder panel displays data
 * - Tag panel displays data
 * - File table displays data
 * - Search functionality works
 * - Error handling
 */

test.describe('Admin Vault Page E2E', () => {
  let page: Page;

  test.beforeEach(async ({ page: p }) => {
    page = p;
  });

  // ==================== WHITEBOX TESTS ====================
  test.describe('Whitebox: Page structure', () => {
    test('page has correct page header', async () => {
      await page.goto('/vi/admin/vault');

      // Wait for content to load
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Phân loại vault');
      await expect(page.getByText('Tạo thư mục và thẻ để tổ chức hồ sơ pháp lý')).toBeVisible();
    });

    test('upload button is present and styled', async () => {
      await page.goto('/vi/admin/vault');

      const uploadBtn = page.getByRole('button', { name: /tải tệp lên/i });
      await expect(uploadBtn).toBeVisible();
      await expect(uploadBtn).toHaveCSS('background', /linear-gradient/);
    });

    test('stats grid has 4 stat cards', async () => {
      await page.goto('/vi/admin/vault');

      const statCards = page.locator('.vault-stat-card');
      await expect(statCards).toHaveCount(4);
    });

    test('panels grid has 2 panels (folders and tags)', async () => {
      await page.goto('/vi/admin/vault');

      const panels = page.locator('.vault-panel');
      await expect(panels).toHaveCount(2);
    });

    test('toolbar is present', async () => {
      await page.goto('/vi/admin/vault');

      await expect(page.getByPlaceholder('Tìm tệp, thư mục, thẻ, workspace...')).toBeVisible();
      await expect(page.getByRole('button', { name: /bộ lọc/i })).toBeVisible();
    });

    test('file table has correct headers', async () => {
      await page.goto('/vi/admin/vault');

      const tableHeaders = page.locator('.vault-th');
      await expect(tableHeaders).toHaveCount(7);
      await expect(page.getByText('Tên tệp')).toBeVisible();
      await expect(page.getByText('Thư mục')).toBeVisible();
      await expect(page.getByText('Thẻ')).toBeVisible();
    });
  });

  // ==================== BLACKBOX TESTS ====================
  test.describe('Blackbox: Data display', () => {
    test('displays folders from API', async () => {
      await page.goto('/vi/admin/vault');

      // Wait for data to load
      await page.waitForResponse((response) =>
        response.url().includes('/api/vault') && response.status() === 200
      );

      // Check for folder panel
      await expect(page.getByText('Thư mục').first()).toBeVisible();
      await expect(page.getByRole('button', { name: /tạo thư mục/i })).toBeVisible();
    });

    test('displays tags from API', async () => {
      await page.goto('/vi/admin/vault');

      // Wait for data to load
      await page.waitForResponse((response) =>
        response.url().includes('/api/vault') && response.status() === 200
      );

      // Check for tag panel
      await expect(page.getByText('Thẻ phân loại')).toBeVisible();
      await expect(page.getByRole('button', { name: /tạo thẻ/i })).toBeVisible();
    });

    test('displays file table', async () => {
      await page.goto('/vi/admin/vault');

      // Wait for data to load
      await page.waitForResponse((response) =>
        response.url().includes('/api/vault') && response.status() === 200
      );

      // Table should be visible (with data or empty state)
      const tableCard = page.locator('.vault-table-card');
      await expect(tableCard).toBeVisible();
    });

    test('displays stats with correct titles', async () => {
      await page.goto('/vi/admin/vault');

      await expect(page.getByText('Tổng thư mục')).toBeVisible();
      await expect(page.getByText('Tệp pháp lý')).toBeVisible();
      await expect(page.getByText('Thẻ phân loại')).toBeVisible();
      await expect(page.getByText('Bảo mật')).toBeVisible();
    });
  });

  // ==================== ABNORMAL TESTS ====================
  test.describe('Abnormal: Edge cases', () => {
    test('handles empty data gracefully', async () => {
      // This test assumes the API returns empty data
      await page.goto('/vi/admin/vault');

      // Wait for data to load
      await page.waitForResponse((response) =>
        response.url().includes('/api/vault') && response.status() === 200
      );

      // Empty states should be visible
      await expect(page.getByText('Chưa có thư mục nào.')).toBeVisible();
      await expect(page.getByText('Chưa có thẻ nào.')).toBeVisible();
    });

    test('search input accepts text', async () => {
      await page.goto('/vi/admin/vault');

      const searchInput = page.getByPlaceholder('Tìm tệp, thư mục, thẻ, workspace...');
      await searchInput.fill('test');
      await expect(searchInput).toHaveValue('test');
    });

    test('refresh button triggers reload', async () => {
      await page.goto('/vi/admin/vault');

      // Wait for initial load
      const initialResponse = await page.waitForResponse((response) =>
        response.url().includes('/api/vault')
      );

      // Click refresh
      const refreshBtn = page.locator('.vault-toolbar-btn-icon').first();
      await refreshBtn.click();

      // Should trigger another API call
      await page.waitForResponse((response) =>
        response.url().includes('/api/vault') && response.status() === 200
      );
    });
  });

  // ==================== ERROR TESTS ====================
  test.describe('Error: Error handling', () => {
    test('displays error message when API fails', async ({ page }) => {
      // Intercept and fail the API call
      await page.route('/api/vault', (route) => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal Server Error' }),
        });
      });

      await page.goto('/vi/admin/vault');

      // Wait for error to appear
      await expect(page.getByText(/không thể tải dữ liệu vault/i)).toBeVisible();
    });

    test('retry button appears on error', async ({ page }) => {
      await page.route('/api/vault', (route) => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Server Error' }),
        });
      });

      await page.goto('/vi/admin/vault');

      // Retry button should be visible
      const retryBtn = page.getByRole('button', { name: /thử lại/i });
      await expect(retryBtn).toBeVisible();
    });

    test('clicking retry reloads data', async ({ page }) => {
      let callCount = 0;
      await page.route('/api/vault', (route) => {
        callCount++;
        if (callCount === 1) {
          route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Error' }),
          });
        } else {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ folders: [], tags: [], classifications: [] }),
          });
        }
      });

      await page.goto('/vi/admin/vault');

      // Click retry
      await page.getByRole('button', { name: /thử lại/i }).click();

      // Should succeed now
      await expect(page.getByText('Chưa có thư mục nào.')).toBeVisible();
    });
  });
});
