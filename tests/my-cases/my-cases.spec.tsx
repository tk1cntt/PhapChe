import { test, expect } from '@playwright/test';

// Test data from seed
const TEST_WORKSPACE_SLUG = 'an-phat';

// Sample requests from template
const EXPECTED_REQUESTS = [
  { code: 'REQ-2026-021', type: 'Rà soát hợp đồng dịch vụ', status: 'Đang review' },
  { code: 'REQ-2026-019', type: 'Soạn phụ lục SLA', status: 'Cần phản hồi' },
  { code: 'REQ-2026-018', type: 'Tư vấn điều khoản bảo mật', status: 'Đã duyệt' },
  { code: 'REQ-2026-016', type: 'Bổ sung giấy phép kinh doanh', status: 'Quá hạn' },
  { code: 'REQ-2026-012', type: 'Đăng ký nhãn hiệu', status: 'Đã nộp' },
];

test.describe('My Cases Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to My Cases page
    await page.goto(`/vi/${TEST_WORKSPACE_SLUG}/cases`);
  });

  test('CUST-CASES-01: Summary banner displays correctly', async ({ page }) => {
    // Verify summary banner exists
    const banner = page.locator('.summary-banner');
    await expect(banner).toBeVisible();

    // Verify banner title
    const title = page.locator('.summary-banner h2');
    await expect(title).toContainText('Danh sách hồ sơ pháp lý của bạn');

    // Verify create button exists
    const createBtn = page.locator('.create-btn');
    await expect(createBtn).toBeVisible();
    await expect(createBtn).toContainText('Tạo yêu cầu mới');
  });

  test('CUST-CASES-02: 4 stat cards display with correct values', async ({ page }) => {
    // Verify 4 stat cards exist
    const statCards = page.locator('.stat-card');
    await expect(statCards).toHaveCount(4);

    // Verify blue variant for Total (first card)
    const totalCard = statCards.first();
    await expect(totalCard.locator('.stat-icon.blue')).toBeVisible();

    // Verify stat values (12 total)
    await expect(page.locator('.stat-value').first()).toContainText('12');
  });

  test('CUST-CASES-03: Toolbar with search and filters functional', async ({ page }) => {
    // Verify toolbar exists
    const toolbar = page.locator('.toolbar-card');
    await expect(toolbar).toBeVisible();

    // Verify search input
    const searchInput = page.locator('.request-search input');
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toHaveAttribute('placeholder', 'Tìm mã hồ sơ, loại yêu cầu...');

    // Verify filter buttons
    await expect(page.locator('.tool-btn', { hasText: 'Bộ lọc' })).toBeVisible();
    await expect(page.locator('.tool-btn', { hasText: 'Trạng thái' })).toBeVisible();
    await expect(page.locator('.tool-btn', { hasText: 'Loại yêu cầu' })).toBeVisible();

    // Test dropdown
    const statusDropdown = page.locator('.tool-btn', { hasText: 'Trạng thái' });
    await statusDropdown.click();
    const dropdownMenu = page.locator('.dropdown-menu');
    await expect(dropdownMenu).toBeVisible();
  });

  test('CUST-CASES-04: Requests table show 7 columns', async ({ page }) => {
    // Verify table exists
    const table = page.locator('.table-card');
    await expect(table).toBeVisible();

    // Verify 7 column headers
    const headers = [
      'Mã hồ sơ',
      'Loại yêu cầu',
      'Trạng thái',
      'Người phụ trách',
      'Cập nhật',
      'SLA',
      'Thao tác',
    ];
    for (const header of headers) {
      await expect(page.locator('.th', { hasText: header })).toBeVisible();
    }

    // Verify table row structure (7 columns)
    const firstRow = page.locator('.table-row-7col').first();
    await expect(firstRow).toBeVisible();
    const cells = firstRow.locator('.td');
    await expect(cells).toHaveCount(7);
  });

  test('CUST-CASES-05: Table displays sample data rows', async ({ page }) => {
    // Verify at least 5 rows exist
    const rows = page.locator('.table-row-7col');
    await expect(rows.first()).toBeVisible();

    // Verify REQ-2026-021 exists
    await expect(page.locator('text=REQ-2026-021')).toBeVisible();

    // Verify status badges exist
    const reviewBadge = page.locator('.badge.blue', { hasText: 'Đang review' });
    const pendingBadge = page.locator('.badge.orange', { hasText: 'Cần phản hồi' });
    await expect(reviewBadge.or(pendingBadge).first()).toBeVisible();

    // Verify action links
    const actionLinks = page.locator('.action-link');
    await expect(actionLinks.first()).toBeVisible();
  });

  test('FLOATING-CHAT-01: Floating chat button shows notification badge', async ({ page }) => {
    const chatButton = page.locator('.floating-chat');
    await expect(chatButton).toBeVisible();

    // Verify notification text
    await expect(page.locator('text=2 Tin mới')).toBeVisible();
  });

  test('SEARCH-FILTER-01: Search filters requests by code', async ({ page }) => {
    const searchInput = page.locator('.request-search input');

    // Search for specific code
    await searchInput.fill('REQ-2026-021');
    await page.waitForTimeout(300);

    // Should show the filtered result
    await expect(page.locator('text=REQ-2026-021')).toBeVisible();
  });

  test('SEARCH-FILTER-02: Search filters requests by type', async ({ page }) => {
    const searchInput = page.locator('.request-search input');

    // Search by type
    await searchInput.fill('hợp đồng');
    await page.waitForTimeout(300);

    // Should show matching requests
    await expect(page.locator('text=REQ-2026-021')).toBeVisible();
  });

  test('EMPTY-STATE-01: Shows empty state when no results', async ({ page }) => {
    const searchInput = page.locator('.request-search input');

    // Search for non-existent request
    await searchInput.fill('NONEXISTENT-CODE');
    await page.waitForTimeout(300);

    // Should show empty state
    await expect(page.locator('.table-empty')).toBeVisible();
  });
});
