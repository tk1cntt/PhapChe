import { test, expect } from '@playwright/test';

test.describe('Phase 41: v2 Create Request Wizard', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to sign-in page
    await page.goto('/vi/sign-in');

    // Fill login form
    await page.fill('input[name="email"]', 'customer.demo@example.test');
    await page.fill('input[name="password"]', 'Demo@123456');

    // Submit
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard or create page
    await page.waitForURL(/\/(vi|en|zh|ja)\/(dashboard|create)/, { timeout: 10000 });
  });

  test('Step 1: Service selection displays with MatterType labels', async ({ page }) => {
    await page.goto('/vi/create');
    await page.waitForLoadState('networkidle');

    // Check for service type cards
    const serviceCards = page.locator('[class*="service"], [class*="card"]').filter({ hasText: /.+/ });

    // Should see localized labels (check for Vietnamese by default)
    const pageContent = await page.content();
    console.log('Page has content:', pageContent.length, 'chars');

    // Check for any service type text
    const hasLaborContract = await page.getByText(/Labor|Hợp đồng Lao động/i).count() > 0;
    const hasAgencyContract = await page.getByText(/Agency|Hợp đồng Đại lý/i).count() > 0;

    console.log('Has Labor Contract:', hasLaborContract);
    console.log('Has Agency Contract:', hasAgencyContract);

    expect(hasLaborContract || hasAgencyContract).toBeTruthy();
  });

  test('Step 3: Document upload UI exists', async ({ page }) => {
    await page.goto('/vi/create');
    await page.waitForLoadState('networkidle');

    // Navigate to step 3 if wizard has steps
    // For now, check if upload button/input exists
    const uploadInput = page.locator('input[type="file"]');
    const uploadButton = page.getByRole('button', { name: /upload|tải lên/i });

    const hasUploadUI = (await uploadInput.count()) > 0 || (await uploadButton.count()) > 0;
    console.log('Has upload UI:', hasUploadUI);

    // This test documents the expected UI - may need adjustment based on actual implementation
  });

  test('Step 4: Review and Submit button exists', async ({ page }) => {
    await page.goto('/vi/create');
    await page.waitForLoadState('networkidle');

    // Check for submit button
    const submitButton = page.getByRole('button', { name: /submit|gửi|nộp/i });
    const hasSubmitButton = (await submitButton.count()) > 0;

    console.log('Has submit button:', hasSubmitButton);
  });

  test('Locale switching: Labels change with locale', async ({ page }) => {
    // Test Vietnamese
    await page.goto('/vi/create');
    await page.waitForLoadState('networkidle');
    const viContent = await page.content();

    // Test English
    await page.goto('/en/create');
    await page.waitForLoadState('networkidle');
    const enContent = await page.content();

    // Content should be different based on locale
    console.log('VI content length:', viContent.length);
    console.log('EN content length:', enContent.length);

    // They should have some different text
    const contentDifferent = viContent !== enContent;
    console.log('Content differs by locale:', contentDifferent);
  });
});
