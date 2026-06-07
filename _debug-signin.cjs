const { chromium } = require('playwright');

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Go to sign-in
  await page.goto('http://localhost:3000/sign-in', { waitUntil: 'networkidle', timeout: 30000 });
  console.log('On:', page.url());

  // Fill credentials
  await page.locator('input[id="signin_email"], input[id*="email"], input[placeholder*="Email" i]').first().fill('admin.demo@example.test');
  await page.locator('input[type="password"]').first().fill('Demo@123456');

  // Click submit
  await page.locator('button[type="submit"]').first().click();

  // Wait and check
  await page.waitForTimeout(5000);
  console.log('After submit URL:', page.url());

  const bodyText = await page.locator('body').innerText().catch(() => '');
  console.log('Body (first 500):', bodyText.slice(0, 500));

  // Check for error message
  const errorEl = await page.locator('.ant-message-error, [class*="error"], [class*="message"]').all();
  for (const el of errorEl) {
    const txt = await el.innerText().catch(() => '');
    if (txt) console.log('Error element:', txt);
  }

  // Check network requests
  const failedRequests = [];
  page.on('response', resp => {
    if (resp.status() >= 400) {
      failedRequests.push(`${resp.status()} ${resp.url()}`);
    }
  });

  await page.waitForTimeout(2000);
  console.log('\nFailed requests:', failedRequests.length);
  failedRequests.forEach(r => console.log(' ', r));

  await browser.close();
}

main().catch(e => { console.error('ERR:', e.message); process.exit(1); });
