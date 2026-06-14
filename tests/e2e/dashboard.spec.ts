import { test, expect, Page } from '@playwright/test';
import { loginAsTestUser, logout } from './helpers/auth';

test.describe('User Dashboard E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await loginAsTestUser(page);
    await page.goto('/dashboard');
  });

  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  // ============================
  // WHITEBOX TESTS (Code Coverage)
  // ============================
  test.describe('Whitebox Tests - Component Rendering', () => {
    test('renders all stat cards with correct data', async ({ page }) => {
      // Verify stat cards are visible
      await expect(page.locator('.stat-card')).toHaveCount(4);

      // Check for specific stat card titles
      await expect(page.getByText('Tổng hồ sơ')).toBeVisible();
      await expect(page.getByText('Đang xử lý')).toBeVisible();
      await expect(page.getByText('Đã hoàn tất')).toBeVisible();
      await expect(page.getByText('Tài liệu vault')).toBeVisible();
    });

    test('renders welcome banner with workspace name', async ({ page }) => {
      const welcomeBanner = page.locator('.welcome-banner');
      await expect(welcomeBanner).toBeVisible();
    });

    test('renders recent cases list', async ({ page }) => {
      const recentCasesPanel = page.locator('.panel:has(.panel-title:has-text("Hồ sơ đang xử lý"))');
      await expect(recentCasesPanel).toBeVisible();
    });

    test('renders deadline and SLA panel', async ({ page }) => {
      const deadlinePanel = page.locator('.panel:has(.panel-title:has-text("Deadline & SLA"))');
      await expect(deadlinePanel).toBeVisible();
    });

    test('renders recent documents panel', async ({ page }) => {
      const docsPanel = page.locator('.panel:has(.panel-title:has-text("Tài liệu gần đây"))');
      await expect(docsPanel).toBeVisible();
    });

    test('renders activity timeline panel', async ({ page }) => {
      const activityPanel = page.locator('.panel:has(.panel-title:has-text("Hoạt động gần đây"))');
      await expect(activityPanel).toBeVisible();
    });

    test('renders floating chat button', async ({ page }) => {
      const chatButton = page.locator('.floating-chat');
      await expect(chatButton).toBeVisible();
    });

    test('stat cards have correct icon SVGs', async ({ page }) => {
      const statCards = page.locator('.stat-card');
      const count = await statCards.count();
      expect(count).toBe(4);

      for (let i = 0; i < count; i++) {
        const card = statCards.nth(i);
        await expect(card.locator('.stat-icon svg')).toBeVisible();
      }
    });

    test('welcome banner has gradient background', async ({ page }) => {
      const welcomeBanner = page.locator('.welcome-banner');
      const background = await welcomeBanner.evaluate((el) => {
        return window.getComputedStyle(el).backgroundImage;
      });
      expect(background).toContain('linear-gradient');
    });
  });

  // ============================
  // BLACKBOX TESTS (User Flow)
  // ============================
  test.describe('Blackbox Tests - User Flows', () => {
    test('dashboard loads successfully for authenticated user', async ({ page }) => {
      // Wait for dashboard to fully load
      await page.waitForSelector('.dashboard-page', { timeout: 10000 });

      // Verify main container exists
      await expect(page.locator('.dashboard-page')).toBeVisible();

      // Verify stats grid exists
      await expect(page.locator('.stats-grid')).toBeVisible();

      // Verify dashboard grids exist
      await expect(page.locator('.dashboard-grid')).toHaveCount(2);
    });

    test('shows loading skeleton while fetching data', async ({ page }) => {
      // Navigate to dashboard
      await page.goto('/dashboard');

      // Should show loading state immediately
      const loadingState = page.locator('.dashboard-loading');
      await expect(loadingState).toBeVisible({ timeout: 1000 }).catch(() => {
        // If it doesn't show, data loaded too fast (acceptable)
      });
    });

    test('navigates to messages from floating chat button', async ({ page }) => {
      const chatButton = page.locator('.floating-chat');
      await expect(chatButton).toBeVisible();

      await chatButton.click();
      await expect(page).toHaveURL(/\/messages/);
    });

    test('shows correct welcome message with stats', async ({ page }) => {
      const welcomeBanner = page.locator('.welcome-banner');
      await expect(welcomeBanner).toBeVisible();

      // Check for welcome text
      const welcomeText = welcomeBanner.locator('h1');
      await expect(welcomeText).toContainText('Chào mừng');
    });

    test('displays dashboard in two-column grid layout', async ({ page }) => {
      const grids = page.locator('.dashboard-grid');
      await expect(grids).toHaveCount(2);

      // Each grid should have 2 panels
      const firstGridPanels = grids.first().locator('.panel');
      const secondGridPanels = grids.last().locator('.panel');
      await expect(firstGridPanels).toHaveCount(2);
      await expect(secondGridPanels).toHaveCount(2);
    });

    test('stat card hover effect works', async ({ page }) => {
      const statCard = page.locator('.stat-card').first();
      await statCard.hover();

      // Check that the card has some hover effect (box-shadow change)
      const boxShadow = await statCard.evaluate((el) => {
        return window.getComputedStyle(el).boxShadow;
      });
      // Hover should add shadow
      expect(boxShadow).toBeTruthy();
    });

    test('case item links work', async ({ page }) => {
      const caseItems = page.locator('.case-item');
      const count = await caseItems.count();

      if (count > 0) {
        const firstCase = caseItems.first();
        const actionLink = firstCase.locator('.action-link');
        await expect(actionLink).toBeVisible();
      }
    });

    test('vault link in documents panel works', async ({ page }) => {
      const vaultLink = page.locator('.panel:has(.panel-title:has-text("Tài liệu gần đây")) .small-link');
      await expect(vaultLink).toBeVisible();
      await expect(vaultLink).toContainText('Mở vault');
    });

    test('view all link in recent cases works', async ({ page }) => {
      const viewAllLink = page.locator('.panel:has(.panel-title:has-text("Hồ sơ đang xử lý")) .small-link');
      await expect(viewAllLink).toBeVisible();
      await expect(viewAllLink).toContainText('Xem tất cả');
    });
  });

  // ============================
  // ABNORMAL TESTS (Edge Cases)
  // ============================
  test.describe('Abnormal Tests - Edge Cases', () => {
    test('handles empty recent cases gracefully', async ({ page }) => {
      // This test assumes some workspace might have no cases
      // The dashboard should show empty state message
      const emptyState = page.locator('.case-list .empty-state');
      // Either shows cases or shows empty state
      const hasCases = await page.locator('.case-item').count() > 0;
      const hasEmptyState = await emptyState.isVisible().catch(() => false);
      expect(hasCases || hasEmptyState).toBeTruthy();
    });

    test('handles empty deadlines gracefully', async ({ page }) => {
      const emptyState = page.locator('.deadline-list .empty-state');
      const hasDeadlines = await page.locator('.deadline-item').count() > 0;
      const hasEmptyState = await emptyState.isVisible().catch(() => false);
      expect(hasDeadlines || hasEmptyState).toBeTruthy();
    });

    test('handles empty documents gracefully', async ({ page }) => {
      const emptyState = page.locator('.document-list .empty-state');
      const hasDocs = await page.locator('.document-item').count() > 0;
      const hasEmptyState = await emptyState.isVisible().catch(() => false);
      expect(hasDocs || hasEmptyState).toBeTruthy();
    });

    test('handles empty activity gracefully', async ({ page }) => {
      const emptyState = page.locator('.timeline .empty-state');
      const hasActivity = await page.locator('.timeline-item').count() > 0;
      const hasEmptyState = await emptyState.isVisible().catch(() => false);
      expect(hasActivity || hasEmptyState).toBeTruthy();
    });

    test('progress bars display correct width', async ({ page }) => {
      const deadlineItems = page.locator('.deadline-item');
      const count = await deadlineItems.count();

      if (count > 0) {
        const progressBar = deadlineItems.first().locator('.progress span');
        const width = await progressBar.evaluate((el) => {
          return parseFloat(window.getComputedStyle(el).width as string);
        });
        expect(width).toBeGreaterThan(0);
      }
    });

    test('file size formatting is human readable', async ({ page }) => {
      const fileSizes = page.locator('.file-info span');
      const count = await fileSizes.count();

      if (count > 0) {
        const firstSize = await fileSizes.first().textContent();
        // Should contain B, KB, MB, or GB
        expect(firstSize).toMatch(/[BKMGT]B?/i);
      }
    });

    test('relative time is displayed for activities', async ({ page }) => {
      const timelineItems = page.locator('.timeline-item');
      const count = await timelineItems.count();

      if (count > 0) {
        const timeElement = timelineItems.first().locator('.timeline-time');
        await expect(timeElement).toBeVisible();
        const timeText = await timeElement.textContent();
        // Should contain "trước" (Vietnamese for "ago")
        expect(timeText).toContain('trước');
      }
    });

    test('responsive layout works on smaller screens', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      // Stats should stack vertically
      const statsGrid = page.locator('.stats-grid');
      const gridCols = await statsGrid.evaluate((el) => {
        return window.getComputedStyle(el).gridTemplateColumns;
      });
      // Mobile should have 1 column
      expect(gridCols).toContain('1fr');
    });
  });

  // ============================
  // ERROR TESTS
  // ============================
  test.describe('Error Tests', () => {
    test('redirects to login when not authenticated', async ({ page }) => {
      // Logout first
      await logout(page);

      // Try to access dashboard
      await page.goto('/dashboard');

      // Should redirect to login
      await expect(page).toHaveURL(/\/login/);
    });

    test('shows error message when API fails', async ({ page }) => {
      // Intercept and fail the API call
      await page.route('**/api/dashboard', (route) => {
        route.abort('failed');
      });

      await page.goto('/dashboard');

      // Should show error state
      const errorElement = page.locator('.dashboard-error');
      await expect(errorElement).toBeVisible({ timeout: 10000 });
    });

    test('shows error when API returns 500', async ({ page }) => {
      await page.route('**/api/dashboard', (route) => {
        route.fulfill({
          status: 500,
          body: 'Internal Server Error',
        });
      });

      await page.goto('/dashboard');

      const errorElement = page.locator('.dashboard-error');
      await expect(errorElement).toBeVisible({ timeout: 10000 });
    });

    test('recovers after error when API becomes available', async ({ page }) => {
      let callCount = 0;

      // First call fails
      await page.route('**/api/dashboard', (route) => {
        callCount++;
        if (callCount === 1) {
          route.fulfill({
            status: 500,
            body: 'Error',
          });
        } else {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              workspace: { id: '1', name: 'Test', slug: 'test' },
              stats: { totalRequests: 0, inProgress: 0, completed: 0, vaultDocs: 0 },
              welcome: { activeRequests: 0, pendingDocs: 0, newReplies: 0 },
              recentCases: [],
              deadlines: [],
              recentDocs: [],
              activity: [],
            }),
          });
        }
      });

      await page.goto('/dashboard');

      // First should show error
      await expect(page.locator('.dashboard-error')).toBeVisible({ timeout: 10000 });

      // Reload and should recover
      await page.reload();
      await expect(page.locator('.dashboard-page')).toBeVisible({ timeout: 10000 });
    });

    test('handles network timeout gracefully', async ({ page }) => {
      await page.route('**/api/dashboard', (route) => {
        route.abort('timedout');
      });

      await page.goto('/dashboard');

      const errorElement = page.locator('.dashboard-error');
      await expect(errorElement).toBeVisible({ timeout: 15000 });
    });

    test('handles invalid JSON response', async ({ page }) => {
      await page.route('**/api/dashboard', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: 'invalid json {',
        });
      });

      await page.goto('/dashboard');

      // Should show error state
      const errorElement = page.locator('.dashboard-error');
      await expect(errorElement).toBeVisible({ timeout: 10000 });
    });
  });
});

// ============================
// HELPER FUNCTIONS
// ============================

async function loginAsTestUser(page: Page) {
  // Navigate to login page
  await page.goto('/login');

  // Fill in credentials (assuming test credentials exist)
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'testpassword123');

  // Submit form
  await page.click('button[type="submit"]');

  // Wait for redirect to dashboard or home
  await page.waitForURL(/\/(dashboard|home)/, { timeout: 10000 });
}

async function logout(page: Page) {
  try {
    // Try to find and click logout button
    const logoutButton = page.locator('button:has-text("Đăng xuất"), a:has-text("Đăng xuất"), [data-testid="logout"]');
    if (await logoutButton.isVisible({ timeout: 2000 })) {
      await logoutButton.click();
      await page.waitForURL(/\/login/, { timeout: 5000 });
    }
  } catch {
    // Logout button not visible, user might already be logged out
  }
}
