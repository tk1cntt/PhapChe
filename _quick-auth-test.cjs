const { chromium } = require('playwright');

async function test() {
  const BASE = 'http://localhost:3001';
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message.slice(0, 120)));

  await page.goto(BASE + '/sign-in', { waitUntil: 'networkidle', timeout: 15000 });
  await page.locator('#signin_email, input[id*="email"]').first().fill('admin.demo@example.test');
  await page.locator('input[type="password"]').first().fill('Demo@123456');
  await page.locator('button[type="submit"]').first().click();
  await page.waitForTimeout(3000);

  const pages = [
    '/admin/ops',
    '/admin/routing',
    '/admin/templates',
    '/admin/users',
    '/admin/vault',
  ];

  for (const p of pages) {
    const errors2 = [];
    page.on('pageerror', e => errors2.push(e.message.slice(0, 120)));
    const r = await page.goto(BASE + p, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);
    const body = await page.locator('body').innerText().catch(() => '');
    console.log(`[${p}] status=${r.status()} body=${body.slice(0, 80)} errors=${errors2.join(' | ') || 'none'}`);
  }

  await browser.close();
}

test().catch(e => { console.error('ERR:', e.message); process.exit(1); });

