import { test, expect } from '@playwright/test';

test.describe('Admin Requests Page - layout/style regression', () => {
  test('page renders without error boundary and keeps requests shell', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/vi/admin/requests');
    await page.waitForLoadState('domcontentloaded');

    const body = await page.locator('body').textContent();
    expect(body).toBeTruthy();
    expect(body!.length).toBeGreaterThan(10);
    expect(body).not.toContain('Something went wrong');
    expect(body).not.toContain('No QueryClient set');
    expect(body).not.toContain('Hydration failed');

    const severeRenderErrors = consoleErrors.filter((error) =>
      /QueryClientProvider|Hydration failed|Minified React error|Cannot read properties/i.test(error)
    );
    expect(severeRenderErrors).toEqual([]);
  });

  test('authenticated/admin content uses mock-compatible selectors when visible', async ({ page }) => {
    await page.goto('/vi/admin/requests');
    await page.waitForLoadState('networkidle');

    const pageTitle = page.getByRole('heading', { name: 'Hồ sơ yêu cầu' });
    if (await pageTitle.count()) {
      await expect(pageTitle).toBeVisible();
      await expect(page.getByTestId('admin-requests-toolbar')).toBeVisible();
      await expect(page.getByTestId('admin-requests-table')).toBeVisible();
      await expect(page.getByText('Mã hồ sơ')).toBeVisible();
      await expect(page.getByText('Workspace')).toBeVisible();
      await expect(page.getByText('Khách hàng')).toBeVisible();
      await expect(page.getByText('Trạng thái')).toBeVisible();
    } else {
      await expect(page.locator('body')).not.toContainText(/Something went wrong|No QueryClient set|Hydration failed/i);
    }
  });
});
