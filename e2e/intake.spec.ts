import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

test.describe('Intake Flow', () => {
  test('renders intake page with header', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/intake');
    await expect(page.locator('text=Gửi yêu cầu pháp lý')).toBeVisible();
    await expect(page.locator('text=Dịch vụ')).toBeVisible();
  });

  test('shows service selection options', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/intake');
    const options = page.locator('.ant-radio-wrapper').first();
    await expect(options).toBeVisible();
  });

  test('can select service option', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/intake');
    const option = page.locator('.ant-radio-wrapper').first();
    await option.click();
    await expect(option).toHaveClass(/ant-radio-wrapper-checked/);
  });

  test('proceeds to questions step when clicking continue', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/intake');
    await page.click('button:has-text("Tiếp tục")');
    await page.waitForTimeout(1000);
    await expect(page.locator('text=Thông tin cần cung cấp')).toBeVisible({ timeout: 5000 });
  });

  test('shows upload step after questions', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/intake');
    await page.click('button:has-text("Tiếp tục")');
    await page.waitForTimeout(2000);
    await expect(page.locator('text=Tài liệu hỗ trợ')).toBeVisible({ timeout: 5000 });
  });
});
