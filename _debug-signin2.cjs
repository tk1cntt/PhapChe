const { chromium } = require('playwright');

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const allRequests = [];
  page.on('request', req => {
    allRequests.push({ method: req.method(), url: req.url() });
  });
  page.on('response', resp => {
    allRequests.push({ status: resp.status(), url: resp.url() });
  });

  await page.goto('http://localhost:3000/sign-in', { waitUntil: 'networkidle', timeout: 30000 });
  console.log('On:', page.url());

  await page.locator('input[id="signin_email"], input[id*="email"], input[placeholder*="Email" i]').first().fill('admin.demo@example.test');
  await page.locator('input[type="password"]').first().fill('Demo@123456');
  await page.locator('button[type="submit"]').first().click();

  await page.waitForTimeout(8000);
  console.log('After submit URL:', page.url());

  // Filter to auth-related requests
  const authReqs = allRequests.filter(r => r.url && r.url.includes('/api/auth'));
  console.log('\nAuth requests:');
  authReqs.forEach(r => console.log(' ', JSON.stringify(r)));

  // Also check if there are any console errors
  const logs = [];
  page.on('console', msg => logs.push(`[${msg.type()}] ${msg.text()}`));

  await browser.close();
}

main().catch(e => { console.error('ERR:', e.message); process.exit(1); });
