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

test.describe('Customer dashboard @ 320×568 (S3 truncate regression)', () => {
  // S3: case-card title/role must no longer truncate at the narrowest
  // supported viewport. Regression: a -webkit-line-clamp or overflow:hidden
  // on .case-card-mobile-title/.case-card-mobile-role would clip text here.
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await gotoDashboard(page);
    await page.waitForLoadState('networkidle');
  });

  test('case-card title/role are NOT truncated (no line-clamp / overflow hidden)', async ({ page }) => {
    const cards = page.locator('.case-card-mobile');
    await expect(cards.first()).toBeVisible();

    // The S3 fix removed display:-webkit-box + -webkit-line-clamp + overflow:hidden
    // from the title; both must be gone so text wraps instead of clipping.
    for (const sel of ['.case-card-mobile-title', '.case-card-mobile-role']) {
      const count = await page.locator(sel).count();
      expect(count).toBeGreaterThan(0);
      const styles = await page.locator(sel).first().evaluate((el) => {
        const cs = getComputedStyle(el);
        return {
          display: cs.display,
          webkitLineClamp: cs.webkitLineClamp,
          overflow: cs.overflow,
          overflowWrap: cs.overflowWrap,
        };
      });
      expect(styles.display, `${sel} display`).not.toBe('-webkit-box');
      expect(styles.webkitLineClamp, `${sel} webkitLineClamp`).toBe('none');
      expect(styles.overflow, `${sel} overflow`).not.toBe('hidden');
      expect(styles.overflowWrap, `${sel} overflowWrap`).toBe('anywhere');
    }

    // Title element must wrap long content, not be a fixed-height clip box.
    const title = page.locator('.case-card-mobile-title').first();
    const { scrollWidth, clientWidth } = await title.evaluate((el) => ({
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth,
    }));
    expect(scrollWidth, 'title text must wrap (no horizontal clip)').toBeLessThanOrEqual(clientWidth);
  });

  test('no horizontal overflow at 320px viewport', async ({ page }) => {
    const { scrollWidth, clientWidth } = await page.evaluate(() => {
      const el = document.scrollingElement as HTMLElement;
      return { scrollWidth: el.scrollWidth, clientWidth: el.clientWidth };
    });
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);

    const bodyOverflow = await page.evaluate(() =>
      document.body.scrollWidth > document.body.clientWidth,
    );
    expect(bodyOverflow).toBe(false);
  });

  test('mobile case cards render at 320px with no clipped text', async ({ page }) => {
    const cards = page.locator('.case-card-mobile');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);

    // For every visible card, the title must not horizontally overflow its box.
    for (let i = 0; i < count; i++) {
      const card = cards.nth(i);
      if (!(await card.isVisible())) continue;
      const title = card.locator('.case-card-mobile-title');
      if (await title.count()) {
        const { scrollWidth, clientWidth } = await title.evaluate((el) => ({
          scrollWidth: el.scrollWidth,
          clientWidth: el.clientWidth,
        }));
        expect(scrollWidth, `card ${i} title wraps`).toBeLessThanOrEqual(clientWidth);
      }
    }
  });
});
