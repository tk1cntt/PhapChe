/**
 * Scout-fix regression E2E — greeting layouts (Workspace + Settings)
 *
 * Covers the fixes requested by the captain review:
 *   1. Workspace greeting: `.workspace-banner` must center the "Mời thành viên"
 *      button against the title block (align-items:center + wrap), on desktop
 *      AND mobile — previously the button drifted to flex-start and looked off.
 *   2. Settings greeting: round 7 removed the welcome-card greeting
 *      (`.settings-welcome-card`) from `/vi/settings` per captain feedback
 *      ("Trên màn hình setting: Bỏ phần greeting đi"). The page now renders only
 *      the page header, the 4 stat cards and the settings layout. This spec
 *      asserts the greeting is GONE (blackbox) and the page still renders its
 *      content sections (whitebox).
 *   3. Settings stats: the 4 stat cards must sit on a single 4-column grid row
 *      at desktop width (regression guard for the removed `.stats` coupling).
 *   4. SLA fixture: a case with an `slaDeadline` must NOT show the conflicting
 *      "Quá hạn X / Hạn chót: Chưa đặt" pair.
 */

import { test, expect, type Page } from '@playwright/test';
import { loginAs } from './helpers';

async function goto(page: Page, path: string): Promise<void> {
  await loginAs(page, 'customer');
  if (page.url().includes('/sign-in')) {
    test.skip(true, 'Skipped: Database not seeded.');
  }
  await page.goto(path, { waitUntil: 'networkidle', timeout: 30000 });
}

test.describe('Workspace greeting layout fix', () => {
  test('banner button is vertically centered with the title (desktop)', async ({ page }) => {
    await goto(page, '/vi/workspace');

    const banner = page.locator('.workspace-banner');
    await expect(banner).toBeVisible();

    const align = await banner.evaluate((el) => getComputedStyle(el).alignItems);
    expect(align).toBe('center');

    // Button vertical center must sit near the banner vertical center.
    const box = await banner.boundingBox();
    const btnBox = await banner.locator('.create-btn').boundingBox();
    expect(box).not.toBeNull();
    expect(btnBox).not.toBeNull();
    if (box && btnBox) {
      const bannerCenter = (box.y + box.height / 2);
      const btnCenter = (btnBox.y + btnBox.height / 2);
      expect(Math.abs(btnCenter - bannerCenter)).toBeLessThanOrEqual(4);
    }
  });

  test('banner wraps gracefully at mobile width with no horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await goto(page, '/vi/workspace');

    const banner = page.locator('.workspace-banner');
    await expect(banner).toBeVisible();

    const styles = await banner.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { alignItems: cs.alignItems, flexWrap: cs.flexWrap };
    });
    expect(styles.alignItems).toBe('center');
    expect(styles.flexWrap).toBe('wrap');

    const { scrollWidth, clientWidth } = await page.evaluate(() => {
      const el = document.scrollingElement as HTMLElement;
      return { scrollWidth: el.scrollWidth, clientWidth: el.clientWidth };
    });
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });
});

test.describe('Settings greeting removed (round 7)', () => {
  test('blackbox: no welcome-card greeting is rendered on the settings page', async ({ page }) => {
    await goto(page, '/vi/settings');

    // The greeting welcome-card must no longer exist.
    await expect(page.locator('.settings-welcome-card')).toHaveCount(0);
    // No `greetingTitle` text (Xin chào, …) anywhere on the page.
    await expect(page.getByText(/Xin chào, /)).toHaveCount(0);
  });

  test('whitebox: header + stat cards + settings layout still render after greeting removal', async ({ page }) => {
    await goto(page, '/vi/settings');

    // Page header remains.
    await expect(page.locator('.settings-page .page-header h1')).toBeVisible();
    // Stat cards remain (4 cards).
    const stats = page.locator('.settings-page .stats');
    await expect(stats).toBeVisible();
    const cardCount = await page.locator('.settings-page .stats .stat-card').count();
    expect(cardCount).toBe(4);
    // Settings layout (menu + content) remains.
    await expect(page.locator('.settings-layout')).toBeVisible();
    await expect(page.locator('.settings-menu')).toBeVisible();
    await expect(page.locator('.settings-content')).toBeVisible();
  });
});

test.describe('Settings stat cards layout', () => {
  test('settings stat cards sit on a single 4-column row at desktop width', async ({ page }) => {
    await goto(page, '/vi/settings');

    const stats = page.locator('.stats');
    await expect(stats).toBeVisible();

    const cols = await stats.evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(' ').length);
    expect(cols).toBe(4);

    // All four cards share the same top coordinate (one row).
    const tops = await page.locator('.stats .stat-card').evaluateAll((cards) =>
      cards.map((c) => Math.round(c.getBoundingClientRect().top)),
    );
    expect(tops.length).toBe(4);
    expect(new Set(tops).size).toBe(1);
  });
});

test.describe('SLA fixture fix', () => {
  test('case detail does not pair "overdue" with "deadline not set"', async ({ page }) => {
    await goto(page, '/vi/dashboard');

    // Open the first case detail link on the dashboard.
    const detailLink = page.locator('a[href*="/vi/cases/"]').first();
    await expect(detailLink).toBeVisible();
    const href = await detailLink.getAttribute('href');
    await page.goto(href ?? '/vi/dashboard', { waitUntil: 'networkidle', timeout: 30000 });

    const sla = page.locator('.sla-card');
    await expect(sla).toBeVisible();
    const text = await sla.innerText();
    // "Quá hạn X ngày" must not be combined with "Hạn chót: Chưa đặt".
    expect(text).not.toContain('Chưa đặt');
    // A real deadline label must be present.
    expect(text).toContain('Hạn chót');
  });
});
