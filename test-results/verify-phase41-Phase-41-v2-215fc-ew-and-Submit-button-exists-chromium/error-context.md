# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: verify-phase41.spec.ts >> Phase 41: v2 Create Request Wizard >> Step 4: Review and Submit button exists
- Location: e2e\verify-phase41.spec.ts:55:7

# Error details

```
Test timeout of 30000ms exceeded while running "beforeEach" hook.
```

```
Error: page.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('input[name="email"]')

```

# Page snapshot

```yaml
- generic [ref=e2]: Internal Server Error
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Phase 41: v2 Create Request Wizard', () => {
  4  |   test.beforeEach(async ({ page }) => {
  5  |     // Navigate to sign-in page
  6  |     await page.goto('/vi/sign-in');
  7  | 
  8  |     // Fill login form
> 9  |     await page.fill('input[name="email"]', 'customer.demo@example.test');
     |                ^ Error: page.fill: Test timeout of 30000ms exceeded.
  10 |     await page.fill('input[name="password"]', 'Demo@123456');
  11 | 
  12 |     // Submit
  13 |     await page.click('button[type="submit"]');
  14 | 
  15 |     // Wait for redirect to dashboard or create page
  16 |     await page.waitForURL(/\/(vi|en|zh|ja)\/(dashboard|create)/, { timeout: 10000 });
  17 |   });
  18 | 
  19 |   test('Step 1: Service selection displays with MatterType labels', async ({ page }) => {
  20 |     await page.goto('/vi/create');
  21 |     await page.waitForLoadState('networkidle');
  22 | 
  23 |     // Check for service type cards
  24 |     const serviceCards = page.locator('[class*="service"], [class*="card"]').filter({ hasText: /.+/ });
  25 | 
  26 |     // Should see localized labels (check for Vietnamese by default)
  27 |     const pageContent = await page.content();
  28 |     console.log('Page has content:', pageContent.length, 'chars');
  29 | 
  30 |     // Check for any service type text
  31 |     const hasLaborContract = await page.getByText(/Labor|Hợp đồng Lao động/i).count() > 0;
  32 |     const hasAgencyContract = await page.getByText(/Agency|Hợp đồng Đại lý/i).count() > 0;
  33 | 
  34 |     console.log('Has Labor Contract:', hasLaborContract);
  35 |     console.log('Has Agency Contract:', hasAgencyContract);
  36 | 
  37 |     expect(hasLaborContract || hasAgencyContract).toBeTruthy();
  38 |   });
  39 | 
  40 |   test('Step 3: Document upload UI exists', async ({ page }) => {
  41 |     await page.goto('/vi/create');
  42 |     await page.waitForLoadState('networkidle');
  43 | 
  44 |     // Navigate to step 3 if wizard has steps
  45 |     // For now, check if upload button/input exists
  46 |     const uploadInput = page.locator('input[type="file"]');
  47 |     const uploadButton = page.getByRole('button', { name: /upload|tải lên/i });
  48 | 
  49 |     const hasUploadUI = (await uploadInput.count()) > 0 || (await uploadButton.count()) > 0;
  50 |     console.log('Has upload UI:', hasUploadUI);
  51 | 
  52 |     // This test documents the expected UI - may need adjustment based on actual implementation
  53 |   });
  54 | 
  55 |   test('Step 4: Review and Submit button exists', async ({ page }) => {
  56 |     await page.goto('/vi/create');
  57 |     await page.waitForLoadState('networkidle');
  58 | 
  59 |     // Check for submit button
  60 |     const submitButton = page.getByRole('button', { name: /submit|gửi|nộp/i });
  61 |     const hasSubmitButton = (await submitButton.count()) > 0;
  62 | 
  63 |     console.log('Has submit button:', hasSubmitButton);
  64 |   });
  65 | 
  66 |   test('Locale switching: Labels change with locale', async ({ page }) => {
  67 |     // Test Vietnamese
  68 |     await page.goto('/vi/create');
  69 |     await page.waitForLoadState('networkidle');
  70 |     const viContent = await page.content();
  71 | 
  72 |     // Test English
  73 |     await page.goto('/en/create');
  74 |     await page.waitForLoadState('networkidle');
  75 |     const enContent = await page.content();
  76 | 
  77 |     // Content should be different based on locale
  78 |     console.log('VI content length:', viContent.length);
  79 |     console.log('EN content length:', enContent.length);
  80 | 
  81 |     // They should have some different text
  82 |     const contentDifferent = viContent !== enContent;
  83 |     console.log('Content differs by locale:', contentDifferent);
  84 |   });
  85 | });
  86 | 
```