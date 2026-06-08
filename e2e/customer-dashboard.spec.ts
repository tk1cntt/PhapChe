import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

test.describe('Customer request dashboard', () => {
  test('shows an intake-created request and links to status detail', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });

    await loginAs(page, 'customer');
    if (page.url().includes('/sign-in')) test.skip(true, 'Skipped: Database not seeded.');

    await page.goto('/intake');
    await page.locator('.ant-radio-wrapper').first().click();
    await page.locator('button:has-text("Tiếp tục")').click();

    await page.waitForURL(/\/intake\?requestId=.*step=1/, { timeout: 10000 });
    await page.fill('input[name="answer.partner_name"]', 'Customer Dashboard E2E Company');
    await page.fill('input[name="answer.commission_rate"]', '11%');
    await page.fill('input[name="answer.contract_term"]', '12 tháng');
    await page.locator('button:has-text("Lưu câu trả lời")').click();

    await page.waitForURL(/\/intake\?.*step=2/, { timeout: 10000 });
    await page.locator('button:has-text("Tiếp tục")').click();

    await page.waitForURL(/\/intake\?.*step=3/, { timeout: 10000 });
    await page.locator('button:has-text("Gửi yêu cầu")').click();

    await page.waitForURL(/\/requests\/[a-zA-Z0-9-]+/, { timeout: 15000 });
    const statusUrl = page.url();
    const requestId = statusUrl.split('/requests/')[1];

    await expect(page.getByRole('heading', { name: 'Đã gửi yêu cầu' })).toBeVisible();
    await expect(page.getByText('Mã hồ sơ')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Xem tất cả yêu cầu của tôi' })).toBeVisible();

    await page.getByRole('link', { name: 'Xem tất cả yêu cầu của tôi' }).click();
    await page.waitForURL('/customer/requests', { timeout: 10000 });

    await expect(page.getByRole('heading', { name: 'Yêu cầu của tôi' })).toBeVisible();
    const createdRequestLink = page.getByRole('link', { name: 'Xem trạng thái' }).and(page.locator(`a[href="/requests/${requestId}"]`));
    await expect(createdRequestLink).toBeVisible();
    await expect(page.getByRole('link', { name: 'Xem tài liệu' })).toHaveCount(0);

    await createdRequestLink.click();
    await page.waitForURL(`/requests/${requestId}`, { timeout: 10000 });
    await expect(page.getByRole('heading', { name: 'Đã gửi yêu cầu' })).toBeVisible();

    expect(consoleErrors.join('\n')).not.toContain('Element type is invalid');
  });
});
