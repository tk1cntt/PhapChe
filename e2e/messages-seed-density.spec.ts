/**
 * Scout-fix regression E2E — seeded conversation density (captain F4)
 *
 * The captain feedback: "Luồng hội thoai: Cần seed thêm data để hiển thị cho
 * đầy đủ và xem đc kết quả thực tế". Before the fix the DB had only 30
 * messages — one per thread — so opening a chat showed a single empty bubble.
 *
 * Fix (prisma/seed.ts): every demo thread now gets a full conversation
 * (4–8 messages alternating customer/specialist) and ~1/3 of threads keep a
 * newest unread specialist reply so the list shows a realistic unread state.
 *
 * DB expectation after `npm run seed`: 16+ threads, each 4–8 messages.
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

test.describe('Seeded conversation density on messages page', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('list shows a healthy number of threads (≥4)', async ({ page }) => {
    await goto(page, '/vi/messages');

    const threads = page.locator('.thread');
    await expect(threads.first()).toBeVisible();

    const count = await threads.count();
    expect(count).toBeGreaterThanOrEqual(4);

    // Each thread preview shows real content, not an empty placeholder.
    const firstText = await threads.first().innerText();
    expect(firstText.trim().length).toBeGreaterThan(10);
  });

  test('opening a thread shows a real multi-message conversation (≥3 bubbles)', async ({ page }) => {
    await goto(page, '/vi/messages');

    // Pick a thread with a full seeded conversation.
    const demoThread = page.locator('.thread', { hasText: 'DEMO-' }).first();
    await demoThread.click();
    await page.waitForTimeout(1000);

    // Chat bubbles: `.msg.in` (specialist) + `.msg.out` (customer).
    const bubbles = page.locator('.msg-list .msg, .msg.in, .msg.out');
    const count = await bubbles.count();
    expect(count).toBeGreaterThanOrEqual(3);

    // At least one customer bubble (out) exists so the conversation is two-way.
    const outCount = await page.locator('.msg.out').count();
    expect(outCount).toBeGreaterThanOrEqual(1);
  });

  test('messages render cũ → mới: first bubble is the opening message, last is the newest', async ({ page }) => {
    await goto(page, '/vi/messages');

    // The first `.thread` is the "Phase 16 fixture request" (sorted first by
    // updatedAt DESC) which now carries a full seeded conversation — the
    // opening customer message must be the FIRST bubble and the newest
    // specialist reply must be the LAST bubble.
    await page.locator('.thread').first().click();
    await page.waitForTimeout(1000);

    const bubbles = page.locator('.msg');
    await expect(bubbles.first()).toBeVisible();
    const count = await bubbles.count();
    expect(count).toBeGreaterThanOrEqual(3);

    const firstText = (await bubbles.first().innerText()).trim();
    const lastText = (await bubbles.last().innerText()).trim();

    // Opening message is the customer's first request (cũ nhất).
    expect(firstText).toContain('Chào em');
    // The newest message is the specialist's closing reply (mới nhất).
    expect(lastText).toContain('Dạ em đã gửi');
  });

  test('seed unread tail is visible to the user via the unread-count API', async ({ page }) => {
    await goto(page, '/vi/messages');

    // The seed writes ~1/3 of threads with a newest unread specialist reply.
    // The UI surfaces this through the `/api/messages/unread-count` badge on
    // the top nav (ThreadItem intentionally renders no per-row unread style),
    // so assert the data path the user actually sees.
    const unread = await page.evaluate(() =>
      fetch('/api/messages/unread-count').then((r) => r.json()),
    );
    expect(Number(unread.unreadCount)).toBeGreaterThanOrEqual(1);

    // The thread list itself must exist and be non-empty regardless.
    const threads = page.locator('.thread');
    await expect(threads.first()).toBeVisible();
  });
});
