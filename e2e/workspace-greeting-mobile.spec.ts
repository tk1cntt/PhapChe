/**
 * Scout-fix regression E2E — Workspace mobile greeting compact (captain F2)
 *
 * The captain screenshot showed the workspace greeting on a ≤479px phone:
 *   - h2 at 24px + a long subtitle + the "Mời thành viên" button wrapping onto
 *     two lines made the banner tall and noisy.
 * Fix (src/styles/pages/workspace.css, @media max-width: 479px):
 *   - h2 compacted to 18px (inline 24px style removed from WorkspaceBanner.tsx)
 *   - `.subtitle` hidden
 *   - `.create-btn` shortened (38px, 13px, white-space: nowrap)
 *   - banner keeps `align-items:center` + `flex-wrap:wrap`, no horizontal overflow
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

test.describe('Workspace greeting compact on small phones (≤479px)', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('banner h2 is compact (≤20px) and subtitle is hidden', async ({ page }) => {
    await goto(page, '/vi/workspace');

    const banner = page.locator('.workspace-banner');
    await expect(banner).toBeVisible();

    const h2 = banner.locator('h2');
    await expect(h2).toContainText(/./); // non-empty title

    const h2Size = await h2.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    expect(h2Size).toBeLessThanOrEqual(20);

    // Subtitle is not visible on small phones.
    const subtitle = banner.locator('.subtitle');
    const subtitleDisplay = await subtitle.evaluate((el) => getComputedStyle(el).display);
    expect(subtitleDisplay).toBe('none');
  });

  test('invite button stays on one line and banner has no horizontal overflow', async ({ page }) => {
    await goto(page, '/vi/workspace');

    const banner = page.locator('.workspace-banner');
    const btn = banner.locator('.create-btn');
    await expect(btn).toBeVisible();

    const btnStyle = await btn.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { whiteSpace: cs.whiteSpace, fontSize: cs.fontSize, height: cs.height };
    });
    expect(btnStyle.whiteSpace).toBe('nowrap');

    // Button must not wrap onto a second line: its height stays compact.
    const btnH = parseFloat(btnStyle.height);
    expect(btnH).toBeLessThanOrEqual(42);

    // No horizontal overflow anywhere on the page.
    const { scrollWidth, clientWidth } = await page.evaluate(() => {
      const el = document.scrollingElement as HTMLElement;
      return { scrollWidth: el.scrollWidth, clientWidth: el.clientWidth };
    });
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });

  test('banner remains center-aligned + wrap at mobile width', async ({ page }) => {
    await goto(page, '/vi/workspace');

    const banner = page.locator('.workspace-banner');
    await expect(banner).toBeVisible();

    const styles = await banner.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { alignItems: cs.alignItems, flexWrap: cs.flexWrap };
    });
    expect(styles.alignItems).toBe('center');
    expect(styles.flexWrap).toBe('wrap');
  });
});

test.describe('Workspace greeting desktop regression guard', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('desktop keeps full-size title + visible subtitle + 45px button', async ({ page }) => {
    await goto(page, '/vi/workspace');

    const banner = page.locator('.workspace-banner');
    await expect(banner).toBeVisible();

    const h2Size = await banner.locator('h2').evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    expect(h2Size).toBeGreaterThanOrEqual(22);

    const subtitleDisplay = await banner
      .locator('.subtitle')
      .evaluate((el) => getComputedStyle(el).display);
    expect(subtitleDisplay).not.toBe('none');

    const btnH = await banner.locator('.create-btn').evaluate((el) => parseFloat(getComputedStyle(el).height));
    expect(btnH).toBeGreaterThanOrEqual(44);
  });
});
