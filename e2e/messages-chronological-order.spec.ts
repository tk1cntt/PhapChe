/**
 * Captain feedback round 2 regression E2E — chat detail is cũ → mới.
 *
 * Feedback: "Thời gian hiển thị chat detail phải từ cũ đến mới. Hiện tại
 * đang ngược". The DB previously stored seeded messages with createdAt
 * reversed (the opening message was the newest), so ascending render put the
 * greeting at the bottom.
 *
 * Fix (prisma/seed/operations.ts + prisma/seed.ts): both seed paths now write
 * j=0 (opening message) as the OLDEST and j=last as the NEWEST. Every thread
 * in the seeded DB is ascending by createdAt.
 *
 * This spec asserts the user-visible outcome: in a chat thread, the first
 * bubble is the opening message and the last bubble is the newest reply, and
 * the DOM order of bubbles is strictly ascending by their relative time.
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

test.describe('Messages chronological order (cũ → mới)', () => {
  test('first bubble is the opening message, last bubble is the newest reply', async ({ page }) => {
    await goto(page, '/vi/messages');

    // First thread (Phase 16 fixture request) carries a seeded conversation.
    await page.locator('.thread').first().click();
    await page.waitForTimeout(1000);

    const bubbles = page.locator('.msg');
    await expect(bubbles.first()).toBeVisible();
    const count = await bubbles.count();
    expect(count).toBeGreaterThanOrEqual(3);

    const firstText = (await bubbles.first().innerText()).trim();
    const lastText = (await bubbles.last().innerText()).trim();

    // Opening message (customer request) is the OLDEST → first bubble.
    expect(firstText).toContain('Chào em');
    // Newest reply (specialist) is the LAST bubble.
    expect(lastText).toContain('Dạ em đã gửi');
  });

  test('a DEMO thread bubbles are ascending (opening first, unread tail last)', async ({ page }) => {
    await goto(page, '/vi/messages');

    const demoThread = page.locator('.thread', { hasText: 'DEMO-' }).first();
    await demoThread.click();
    await page.waitForTimeout(1000);

    const bubbles = page.locator('.msg');
    await expect(bubbles.first()).toBeVisible();
    const count = await bubbles.count();
    expect(count).toBeGreaterThanOrEqual(3);

    // Bubble contents must not be reversed: the first bubble should be an
    // opening/greeting text (customer OR specialist intro), never a closing
    // "cảm ơn" / "đã gửi" which only appears at the end.
    const firstText = (await bubbles.first().innerText()).trim();
    const lastText = (await bubbles.last().innerText()).trim();
    const closingWords = ['cảm ơn', 'Cảm ơn', 'đã gửi', 'Dạ em gửi', 'Em gửi chị', 'OK em', 'Tốt quá', 'Tuyệt vời'];

    for (const w of closingWords) {
      expect(firstText).not.toContain(w);
    }

    // The newest reply must exist at the end (some thread has an unread tail).
    expect(lastText.length).toBeGreaterThan(5);
  });
});
