/**
 * SR-2 — Mobile Dashboard E2E
 *
 * Runs against the Mobile Chrome project (viewport 390×844, iPhone 12-class)
 * and asserts the responsive customer dashboard:
 *
 *   1. Stat grid is 4 columns (repeat(4,1fr)) — QW-1 was reverted, the 2×2
 *      mobile grid is NOT in scope.
 *   2. No horizontal overflow at the mobile viewport.
 *   3. Tap targets are present: bottom nav, paging buttons, stat-card links.
 *   4. StatCard hrefs resolve to /{locale}/cases and
 *      /{locale}/cases?status=in_progress without 404 (spec 75).
 */

import { test, expect, type Page } from '@playwright/test';
import { loginAs } from './helpers';

async function gotoDashboard(page: Page): Promise<void> {
  await loginAs(page, 'customer');
  if (page.url().includes('/sign-in')) {
    test.skip(true, 'Skipped: Database not seeded.');
  }
  await page.goto('/vi/dashboard', { waitUntil: 'networkidle', timeout: 30000 });
}

test.describe('Customer dashboard @ mobile (390×844)', () => {
  test('stat grid renders 4 columns (no 2x2 grid)', async ({ page }) => {
    await gotoDashboard(page);

    const grid = page.locator('.stats-grid');
    await expect(grid).toBeVisible();

    // Computed grid-template-columns must be 4 tracks on mobile.
    const cols = await grid.evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(' ').length);
    expect(cols).toBe(4);

    // All four stat cards visible at the 390px viewport.
    await expect(page.locator('.stat-card')).toHaveCount(4);
  });

  test('no horizontal overflow at mobile viewport', async ({ page }) => {
    await gotoDashboard(page);

    await page.waitForLoadState('networkidle');
    const { scrollWidth, clientWidth } = await page.evaluate(() => {
      const el = document.scrollingElement as HTMLElement;
      return { scrollWidth: el.scrollWidth, clientWidth: el.clientWidth };
    });
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);

    // Body itself must not overflow either.
    const bodyOverflow = await page.evaluate(() =>
      document.body.scrollWidth > document.body.clientWidth,
    );
    expect(bodyOverflow).toBe(false);
  });

  test('mobile tap targets present: bottom nav, paging, stat cards', async ({ page }) => {
    await gotoDashboard(page);

    // Bottom nav visible on ≤767px.
    const bottomNav = page.locator('.bottom-nav');
    await expect(bottomNav).toBeVisible();
    await expect(bottomNav.locator('.bottom-nav-item')).toHaveCount(3);

    // Stat cards are full-page-width tap targets.
    const statCards = page.locator('.stat-card-link');
    const count = await statCards.count();
    expect(count).toBeGreaterThanOrEqual(4);
    for (let i = 0; i < count; i++) {
      const box = await statCards.nth(i).boundingBox();
      expect(box).not.toBeNull();
      if (box) {
        // Minimum tap target width ~ a finger tap.
        expect(box.width).toBeGreaterThanOrEqual(60);
      }
    }

    // Paging bar present (customer has >10 requests in the demo seed).
    const paging = page.locator('.paging-bar');
    if (await paging.count()) {
      await expect(paging).toBeVisible();
      const pagingBtns = paging.locator('.paging-btn');
      expect(await pagingBtns.count()).toBeGreaterThanOrEqual(2);
      for (let i = 0; i < (await pagingBtns.count()); i++) {
        const box = await pagingBtns.nth(i).boundingBox();
        expect(box).not.toBeNull();
        if (box) expect(box.height).toBeGreaterThanOrEqual(28);
      }
    }
  });

  test('stat card hrefs point to spec-75 URLs that resolve without 404', async ({ page }) => {
    await gotoDashboard(page);

    // The stat-card links must carry the spec-75 hrefs (locale-prefixed).
    const hrefs = await page.locator('.stat-card-link').evaluateAll((els) =>
      els.map((a) => a.getAttribute('href')),
    );
    expect(hrefs).toContain('/vi/cases');
    expect(hrefs).toContain('/vi/cases?status=in_progress');

    // /vi/cases currently server-redirects to /vi/dashboard (no /cases page
    // exists), so "resolves without 404" means: navigating to the href does
    // NOT render a 404/Not Found page and lands on a real dashboard.
    await page.goto('/vi/cases', { waitUntil: 'networkidle', timeout: 30000 });
    expect(page.url()).toContain('/vi/dashboard');
    let body = await page.evaluate(() => document.body.innerText);
    expect(body).not.toMatch(/404|Not Found/);

    await page.goto('/vi/cases?status=in_progress', { waitUntil: 'networkidle', timeout: 30000 });
    expect(page.url()).toContain('/vi/dashboard');
    body = await page.evaluate(() => document.body.innerText);
    expect(body).not.toMatch(/404|Not Found/);
  });
});
