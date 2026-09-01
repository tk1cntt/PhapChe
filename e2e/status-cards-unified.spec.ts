/**
 * Captain feedback round 3 regression E2E — status cards unified to Dashboard
 * standard across Workspace / Settings / Messages.
 *
 * Feedback (round 3):
 *   1. "Trang Workspace phần status card đang là 1 cột 3 hàng, chuyển hết về 1 hàng"
 *   2. "phần status card của các trang phải làm giống như trang dashboard kể cả
 *      cỡ chữ, vị trí icon, text"
 *
 * Root cause: `src/styles/pages/workspace.css` `@media (max-width: 768px)`
 * forced `.stats { grid-template-columns: 1fr }` → each card full-width stacked
 * (1 column × 3 rows). Workspace/Settings/Messages also used the taller card.css
 * defaults (62px icon, 30px value) instead of the Dashboard standard (48px icon
 * / 24px glyph, 28px value, compact text block).
 *
 * Fix: card.css `.stats`/`.stat-card`/`.stat-icon`/`.stat-value` now match the
 * Dashboard `.stats-grid` standard (icon 48/24, value 28px, title text-sm, desc
 * 12px) with media queries that keep a single 4-column row on ≤479px phones;
 * workspace.css page override removed the 1-column mobile stack; settings.css
 * mobile override removed so every page uses the same card.css rules.
 *
 * This spec asserts the user-visible outcome: every status card grid is a
 * single row at mobile AND desktop, with the Dashboard-standard icon size and
 * value size.
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

async function statGridInfo(page: Page, root: string) {
  const grid = page.locator(root);
  await expect(grid).toBeVisible();
  const cards = grid.locator('.stat-card');
  const cardCount = await cards.count();
  const tops = await cards.evaluateAll((els) =>
    els.map((c) => Math.round(c.getBoundingClientRect().top)),
  );
  const first = cards.first();
  // Since round 5 the first Workspace card renders a `.stat-status` chip rather
  // than a numeric `.stat-value`. Use the first card that has `.stat-value`.
  const numericCard = cards.filter({ has: page.locator('.stat-value') }).first();
  return {
    cardCount,
    oneRow: cardCount > 0 && new Set(tops).size === 1,
    iconW: await first
      .locator('.stat-icon')
      .evaluate((el) => Math.round(el.getBoundingClientRect().width)),
    iconGlyphW: await first
      .locator('.stat-icon svg')
      .evaluate((el) => Math.round(el.getBoundingClientRect().width)),
    valueSize: await numericCard
      .locator('.stat-value')
      .evaluate((el) => parseFloat(getComputedStyle(el).fontSize)),
  };
}

test.describe('Status cards unified to Dashboard standard (round 3)', () => {
  test('Workspace: cards are one row at mobile (390×844), not 1 column × 3 rows', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await goto(page, '/vi/workspace');

    const info = await statGridInfo(page, '.stats');
    expect(info.cardCount).toBe(3);
    expect(info.oneRow).toBe(true);
    // Compact dashboard-style icon (24px container → 20px on phone).
    expect(info.iconW).toBeLessThanOrEqual(24);
    // Compact value font (~12px on phone).
    expect(info.valueSize).toBeLessThanOrEqual(16);
    // No horizontal overflow.
    const { scrollWidth, clientWidth } = await page.evaluate(() => {
      const el = document.scrollingElement as HTMLElement;
      return { scrollWidth: el.scrollWidth, clientWidth: el.clientWidth };
    });
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });

  test('Settings: 4 cards stay one row on mobile with dashboard-style icon/value', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await goto(page, '/vi/settings');

    const info = await statGridInfo(page, '.settings-page .stats');
    expect(info.cardCount).toBe(4);
    expect(info.oneRow).toBe(true);
    expect(info.iconW).toBeLessThanOrEqual(24);
    expect(info.valueSize).toBeGreaterThanOrEqual(12);
    expect(info.valueSize).toBeLessThanOrEqual(16);
  });

  test('Workspace: cards are one row at desktop with Dashboard-standard icon (48px) + value (28px)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await goto(page, '/vi/workspace');

    const info = await statGridInfo(page, '.stats');
    expect(info.cardCount).toBe(3);
    expect(info.oneRow).toBe(true);
    expect(info.iconW).toBe(48);
    expect(info.iconGlyphW).toBe(24);
    // The workspace card now renders a compact `.stat-status` chip instead of a
    // big number, so `.stat-value` lives on the numeric cards (members, requests).
    // Assert the numeric value slot via the 2nd card.
    const numericCard = page.locator('.stats .stat-card').nth(1);
    const valueSize = await numericCard
      .locator('.stat-value')
      .evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    expect(valueSize).toBe(28);
  });

  test('Settings: 4 cards one row at desktop with Dashboard-standard icon (48px) + value (28px)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await goto(page, '/vi/settings');

    const info = await statGridInfo(page, '.settings-page .stats');
    expect(info.cardCount).toBe(4);
    expect(info.oneRow).toBe(true);
    expect(info.iconW).toBe(48);
    expect(info.iconGlyphW).toBe(24);
    expect(info.valueSize).toBe(28);
  });
});

test.describe('Workspace status chip small (round 5)', () => {
  test('desktop: workspace status renders as compact .stat-status, NOT inside 28px .stat-value', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await goto(page, '/vi/workspace');

    const workspaceCard = page.locator('.stat-card').first();
    await expect(workspaceCard.locator('.stat-status')).toBeVisible();
    // Whitebox: the status text must never occupy the big number slot.
    await expect(workspaceCard.locator('.stat-value')).toHaveCount(0);

    const statusText = await workspaceCard.locator('.stat-status').textContent();
    expect(statusText).toContain('Đang hoạt động');

    // Size assertion: chip font must be small (title scale), not the 28px value.
    const fontSize = await workspaceCard
      .locator('.stat-status')
      .evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    expect(fontSize).toBeLessThanOrEqual(13);

    // A status dot is rendered for the active state.
    await expect(workspaceCard.locator('.stat-status-dot')).toBeVisible();

    // Other cards keep numeric values in `.stat-value` (28px).
    const valueSizes = await page
      .locator('.stat-card .stat-value')
      .evaluateAll((els) => els.map((el) => parseFloat(getComputedStyle(el).fontSize)));
    expect(valueSizes.length).toBe(2);
    valueSizes.forEach((s) => expect(s).toBe(28));
  });

  test('mobile 390×844: status chip stays tiny and cards remain one row', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await goto(page, '/vi/workspace');

    const grid = page.locator('.stats');
    const cards = grid.locator('.stat-card');
    const cardCount = await cards.count();
    expect(cardCount).toBe(3);
    const tops = await cards.evaluateAll((els) =>
      els.map((c) => Math.round(c.getBoundingClientRect().top)),
    );
    expect(new Set(tops).size).toBe(1);

    const workspaceCard = cards.first();
    await expect(workspaceCard.locator('.stat-status')).toBeVisible();
    await expect(workspaceCard.locator('.stat-value')).toHaveCount(0);

    const fontSize = await workspaceCard
      .locator('.stat-status')
      .evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    expect(fontSize).toBeLessThanOrEqual(9);
  });
});

test.describe('Workspace status chip title aligned (round 6)', () => {
  test('desktop 1440×900: all stat-card titles share the same vertical position', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await goto(page, '/vi/workspace');

    const cards = page.locator('.stats .stat-card');
    const cardCount = await cards.count();
    expect(cardCount).toBe(3);

    // The workspace card (status chip) title must sit on the same baseline as
    // the numeric cards, so the row reads as one aligned block.
    const titleTops = await cards.evaluateAll((els) =>
      els.map((c) => Math.round(c.querySelector('.stat-title')!.getBoundingClientRect().top)),
    );
    expect(new Set(titleTops).size).toBe(1);

    // Whitebox: the status slot must occupy the same vertical box as a
    // `.stat-value` (matching height + margin-bottom) so the blocks equalize.
    const status = cards.first().locator('.stat-status');
    const statusBox = await status.evaluate((el) => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return { h: Math.round(r.height), mb: parseFloat(cs.marginBottom) };
    });
    // Desktop `.stat-value` is 28px × 1.1 ≈ 31px box + 2px margin.
    expect(statusBox.h).toBe(31);
    expect(statusBox.mb).toBe(2);
  });

  test('mobile 390×844: all stat-card titles stay vertically aligned', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await goto(page, '/vi/workspace');

    const cards = page.locator('.stats .stat-card');
    const cardCount = await cards.count();
    expect(cardCount).toBe(3);

    const titleTops = await cards.evaluateAll((els) =>
      els.map((c) => Math.round(c.querySelector('.stat-title')!.getBoundingClientRect().top)),
    );
    expect(new Set(titleTops).size).toBe(1);

    const status = cards.first().locator('.stat-status');
    const statusBox = await status.evaluate((el) => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return { h: Math.round(r.height), mb: parseFloat(cs.marginBottom) };
    });
    // Mobile `.stat-value` is 12px × 1 = 12px box + 0px margin.
    expect(statusBox.h).toBe(12);
    expect(statusBox.mb).toBe(0);
  });
});
