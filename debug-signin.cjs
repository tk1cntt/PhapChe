const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const responses = [];
  page.on('response', r => responses.push({ url: r.url(), status: r.status() }));
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));

  await page.goto('http://localhost:3000/sign-in', { waitUntil: 'networkidle' });

  await page.locator('input[type=email], input[name=email]').first().fill('admin.demo@example.test');
  await page.locator('input[type=password]').first().fill('Demo@123456');
  await page.locator('button[type=submit]').first().click();

  await page.waitForTimeout(5000);

  console.log('Final URL:', page.url());
  console.log('Errors:', errors.slice(0, 5));

  const authCalls = responses.filter(r => r.url.includes('/api/auth'));
  console.log('Auth API calls:');
  for (const c of authCalls) {
    console.log(`  ${c.status} ${c.url}`);
  }

  await browser.close();
})().catch(e => console.error(e.message));
