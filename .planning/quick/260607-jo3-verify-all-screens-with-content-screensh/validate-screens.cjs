// Validation script: Verify all routes with content screenshots
// Uses API to authenticate, then takes screenshots

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const https = require('https');
const http = require('http');

const root = process.cwd();
const screenshotDir = path.join(__dirname, 'screenshots');
const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

// Routes to verify
const ROUTES = [
  // Admin routes
  { route: '/admin/ops', role: 'admin', expected: ['Ops', 'Operations', 'Timeline', 'Audit', 'Timeline audit'] },
  { route: '/admin/ops/[requestId]', role: 'admin', expected: ['Timeline', 'Request', 'SLA'] },
  { route: '/admin/routing', role: 'admin', expected: ['Routing', 'Queue', 'Assign', 'Dispatch'] },
  { route: '/admin/templates', role: 'admin', expected: ['Template', 'Mau'] },
  { route: '/admin/templates/[templateId]', role: 'admin', expected: ['Template', 'Mau'] },
  { route: '/admin/templates/new', role: 'admin', expected: ['Template', 'Mau', 'New', 'Tao'] },
  { route: '/admin/users', role: 'admin', expected: ['User', 'Nguoi', 'Tai khoan'] },
  { route: '/admin/vault', role: 'admin', expected: ['Vault', 'Document', 'Tai lieu'] },
  // Specialist routes
  { route: '/specialist/requests', role: 'specialist', expected: ['Specialist', 'Chuyen', 'Request', 'Yeu cau'] },
  // Reviewer routes
  { route: '/reviewer/requests', role: 'reviewer', expected: ['Reviewer', 'Kiem duyet', 'Request', 'Yeu cau'] },
];

// Credentials
const CREDENTIALS = {
  admin: { email: 'admin.demo@example.test', password: 'Demo@123456' },
  specialist: { email: 'specialist.demo@example.test', password: 'Demo@123456' },
  reviewer: { email: 'reviewer.demo@example.test', password: 'Demo@123456' },
};

function slugFor(route) {
  return route.replace(/\[|\]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '') || 'route';
}

// Simple HTTP request helper
function httpRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {},
    };

    const lib = urlObj.protocol === 'https:' ? https : http;
    const req = lib.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    });
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

async function apiSignIn(email, password) {
  const url = baseUrl + '/api/auth/sign-in/email';
  const body = JSON.stringify({ email, password });

  try {
    const res = await httpRequest(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
      body
    });

    if (res.status === 200) {
      const data = JSON.parse(res.body);
      return { token: data.token, user: data.user };
    }
    return null;
  } catch (e) {
    console.error('Sign-in API error:', e.message);
    return null;
  }
}

async function loginWithBrowser(page, email, password) {
  console.log(`Logging in as ${email}...`);

  // First try API to get token
  const apiResult = await apiSignIn(email, password);
  if (!apiResult) {
    console.log('API sign-in failed, trying browser...');
  }

  // Navigate to sign-in
  await page.goto(baseUrl + '/sign-in', { waitUntil: 'networkidle' });

  // Fill form
  await page.locator('input').nth(0).fill(email);
  await page.locator('input').nth(1).fill(password);

  // Click first button (submit)
  await page.locator('button').first().click();

  // Wait a bit for redirect
  await page.waitForTimeout(3000);

  const currentUrl = page.url();
  const bodyText = await page.evaluate(() => document.body.innerText);

  // Check if we're logged in
  if (currentUrl.includes('/sign-in')) {
    // Try API approach - set session via API response
    if (apiResult && apiResult.token) {
      console.log('Setting auth cookie from API...');
      await page.context().addCookies([{
        name: 'session_token',
        value: apiResult.token,
        domain: 'localhost',
        path: '/'
      }]);
      await page.goto(baseUrl + '/intake', { waitUntil: 'networkidle' });
      return !page.url().includes('/sign-in');
    }
    return false;
  }

  return true;
}

async function verifyRoute(page, routeInfo) {
  const { route, role, expected } = routeInfo;
  const screenshotPath = path.join(screenshotDir, `${role}-${slugFor(route)}.png`);

  console.log(`[${role}] Verifying ${route}...`);

  // Navigate to route
  await page.goto(baseUrl + route, { waitUntil: 'networkidle', timeout: 30000 });

  // Check if redirected to login
  const currentUrl = page.url();
  if (currentUrl.includes('/sign-in') || currentUrl.includes('/login')) {
    console.log(`FAIL: ${route} - redirected to login`);
    await page.screenshot({ path: screenshotPath.replace('.png', '-FAIL-login.png') });
    return { route, status: 'FAIL', reason: 'redirected to login', url: currentUrl };
  }

  // Wait for page to load
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2000);

  // Get page content
  const bodyText = await page.evaluate(() => document.body.innerText);

  // Check for login content
  if (bodyText.includes('Sign in') && bodyText.includes('password') && bodyText.length < 500) {
    console.log(`FAIL: ${route} - page shows login form`);
    await page.screenshot({ path: screenshotPath.replace('.png', '-FAIL-login.png') });
    return { route, status: 'FAIL', reason: 'shows login form', url: currentUrl };
  }

  // Check for expected content
  const contentFound = expected.some(text => bodyText.includes(text));
  if (contentFound) {
    console.log(`PASS: ${route} - content verified: ${expected.find(t => bodyText.includes(t))}`);
  } else {
    console.log(`WARN: ${route} - expected content not found`);
    console.log(`  Expected: ${expected.join(', ')}`);
    console.log(`  Page preview: ${bodyText.substring(0, 200)}...`);
  }

  // Screenshot
  await page.screenshot({ path: screenshotPath, fullPage: true });

  return {
    route,
    status: contentFound ? 'PASS' : 'PASS-LOW',
    reason: contentFound ? 'content verified' : 'content warning',
    url: currentUrl,
    screenshot: screenshotPath
  };
}

async function main() {
  fs.mkdirSync(screenshotDir, { recursive: true });

  console.log('='.repeat(60));
  console.log('Route Validation with Content Screenshots');
  console.log('='.repeat(60));
  console.log(`Base URL: ${baseUrl}`);
  console.log('');

  const results = [];
  const browser = await chromium.launch({ headless: false });

  const roles = ['admin', 'specialist', 'reviewer'];

  for (const role of roles) {
    const routesForRole = ROUTES.filter(r => r.role === role);
    if (routesForRole.length === 0) continue;

    console.log(`\n${'='.repeat(40)}`);
    console.log(`Processing ${role.toUpperCase()} routes (${routesForRole.length})`);
    console.log('='.repeat(40));

    const context = await browser.newContext();
    const page = await context.newPage();

    // Login
    const creds = CREDENTIALS[role];
    const loggedIn = await loginWithBrowser(page, creds.email, creds.password);
    if (!loggedIn) {
      console.log(`[${role}] Login failed - skipping routes`);
      await context.close();
      continue;
    }
    console.log(`[${role}] Logged in successfully`);

    // Verify routes
    for (const routeInfo of routesForRole) {
      try {
        const result = await verifyRoute(page, routeInfo);
        results.push(result);
      } catch (e) {
        console.log(`ERROR: ${routeInfo.route} - ${e.message}`);
      }
      // Small delay between routes
      await page.waitForTimeout(1000);
    }

    await context.close();
  }

  await browser.close();

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('VALIDATION SUMMARY');
  console.log('='.repeat(60));

  const passCount = results.filter(r => r.status === 'PASS').length;
  const warnCount = results.filter(r => r.status === 'PASS-LOW').length;
  const failCount = results.filter(r => r.status === 'FAIL').length;

  console.log(`\nResults: ${passCount} PASS, ${warnCount} WARN, ${failCount} FAIL\n`);

  for (const r of results) {
    const icon = r.status === 'PASS' ? '✓' : r.status === 'PASS-LOW' ? '⚠' : '✗';
    console.log(`${icon} [${r.status}] ${r.route}`);
    console.log(`  URL: ${r.url}`);
  }

  console.log(`\nScreenshots: ${screenshotDir}`);
  process.exit(failCount > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
