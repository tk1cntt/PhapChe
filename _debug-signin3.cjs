const { chromium } = require('playwright');

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Listen for console messages
  const logs = [];
  page.on('console', msg => logs.push(`[${msg.type()}] ${msg.text()}`));

  // Intercept response
  page.on('response', async resp => {
    if (resp.url().includes('/api/auth')) {
      try {
        const body = await resp.text();
        console.log(`Auth response [${resp.status()}]: ${body.slice(0, 300)}`);
      } catch (e) {
        console.log(`Auth response [${resp.status()}]: (could not read body)`);
      }
    }
  });

  await page.goto('http://localhost:3000/sign-in', { waitUntil: 'networkidle', timeout: 30000 });

  await page.locator('input[id="signin_email"], input[id*="email"], input[placeholder*="Email" i]').first().fill('admin.demo@example.test');
  await page.locator('input[type="password"]').first().fill('Demo@123456');
  await page.locator('button[type="submit"]').first().click();

  await page.waitForTimeout(5000);

  // Print relevant logs
  const authLogs = logs.filter(l => l.includes('error') || l.includes('Error') || l.includes('better') || l.includes('auth'));
  if (authLogs.length) {
    console.log('\nAuth logs:');
    authLogs.forEach(l => console.log(' ', l.slice(0, 200)));
  }

  await browser.close();
}

main().catch(e => { console.error('ERR:', e.message); process.exit(1); });
