import { test, expect, Page } from '@playwright/test';

/**
 * E2E Test: Admin Workspace Page
 *
 * Tests the complete flow of the Admin Workspace page including:
 * - Page loads with correct structure
 * - Permission card displays
 * - Workspace table displays data
 * - Status badges render
 * - Error handling
 */

test.describe('Admin Workspace Page E2E', () => {
  let page: Page;

  test.beforeEach(async ({ page: p }) => {
    page = p;
  });

  // ==================== WHITEBOX TESTS ====================
  test.describe('Whitebox: Page structure', () => {
    test('page has correct page header', async () => {
      await page.goto('/vi/admin/workspace');

      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Workspace khách hàng');
      await expect(page.getByText('Mỗi SME có workspace riêng để hiển thị membership')).toBeVisible();
    });

    test('has two create workspace buttons', async () => {
      await page.goto('/vi/admin/workspace');

      const buttons = page.getByRole('button', { name: /tạo workspace/i });
      await expect(buttons).toHaveCount(2);
    });

    test('permission card is displayed', async () => {
      await page.goto('/vi/admin/workspace');

      await expect(page.getByText('Ranh giới quyền truy cập')).toBeVisible();
    });

    test('table has 4 columns', async () => {
      await page.goto('/vi/admin/workspace');

      const headers = page.locator('.workspace-th');
      await expect(headers).toHaveCount(4);
    });
  });

  // ==================== BLACKBOX TESTS ====================
  test.describe('Blackbox: Data display', () => {
    test('displays workspaces from API', async () => {
      await page.goto('/vi/admin/workspace');

      await page.waitForResponse((response) =>
        response.url().includes('/api/workspaces') && response.status() === 200
      );

      // Table should be visible
      const tableCard = page.locator('.workspace-table-card');
      await expect(tableCard).toBeVisible();
    });

    test('displays workspace with correct data', async ({ page }) => {
      await page.route('/api/workspaces', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            workspaces: [
              {
                id: '1',
                name: 'Công ty An Phát',
                slug: 'an-phat',
                isActive: true,
                memberCount: 3,
                createdAt: '2024-06-13T00:00:00.000Z',
              },
            ],
          }),
        });
      });

      await page.goto('/vi/admin/workspace');

      await expect(page.getByText('Công ty An Phát')).toBeVisible();
      await expect(page.getByText('an-phat')).toBeVisible();
      await expect(page.getByText('3 thành viên')).toBeVisible();
    });

    test('displays active status badge', async ({ page }) => {
      await page.route('/api/workspaces', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            workspaces: [
              {
                id: '1',
                name: 'Test WS',
                slug: 'test',
                isActive: true,
                memberCount: 1,
                createdAt: '2024-06-13T00:00:00.000Z',
              },
            ],
          }),
        });
      });

      await page.goto('/vi/admin/workspace');

      await expect(page.getByText('Đang hoạt động')).toBeVisible();
    });

    test('displays inactive status badge', async ({ page }) => {
      await page.route('/api/workspaces', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            workspaces: [
              {
                id: '1',
                name: 'Inactive WS',
                slug: 'inactive',
                isActive: false,
                memberCount: 1,
                createdAt: '2024-06-13T00:00:00.000Z',
              },
            ],
          }),
        });
      });

      await page.goto('/vi/admin/workspace');

      await expect(page.getByText('Không hoạt động')).toBeVisible();
    });
  });

  // ==================== ABNORMAL TESTS ====================
  test.describe('Abnormal: Edge cases', () => {
    test('handles empty data gracefully', async ({ page }) => {
      await page.route('/api/workspaces', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ workspaces: [] }),
        });
      });

      await page.goto('/vi/admin/workspace');

      await expect(page.getByText('Chưa có workspace nào.')).toBeVisible();
    });
  });

  // ==================== ERROR TESTS ====================
  test.describe('Error: Error handling', () => {
    test('displays error message when API fails', async ({ page }) => {
      await page.route('/api/workspaces', (route) => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Server Error' }),
        });
      });

      await page.goto('/vi/admin/workspace');

      await expect(page.getByText(/không thể tải dữ liệu workspaces/i)).toBeVisible();
    });

    test('retry button appears on error', async ({ page }) => {
      await page.route('/api/workspaces', (route) => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Error' }),
        });
      });

      await page.goto('/vi/admin/workspace');

      const retryBtn = page.getByRole('button', { name: /thử lại/i });
      await expect(retryBtn).toBeVisible();
    });

    test('clicking retry reloads data', async ({ page }) => {
      let callCount = 0;
      await page.route('/api/workspaces', (route) => {
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
            body: JSON.stringify({ workspaces: [] }),
          });
        }
      });

      await page.goto('/vi/admin/workspace');

      await page.getByRole('button', { name: /thử lại/i }).click();
      await expect(page.getByText('Chưa có workspace nào.')).toBeVisible();
    });
  });
});
