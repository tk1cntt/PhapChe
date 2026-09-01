/**
 * Captain feedback round 4 regression E2E — i18n missing keys on /vi/messages.
 *
 * Feedback (round 4): "Lỗi chưa tạo key trên trang messages" — the message
 * thread list rendered raw keys `UserMessages.minutesAgo` / `UserMessages.hoursAgo`
 * / `UserMessages.daysAgo` instead of translated relative-time labels.
 *
 * Root cause: `src/app/[locale]/messages/page.tsx` `formatRelativeTime` calls
 * `t('minutesAgo'|'hoursAgo'|'daysAgo')` under the `UserMessages` namespace,
 * but the `UserMessages` block in every locale JSON (`vi`/`en`/`ja`/`zh`)
 * only had `justNow` — those three keys were missing → next-intl fell back to
 * rendering the raw key string inside `.thread-meta`.
 *
 * Fix: added `minutesAgo`/`hoursAgo`/`daysAgo` to the `UserMessages` block in
 * all four locale files (`{count} phút trước` / `{count} minutes ago` /
 * `{count}分前` / `{count}分钟前` …).
 *
 * This spec asserts the user-visible outcome: no raw `UserMessages.*` key is
 * rendered in the thread list, and relative-time labels show translated text.
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

test.describe('Messages i18n relative-time keys present (round 4)', () => {
  test('vi desktop: no raw UserMessages.* keys; thread-meta shows translated relative time', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await goto(page, '/vi/messages');

    const metas = page.locator('.thread-meta');
    await expect(metas.first()).toBeVisible();

    const texts = await metas.allTextContents();
    expect(texts.length).toBeGreaterThan(0);
    // No raw key leaked into the DOM.
    for (const t of texts) {
      expect(t).not.toMatch(/UserMessages\./);
    }
    // At least one translated relative-time label ("phút/giờ/ngày trước" or "vừa xong").
    const hasTranslated = texts.some((t) =>
      /(phút trước|giờ trước|ngày trước|vừa xong)/.test(t.trim()),
    );
    expect(hasTranslated).toBe(true);
  });

  test('vi mobile: no raw keys and relative times render compact', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await goto(page, '/vi/messages');

    const metas = page.locator('.thread-meta');
    await expect(metas.first()).toBeVisible();

    const texts = await metas.allTextContents();
    for (const t of texts) {
      expect(t).not.toMatch(/UserMessages\./);
    }
    const hasTranslated = texts.some((t) =>
      /(phút trước|giờ trước|ngày trước|vừa xong)/.test(t.trim()),
    );
    expect(hasTranslated).toBe(true);
  });

  test('en locale: no raw keys either (translation present across locales)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    // Set preferred-locale=en so middleware Step 1 does not bounce /en → /vi.
    await loginAs(page, 'customer');
    await page.context().addCookies([
      { name: 'preferred-locale', value: 'en', url: 'http://localhost:3000' },
    ]);
    if (page.url().includes('/sign-in')) {
      test.skip(true, 'Skipped: Database not seeded.');
    }
    await page.goto('/en/messages', { waitUntil: 'networkidle', timeout: 30000 });
    expect(page.url()).toContain('/en/messages');

    const metas = page.locator('.thread-meta');
    await expect(metas.first()).toBeVisible();

    const texts = await metas.allTextContents();
    for (const t of texts) {
      expect(t).not.toMatch(/UserMessages\./);
    }
    // Accept either a translated English label or any non-key human text — the
    // critical assertion is that no raw `UserMessages.*` key is rendered.
    const hasReadable = texts.some((t) => /[a-zA-Z]/.test(t.trim()) && !t.includes('UserMessages.'));
    expect(hasReadable).toBe(true);
  });
});
