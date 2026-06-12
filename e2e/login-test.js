const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // Go to sign-in page
    await page.goto('http://localhost:3000/vi/sign-in');
    await page.waitForLoadState('networkidle');

    console.log('✓ Sign-in page loaded');

    // Fill login form
    await page.fill('input[placeholder="Email"]', 'customer.demo@example.test');
    await page.fill('input[placeholder="Mật khẩu"]', 'Demo@123456');

    console.log('✓ Credentials entered');

    // Click login button
    await page.click('button[type="submit"]');

    // Wait for navigation
    await page.waitForTimeout(3000);
    const url = page.url();

    console.log('Current URL:', url);

    if (url.includes('/vi/dashboard') || url.includes('/an-phat')) {
      console.log('✓ Login successful!');

      // Navigate to create page
      await page.goto('http://localhost:3000/vi/create');
      await page.waitForLoadState('networkidle');

      console.log('✓ Create page loaded:', page.url());

      // Check for service type labels
      const content = await page.content();
      const hasServiceType = content.includes('Labor') || content.includes('Hợp đồng') || content.includes('Contract');
      console.log('Has service types:', hasServiceType ? '✓' : '✗');

    } else if (url.includes('/sign-in')) {
      console.log('✗ Login failed - still on sign-in page');
      // Check for error message
      const errorText = await page.textContent('body');
      if (errorText.includes('không đúng')) {
        console.log('✗ Error: Email hoặc mật khẩu không đúng');
      }
    } else {
      console.log('Unexpected URL:', url);
    }

  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await browser.close();
  }
})();
