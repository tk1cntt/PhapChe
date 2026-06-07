const { chromium } = require('playwright');

async function testRole(email, password, roleName) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const allReqs = [];
  page.on('request', req => allReqs.push({ method: req.method(), url: req.url().replace('http://localhost:3000', ''), body: req.postData() || '' }));
  page.on('response', resp => allReqs.push({ status: resp.status(), url: resp.url().replace('http://localhost:3000', '') }));

  await page.goto('http://localhost:3000/sign-in', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1000);

  const emailCount = await page.locator('#signin_email, input[id*="email"], input[placeholder*="Email" i]').count();
  const pwdCount = await page.locator('#signin_password, input[type="password"]').count();
  const submitCount = await page.locator('button[type="submit"]').count();

  console.log(`\n=== ${roleName} ===`);
  console.log(`  Email fields: ${emailCount}, Password fields: ${pwdCount}, Submit: ${submitCount}`);

  if (emailCount === 0 || pwdCount === 0) {
    const body = await page.locator('body').innerText().catch(() => '');
    console.log(`  FAIL: Form elements missing. Body: ${body.slice(0, 200)}`);
    await browser.close();
    return;
  }

  await page.locator('#signin_email, input[id*="email"], input[placeholder*="Email" i]').first().fill(email);
  await page.locator('#signin_password, input[type="password"]').first().fill(password);
  await page.locator('button[type="submit"]').first().click();

  await page.waitForTimeout(5000);

  const url = page.url();
  console.log(`  URL after submit: ${url}`);
  for (const r of allReqs) {
    if (r.url.includes('/api/auth')) {
      console.log(`    ${r.status || r.method} ${r.url} ${r.body}`);
    }
  }

  if (url.includes('/sign-in')) {
    const body = await page.locator('body').innerText().catch(() => '');
    console.log(`  FAIL: Still on sign-in. Body: ${body.slice(0, 300)}`);
  } else {
    console.log(`  OK: Redirected to ${url}`);
  }

  await browser.close();
}

async function main() {
  const roles = [
    ['admin.demo@example.test', 'Demo@123456', 'Admin'],
    ['specialist.demo@example.test', 'Demo@123456', 'Specialist'],
    ['reviewer.demo@example.test', 'Demo@123456', 'Reviewer'],
    ['customer.demo@example.test', 'Demo@123456', 'Customer'],
  ];
  for (const [email, pw, name] of roles) {
    await testRole(email, pw, name);
  }
}

main().catch(e => { console.error('ERR:', e.message); process.exit(1); });
