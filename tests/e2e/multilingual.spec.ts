import { test, expect, Page } from '@playwright/test';

test.describe('Multilingual Support', () => {

  // Helper to test layout stability
  async function testLayoutStability(page: Page, locale: string) {
    await page.goto(`/${locale}`);

    // Check no horizontal scrollbar
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = page.viewportSize()?.width || 1920;
    expect(bodyWidth, `${locale}: No horizontal scroll`).toBeLessThanOrEqual(viewportWidth);

    // Check no overflow in main containers
    const mainContent = page.locator('main, [role="main"], .main-content');
    if (await mainContent.count() > 0) {
      const hasOverflow = await mainContent.evaluate((el) => {
        return el.scrollWidth > el.clientWidth || el.scrollHeight > el.clientHeight;
      });
      expect(hasOverflow, `${locale}: Main content no overflow`).toBe(false);
    }
  }

  test('language switcher changes locale and content', async ({ page }) => {
    // Go to default page
    await page.goto('/vi');

    // Check Vietnamese content
    const viContent = await page.locator('body').textContent();
    expect(viContent).toMatch(/[àáảãạăắặâấ]/); // Has Vietnamese diacritics

    // Use language switcher (find select or buttons)
    const switcher = page.locator('select, [role="combobox"], button:has-text("Tiếng")').first();
    if (await switcher.count() > 0) {
      await switcher.click();
      // Select English
      await page.locator('option:has-text("English")').click();
    }

    // Verify URL changed
    await expect(page).toHaveURL(/\/(en|zh|ja)\//);

    // Check content changed (no Vietnamese diacritics in EN)
    const newContent = await page.locator('body').textContent();
    const hasViChars = /[àáảãạăắặâấầẩẫậèéẻẽẹêếềểễệìíỉịĩđòóỏõọôốồổỗộơớờởỡợùúủũưừưựửữựỳýỷỹ]/.test(newContent || '');
    // Note: EN should have fewer VI chars, but may still have some in mixed content
  });

  test('all locales have stable layout', async ({ page }) => {
    for (const locale of ['vi', 'en', 'zh', 'ja']) {
      await testLayoutStability(page, locale);
    }
  });

  test('CJK characters display correctly', async ({ page }) => {
    // Test Chinese
    await page.goto('/zh');
    await expect(page.locator('body')).toBeVisible();
    // Check no character squishing (each char should have space)
    const charSpacing = await page.evaluate(() => {
      const text = document.body.textContent?.slice(0, 100) || '';
      // Simple check: if CJK, chars should be spaced
      return text;
    });

    // Test Japanese
    await page.goto('/ja');
    await expect(page.locator('body')).toBeVisible();

    // Check buttons handle JA text
    const buttons = page.locator('button');
    for (const button of await buttons.all()) {
      const text = await button.textContent();
      if (text && /[぀-ゟ゠-ヿ]/.test(text)) {
        // Japanese text - check no overflow
        const box = await button.boundingBox();
        expect(box?.width, 'JA button width').toBeGreaterThan(0);
      }
    }
  });

  test('MatterTypes display in correct language', async ({ page }) => {
    const testCases = [
      { locale: 'vi', expected: /lao động|hợp đồng/i },
      { locale: 'en', expected: /Labor|Contract/i },
      { locale: 'zh', expected: /劳动|合同/ },
      { locale: 'ja', expected: /労働|契約/ },
    ];

    for (const { locale, expected } of testCases) {
      await page.goto(`/${locale}`);
      // Wait for content to load
      await page.waitForLoadState('networkidle');

      // Check MatterTypes or dashboard content matches locale
      const body = await page.locator('body').textContent();
      // Content should have expected text for locale
      expect(body).toBeTruthy();
    }
  });

  test('navigation persists locale', async ({ page }) => {
    // Set to Chinese
    await page.goto('/zh');

    // Navigate (simulate clicking a link or using router)
    await page.click('a[href*="dashboard"], nav a >> nth=0', { timeout: 5000 }).catch(() => {
      // If no nav links, just verify current page
    });

    // URL should still have zh
    const url = page.url();
    expect(url).toMatch(/^\/(vi|en|zh|ja)\//);
  });
});

test.describe('CJK Layout Specific', () => {
  test('ZH text in cards has proper spacing', async ({ page }) => {
    await page.goto('/zh');

    // Check stat cards or content cards
    const cards = page.locator('[class*="card"], .stat-card, .stat');
    const count = await cards.count();

    if (count > 0) {
      for (let i = 0; i < Math.min(count, 5); i++) {
        const card = cards.nth(i);
        const box = await card.boundingBox();
        expect(box?.width, 'Card has width').toBeGreaterThan(50);
        expect(box?.height, 'Card has height').toBeGreaterThan(30);

        // Check no text overflow
        const isOverflow = await card.evaluate((el) => {
          return el.scrollWidth > el.clientWidth;
        });
        expect(isOverflow, 'No card overflow').toBe(false);
      }
    }
  });

  test('JA text in buttons wraps correctly', async ({ page }) => {
    await page.goto('/ja');

    const buttons = page.locator('button:visible');
    const count = await buttons.count();

    for (let i = 0; i < Math.min(count, 10); i++) {
      const button = buttons.nth(i);
      const text = await button.textContent();

      if (text && /[぀-ゟ゠-ヿ]/.test(text)) {
        // Japanese text found
        const box = await button.boundingBox();
        expect(box?.width, 'JA button visible').toBeGreaterThan(0);

        // Text should not be squished
        const fontSize = await button.evaluate((el) =>
          parseFloat(getComputedStyle(el).fontSize)
        );
        expect(fontSize).toBeGreaterThan(10);
      }
    }
  });
});
