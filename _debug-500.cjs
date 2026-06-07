const { chromium } = require('playwright');

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const BASE = 'http://localhost:3001';

  const logs = [];
  page.on('console', msg => logs.push(`[${msg.type()}] ${msg.text().slice(0, 300)}`));
  page.on('pageerror', e => logs.push(`[PAGEERROR] ${e.message.slice(0, 300)}`));

  // Auth
  await page.goto(BASE + '/sign-in', { waitUntil: 'networkidle', timeout: 30000 });
  await page.locator('#signin_email, input[id*="email"]').first().fill('admin.demo@example.test');
  await page.locator('input[type="password"]').first().fill('Demo@123456');
  await page.locator('button[type="submit"]').first().click();
  await page.waitForTimeout(3000);
  console.log('Signed in, URL:', page.url());

  // Navigate to ops
  await page.goto(BASE + '/admin/ops', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);
  console.log('Ops URL:', page.url());
  const bodyText = await page.locator('body').innerText({ timeout: 3000 }).catch(() => '');
  console.log('Body preview:', bodyText.slice(0, 300));

  const errorLogs = logs.filter(l => l.includes('error') || l.includes('Error') || l.includes('undefined') || l.includes('invalid'));
  if (errorLogs.length) {
    console.log('\nErrors:');
    errorLogs.forEach(l => console.log(' ', l));
  }

  await browser.close();
}

main().catch(e => { console.error('ERR:', e.message); process.exit(1); });
