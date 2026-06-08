import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

test.describe('Request status page', () => {
  test('renders submitted request detail without blank-screen component errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });

    await loginAs(page, 'admin');
    if (page.url().includes('/sign-in')) test.skip(true, 'Skipped: Database not seeded.');

    await page.goto('/intake');
    await page.locator('.ant-radio-wrapper').first().click();
    await page.locator('button:has-text("Tiếp tục")').click();

    await page.waitForURL(/\/intake\?.*step=1/, { timeout: 10000 });
    await page.fill('input[name="answer.partner_name"]', 'Request Status E2E Company');
    await page.fill('input[name="answer.commission_rate"]', '12%');
    await page.fill('input[name="answer.contract_term"]', '18 tháng');
    await page.locator('button:has-text("Lưu câu trả lời")').click();

    await page.waitForURL(/\/intake\?.*step=2/, { timeout: 10000 });
    await page.locator('button:has-text("Tiếp tục")').click();

    await page.waitForURL(/\/intake\?.*step=3/, { timeout: 10000 });
    await page.locator('button:has-text("Gửi yêu cầu")').click();

    await page.waitForURL(/\/requests\/[a-zA-Z0-9-]+/, { timeout: 15000 });

    await expect(page.locator('main')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Đã gửi yêu cầu' })).toBeVisible();
    await expect(page.getByText('Mã hồ sơ')).toBeVisible();
    await expect(page.getByText('Thông tin hồ sơ')).toBeVisible();
    await expect(page.locator('body')).toContainText('Request Status E2E Company');

    expect(consoleErrors.join('\n')).not.toContain('Element type is invalid');
  });
});
