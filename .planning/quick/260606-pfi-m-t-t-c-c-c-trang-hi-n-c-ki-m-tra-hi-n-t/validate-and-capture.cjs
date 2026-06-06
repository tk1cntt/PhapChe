const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const root = process.cwd();
for (const envFile of ['.env.local', '.env']) {
  const envPath = path.join(root, envFile);
  if (!fs.existsSync(envPath)) continue;
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
  }
}

const outDir = path.join(root, '.planning/quick/260606-pfi-m-t-t-c-c-c-trang-hi-n-c-ki-m-tra-hi-n-t');
const screenshotDir = path.join(outDir, 'screenshots');
fs.mkdirSync(screenshotDir, { recursive: true });

const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return full.endsWith('page.tsx') ? [full] : [];
  });
}

function pageFileToRoute(file) {
  let rel = path.relative(path.join(root, 'src/app'), file).replace(/\\/g, '/');
  rel = rel.replace(/\/page\.tsx$/, '').replace(/^page\.tsx$/, '');
  const segments = rel.split('/').filter(Boolean).filter((segment) => !(segment.startsWith('(') && segment.endsWith(')')));
  const route = '/' + segments.join('/');
  return route === '/' ? '/' : route;
}

function slugFor(route) {
  return (route === '/' ? 'home' : route.slice(1)).replace(/\[|\]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '') || 'home';
}

async function getSamples() {
  const samples = { requestId: 'sample-request-id', templateId: 'sample-template-id', documentVersionId: 'sample-document-version-id' };
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    const request = await prisma.legalRequest.findFirst({ select: { id: true } });
    if (request?.id) samples.requestId = request.id;
    const template = await prisma.documentTemplate.findFirst({ select: { id: true } });
    if (template?.id) samples.templateId = template.id;
    const docVersion = await prisma.documentVersion.findFirst({ select: { id: true } });
    if (docVersion?.id) samples.documentVersionId = docVersion.id;
    await prisma.$disconnect();
  } catch (error) {
    samples.dbError = String(error && error.message ? error.message : error);
  }
  return samples;
}

function fillDynamic(route, samples) {
  return route
    .replace('[requestId]', samples.requestId)
    .replace('[templateId]', samples.templateId)
    .replace('[documentVersionId]', samples.documentVersionId);
}

async function waitForServer(page) {
  let lastError;
  for (let i = 0; i < 20; i++) {
    try {
      const response = await page.goto(baseUrl + '/sign-in', { waitUntil: 'domcontentloaded', timeout: 5000 });
      if (response) return;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  throw lastError || new Error('Server not reachable');
}

async function signIn(page) {
  await page.goto(baseUrl + '/sign-in', { waitUntil: 'networkidle', timeout: 30000 });
  const email = page.getByLabel(/email/i).or(page.getByPlaceholder(/email/i)).or(page.locator('input[type="email"]')).first();
  const password = page.getByLabel(/password|mật khẩu|mat khau/i).or(page.getByPlaceholder(/password|mật khẩu|mat khau/i)).or(page.locator('input[type="password"]')).first();
  if ((await email.count()) === 0 || (await password.count()) === 0) {
    return { ok: false, reason: 'Sign-in form fields not found' };
  }
  await email.fill('specialist.demo@example.test');
  await password.fill('Demo@123456');
  const submit = page.locator('button[type="submit"], button').filter({ hasText: /sign in|đăng nhập|login/i }).first();
  if ((await submit.count()) > 0) await submit.click();
  else await password.press('Enter');
  await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(1500);
  const url = page.url();
  if (url.includes('/sign-in')) {
    const text = (await page.locator('body').innerText().catch(() => '')).slice(0, 500);
    return { ok: false, reason: `Still on sign-in after submit. Body: ${text}` };
  }
  return { ok: true };
}

async function validatePage(page, route) {
  const errors = [];
  const pageErrors = [];
  const consoleErrors = [];
  const onPageError = (error) => pageErrors.push(String(error.message || error));
  const onConsole = (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  };
  page.on('pageerror', onPageError);
  page.on('console', onConsole);
  let response;
  try {
    response = await page.goto(baseUrl + route, { waitUntil: 'networkidle', timeout: 45000 });
  } catch (error) {
    errors.push(`Navigation failed: ${error.message}`);
  }
  await page.waitForTimeout(1000);
  const status = response ? response.status() : null;
  if (status && status >= 400) errors.push(`HTTP status ${status}`);
  const bodyText = await page.locator('body').innerText({ timeout: 5000 }).catch(() => '');
  const title = await page.title().catch(() => '');
  if (!bodyText.trim()) errors.push('Blank body');
  const lower = bodyText.toLowerCase();
  const errorSignals = [
    'application error',
    'runtime error',
    'unhandled runtime error',
    'hydration failed',
    'this page could not be found',
    '404',
    '500',
    'failed to compile',
    'prisma client',
    'database'
  ];
  for (const signal of errorSignals) {
    if (lower.includes(signal)) errors.push(`Visible error signal: ${signal}`);
  }
  const nextOverlayText = await page.locator('[data-nextjs-dialog], [data-nextjs-toast]').evaluateAll((nodes) => nodes.map((node) => node.textContent || '').join('\n')).catch(() => '');
  if (/runtime error|application error|hydration failed|failed to compile|unhandled/i.test(nextOverlayText)) errors.push(`Next.js error overlay detected: ${nextOverlayText.slice(0, 200)}`);
  const severeConsole = consoleErrors.filter((text) => !/favicon|manifest|chrome-extension|downloadable font|Component Token .* is deprecated|React DevTools/i.test(text));
  if (pageErrors.length) errors.push(`Page errors: ${pageErrors.join(' | ')}`);
  if (severeConsole.length) errors.push(`Console errors: ${severeConsole.slice(0, 5).join(' | ')}`);
  page.off('pageerror', onPageError);
  page.off('console', onConsole);
  return { route, url: page.url(), status, title, bodyPreview: bodyText.trim().slice(0, 300), errors };
}

(async () => {
  const samples = await getSamples();
  const routeFiles = walk(path.join(root, 'src/app')).sort();
  const routes = Array.from(new Set(routeFiles.map(pageFileToRoute))).sort((a, b) => a.localeCompare(b));
  const concreteRoutes = routes.map((route) => ({ route, concreteRoute: fillDynamic(route, samples) }));

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1200 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  await waitForServer(page);

  const results = [];
  const signInResult = await signIn(page);
  results.push({ route: '/sign-in', concreteRoute: '/sign-in', validation: signInResult.ok ? 'PASS' : 'FAIL', screenshot: signInResult.ok ? null : null, errors: signInResult.ok ? [] : [signInResult.reason], note: 'Authentication bootstrap' });

  for (const item of concreteRoutes) {
    const validation = await validatePage(page, item.concreteRoute);
    const pass = validation.errors.length === 0;
    let screenshot = null;
    if (pass) {
      screenshot = path.join(screenshotDir, `${slugFor(item.route)}.png`);
      await page.screenshot({ path: screenshot, fullPage: true });
    }
    results.push({ ...item, validation: pass ? 'PASS' : 'FAIL', screenshot: screenshot ? path.relative(root, screenshot).replace(/\\/g, '/') : null, errors: validation.errors, title: validation.title, status: validation.status, bodyPreview: validation.bodyPreview });
  }

  await browser.close();

  const report = { baseUrl, samples, routes: concreteRoutes, results };
  fs.writeFileSync(path.join(outDir, 'validation-results.json'), JSON.stringify(report, null, 2));

  const passCount = results.filter((r) => r.validation === 'PASS').length;
  const failCount = results.filter((r) => r.validation === 'FAIL').length;
  console.log(JSON.stringify({ passCount, failCount, output: path.join(outDir, 'validation-results.json') }, null, 2));
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
