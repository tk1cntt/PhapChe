/**
 * Scout-fix regression E2E — Settings mobile optimisation (captain F1 + F3)
 *
 * F1: the 4 status cards on `/vi/settings` must sit in a single 4-column row
 *     on ≤479px phones (previously 2×2), so each stat is visible at a glance.
 * F3: the whole settings page was cluttered on mobile — welcome-card
 *     description hidden + icon shrunk, tabs become horizontal-scroll pills,
 *     form fields compacted (40px), section padding tightened.
 *
 * CSS: src/styles/pages/settings.css `@media (max-width: 479px)`.
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

test.describe('Settings mobile status cards → 4 columns / 1 row (F1)', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('stat grid is 4 columns and all cards share one row', async ({ page }) => {
    await goto(page, '/vi/settings');

    const stats = page.locator('.settings-page .stats');
    await expect(stats).toBeVisible();

    const cols = await stats.evaluate(
      (el) => getComputedStyle(el).gridTemplateColumns.split(' ').length,
    );
    expect(cols).toBe(4);

    const cards = page.locator('.settings-page .stat-card');
    await expect(cards).toHaveCount(4);

    const tops = await cards.evaluateAll((els) =>
      els.map((c) => Math.round(c.getBoundingClientRect().top)),
    );
    expect(new Set(tops).size).toBe(1);

    // No horizontal overflow on the phone.
    const { scrollWidth, clientWidth } = await page.evaluate(() => {
      const el = document.scrollingElement as HTMLElement;
      return { scrollWidth: el.scrollWidth, clientWidth: el.clientWidth };
    });
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });

  test('stat cards are compact and value is visible without truncating badly', async ({ page }) => {
    await goto(page, '/vi/settings');

    const value = page.locator('.settings-page .stat-value').first();
    await expect(value).toBeVisible();

    const valueSize = await value.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    expect(valueSize).toBeGreaterThanOrEqual(12);
    // Card height stays compact so four fit a single row.
    const cardH = await page
      .locator('.settings-page .stat-card')
      .first()
      .evaluate((el) => el.getBoundingClientRect().height);
    expect(cardH).toBeLessThanOrEqual(80);
  });
});

test.describe('Settings mobile overall optimisation (F3)', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('no welcome-card greeting on mobile after round 7 removal', async ({ page }) => {
    await goto(page, '/vi/settings');

    // Round 7: greeting welcome-card removed entirely — must not exist.
    await expect(page.locator('.settings-welcome-card')).toHaveCount(0);
    // Page header still renders.
    await expect(page.locator('.settings-page .page-header h1')).toBeVisible();
  });

  test('tabs become horizontal-scroll pills, not stacked rows', async ({ page }) => {
    await goto(page, '/vi/settings');

    const menu = page.locator('.settings-menu');
    await expect(menu).toBeVisible();

    const menuStyle = await menu.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { display: cs.display, overflowX: cs.overflowX };
    });
    expect(menuStyle.display).toBe('flex');
    expect(menuStyle.overflowX).toBe('auto');

    const firstTab = menu.locator('.settings-tab').first();
    const tabH = await firstTab.evaluate((el) => parseFloat(getComputedStyle(el).height));
    expect(tabH).toBeLessThanOrEqual(44);

    // Tabs are laid out in a single row (same top).
    const tops = await menu.locator('.settings-tab').evaluateAll((els) =>
      els.map((el) => Math.round(el.getBoundingClientRect().top)),
    );
    expect(new Set(tops).size).toBe(1);
  });

  test('profile form fields are compact (≤42px)', async ({ page }) => {
    await goto(page, '/vi/settings');

    const input = page.locator('.form-section .field input').first();
    await expect(input).toBeVisible();
    const h = await input.evaluate((el) => el.getBoundingClientRect().height);
    expect(h).toBeLessThanOrEqual(42);
  });
});

test.describe('Settings desktop regression guard', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('desktop keeps the full 2-column layout after greeting removal', async ({ page }) => {
    await goto(page, '/vi/settings');

    // Round 7: greeting welcome-card removed — must not exist on desktop either.
    await expect(page.locator('.settings-welcome-card')).toHaveCount(0);

    // Stats stay 4 across on desktop.
    const cols = await page
      .locator('.settings-page .stats')
      .evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(' ').length);
    expect(cols).toBe(4);

    // Menu is a stacked vertical panel on desktop (flex-column via block layout).
    const menuDisplay = await page
      .locator('.settings-menu')
      .evaluate((el) => getComputedStyle(el).display);
    expect(menuDisplay).not.toBe('flex');
  });
});
