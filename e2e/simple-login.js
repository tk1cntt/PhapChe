const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto('http://localhost:3000/vi/sign-in', { timeout: 10000 });
    console.log('✓ Page loaded:', page.url());

    // Fill credentials
    await page.fill('#signin_email', 'customer.demo@example.test');
    await page.fill('#signin_password', 'Demo@123456');
    console.log('✓ Credentials filled');

    // Click button with text "Đăng nhập"
    const loginBtn = page.locator('button:has-text("Đăng nhập")');
    await loginBtn.click({ timeout: 5000 });
    console.log('✓ Clicked login');

    // Wait for navigation
    await page.waitForTimeout(5000);
    console.log('Current URL:', page.url());

    if (page.url().includes('dashboard') || page.url().includes('an-phat')) {
      console.log('✓ LOGIN SUCCESS!');

      // Go to create page
      await page.goto('http://localhost:3000/vi/create', { timeout: 10000 });
      console.log('✓ Create page:', page.url());

      // Get content
      const html = await page.content();
      const hasService = html.includes('Labor') || html.includes('Hợp đồng') || html.includes('Đại lý');
      const hasWizard = html.includes('Bước') || html.includes('Step') || html.includes('Wizard');
      console.log('Has service types:', hasService ? '✓' : '✗');
      console.log('Has wizard UI:', hasWizard ? '✓' : '✗');

    } else {
      console.log('✗ Login may have failed');
      // Check for error
      const error = await page.textContent('body');
      if (error.includes('không đúng')) {
        console.log('✗ Error: Incorrect credentials');
      }
    }

  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await browser.close();
  }
})();
