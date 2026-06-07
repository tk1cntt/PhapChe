/**
 * Phase 16 Route Validation + Screenshot Harness
 * Validates 14 routes with role-appropriate auth, screenshots content evidence.
 */

const fs = require('fs');
const path = require('path');

const root = process.cwd();

// Load env vars
for (const envFile of ['.env.local', '.env']) {
  const envPath = path.join(root, envFile);
  if (!fs.existsSync(envPath)) continue;
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
  }
}

const outDir = path.join(root, '.planning/quick/260606-udu-verify-all-screens-with-screenshot-evide');
const screenshotDir = path.join(outDir, 'screenshots');
fs.mkdirSync(screenshotDir, { recursive: true });

const baseUrl = process.env.BASE_URL || 'http://localhost:3001';

// ─── Route Definitions ────────────────────────────────────────────────────────

const routes = [
  // Admin routes (all need admin auth)
  { route: '/admin/ops', role: 'admin', group: 'admin', expectedHeading: 'Điều phối' },
  { route: '/admin/routing', role: 'admin', group: 'admin', expectedHeading: 'Điều phối yêu cầu' },
  { route: '/admin/templates', role: 'admin', group: 'admin', expectedHeading: 'Quản lý mẫu' },
  { route: '/admin/templates/new', role: 'admin', group: 'admin', expectedHeading: 'Tạo mẫu' },
  { route: '/admin/users', role: 'admin', group: 'admin', expectedHeading: 'Quản lý người' },
  { route: '/admin/vault', role: 'admin', group: 'admin', expectedHeading: 'Phân loại' },

  // Ops detail needs a real requestId
  { route: '/admin/ops/[requestId]', role: 'admin', group: 'admin', concreteRoute: null, expectedHeading: null },

  // Template detail needs a real templateId
  { route: '/admin/templates/[templateId]', role: 'admin', group: 'admin', concreteRoute: null, expectedHeading: null },

  // Queue routes
  { route: '/specialist/requests', role: 'specialist', group: 'specialist', expectedHeading: 'Yêu cầu' },
  { route: '/reviewer/requests', role: 'reviewer', group: 'reviewer', expectedHeading: 'Yêu cầu' },

  // Dynamic routes (need real IDs from DB or sample)
  { route: '/customer/requests/[requestId]', role: 'customer', group: 'dynamic', concreteRoute: null, expectedHeading: 'Yêu cầu pháp lý' },
  { route: '/requests/[requestId]', role: 'customer', group: 'dynamic', concreteRoute: null, expectedHeading: 'Đã gửi yêu cầu' },
  { route: '/specialist/requests/[requestId]', role: 'specialist', group: 'dynamic', concreteRoute: null, expectedHeading: 'Chi tiết yêu cầu' },
  { route: '/reviewer/requests/[requestId]/review/[documentVersionId]', role: 'reviewer', group: 'dynamic', concreteRoute: null, expectedHeading: null },
];

const credentials = {
  admin: { email: 'admin.demo@example.test', password: 'Demo@123456' },
  specialist: { email: 'specialist.demo@example.test', password: 'Demo@123456' },
  reviewer: { email: 'reviewer.demo@example.test', password: 'Demo@123456' },
  customer: { email: 'customer.demo@example.test', password: 'Demo@123456' },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function waitForServer(browser) {
  for (let i = 0; i < 20; i++) {
    try {
      const page = await browser.newPage();
      const resp = await page.goto(baseUrl + '/sign-in', { waitUntil: 'domcontentloaded', timeout: 5000 });
      await page.close();
      if (resp && resp.ok()) return true;
    } catch { /* retry */ }
    await new Promise(r => setTimeout(r, 1000));
  }
  throw new Error('Server not reachable at ' + baseUrl);
}

async function signIn(page, role) {
  const creds = credentials[role] || credentials.specialist;
  await page.goto(baseUrl + '/sign-in', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForSelector('#signin_email, input[id*="email"], input[placeholder*="Email" i]', { timeout: 10000 });

  // Find email field - AntD renders id="signin_email", type="text"
  const emailEl = page.locator('#signin_email, input[id*="email"], input[placeholder*="Email" i]').first();
  const passwordEl = page.locator('#signin_password, input[type="password"]').first();
  const submitBtn = page.locator('button[type="submit"]').first();

  if ((await emailEl.count()) === 0 && (await passwordEl.count()) === 0) {
    return { ok: false, reason: 'Sign-in form not found' };
  }

  await emailEl.click();
  await emailEl.fill(creds.email);
  await passwordEl.fill(creds.password);
  await submitBtn.click();

  await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(2000);

  const url = page.url();
  if (url.includes('/sign-in')) {
    const body = (await page.locator('body').innerText().catch(() => '')).slice(0, 200);
    return { ok: false, reason: `Still on sign-in. Body: ${body}` };
  }
  return { ok: true, url };
}

async function getSamples() {
  const samples = {
    requestId: 'sample-request-id',
    templateId: 'sample-template-id',
    documentVersionId: 'sample-document-version-id',
    dbAvailable: false,
  };
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    const [req, tmpl, dv] = await Promise.all([
      prisma.legalRequest.findFirst({ select: { id: true } }),
      prisma.documentTemplate.findFirst({ select: { id: true } }),
      // DocumentVersion doesn't have requestId directly — go through Document relation
      prisma.documentVersion.findFirst({
        include: { document: { select: { requestId: true } } },
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    if (req?.id) { samples.requestId = req.id; samples.dbAvailable = true; }
    if (tmpl?.id) samples.templateId = tmpl.id;
    if (dv?.id) samples.documentVersionId = dv.id;
    // Get requestId from Document relation if available
    if (dv?.document?.requestId) {
      samples.requestId = dv.document.requestId;
      samples.dbAvailable = true;
    }
    await prisma.$disconnect();
  } catch (e) {
    samples.dbError = e.message;
  }
  return samples;
}

function slugFor(route) {
  return route.replace(/\//g, '__').replace(/\[|\]/g, '').replace(/[^a-zA-Z0-9_]/g, '_');
}

async function validateRoute(page, routeDef, samples) {
  const concreteRoute = routeDef.concreteRoute
    ? routeDef.concreteRoute
    : routeDef.route
        .replace('[requestId]', samples.requestId)
        .replace('[templateId]', samples.templateId)
        .replace('[documentVersionId]', samples.documentVersionId);

  const errors = [];
  const pageErrors = [];
  const consoleErrors = [];

  const onPageError = (e) => pageErrors.push(String(e.message || e));
  const onConsole = (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); };

  page.on('pageerror', onPageError);
  page.on('console', onConsole);

  let response;
  try {
    response = await page.goto(baseUrl + concreteRoute, { waitUntil: 'networkidle', timeout: 45000 });
  } catch (e) {
    errors.push(`Navigation failed: ${e.message}`);
  }

  await page.waitForTimeout(1500);

  const status = response ? response.status() : null;
  if (status && status >= 400) errors.push(`HTTP ${status}`);

  const bodyText = (await page.locator('body').innerText({ timeout: 5000 }).catch(() => '')).trim();
  if (!bodyText) errors.push('Blank body');

  const lower = bodyText.toLowerCase();
  const errorSignals = [
    'application error', 'runtime error', 'unhandled runtime error',
    'hydration failed', 'this page could not be found', '404', '500',
    'failed to compile', 'prisma client', 'database',
    'functions cannot be passed', 'element type is invalid',
  ];
  for (const s of errorSignals) {
    if (lower.includes(s)) errors.push(`Error signal: ${s}`);
  }

  // Check Next.js error overlay
  const overlay = await page.locator('[data-nextjs-dialog], [data-nextjs-toast]')
    .evaluateAll(nodes => nodes.map(n => n.textContent || '').join('\n'))
    .catch(() => '');
  if (/runtime error|application error|hydration failed/i.test(overlay)) {
    errors.push(`Next.js overlay: ${overlay.slice(0, 200)}`);
  }

  // Content verification
  let contentVerified = false;
  let contentNote = '';
  if (routeDef.expectedHeading) {
    contentVerified = bodyText.includes(routeDef.expectedHeading) ||
                    lower.includes(routeDef.expectedHeading.toLowerCase());
    contentNote = contentVerified
      ? `Found heading: "${routeDef.expectedHeading}"`
      : `Missing heading: "${routeDef.expectedHeading}". Body preview: ${bodyText.slice(0, 150)}`;
  } else {
    // No specific heading - just check not blank/error
    contentVerified = errors.length === 0 && bodyText.length > 10;
    contentNote = contentVerified
      ? `Page rendered with ${bodyText.length} chars`
      : `Page appears empty or errored`;
  }

  const severeConsole = consoleErrors.filter(t =>
    !/favicon|manifest|chrome-extension|downloadable font|Component Token/i.test(t)
  );
  if (pageErrors.length) errors.push(`Page errors: ${pageErrors.join(' | ')}`);
  if (severeConsole.length) errors.push(`Console errors: ${severeConsole.slice(0, 3).join(' | ')}`);

  page.off('pageerror', onPageError);
  page.off('console', onConsole);

  return {
    route: routeDef.route,
    concreteRoute,
    group: routeDef.group,
    role: routeDef.role,
    status,
    errors,
    contentVerified,
    contentNote,
    bodyPreview: bodyText.slice(0, 300),
    pass: errors.length === 0,
  };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.error('Starting Phase 16 route validation...');
  console.error(`Base URL: ${baseUrl}`);
  console.error(`Output: ${outDir}`);

  const samples = await getSamples();
  console.error(`DB available: ${samples.dbAvailable}`);
  if (!samples.dbAvailable) {
    console.error(`DB error: ${samples.dbError}`);
    console.error('NOTE: Dynamic routes will use sample IDs - content verification will be limited.');
  }
  console.error(`Samples: requestId=${samples.requestId}, templateId=${samples.templateId}, docVersionId=${samples.documentVersionId}`);

  const { chromium } = require('playwright');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1200 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  // Wait for server
  await waitForServer(browser);
  console.error('Server is ready.');

  const results = [];

  // Group routes by role for efficient auth
  const byRole = {};
  for (const r of routes) {
    if (!byRole[r.role]) byRole[r.role] = [];
    byRole[r.role].push(r);
  }

  const roleOrder = ['admin', 'specialist', 'reviewer', 'customer'];

  for (const role of roleOrder) {
    if (!byRole[role]) continue;

    console.error(`\nSigning in as ${role}...`);
    const signInResult = await signIn(page, role);
    if (!signInResult.ok) {
      console.error(`  Sign-in FAILED: ${signInResult.reason}`);
      // Mark all routes for this role as auth-failed
      for (const r of byRole[role]) {
        results.push({
          route: r.route,
          concreteRoute: r.concreteRoute || r.route,
          group: r.group,
          role,
          status: null,
          errors: [`Sign-in failed: ${signInResult.reason}`],
          contentVerified: false,
          contentNote: `Cannot verify - auth failed`,
          pass: false,
          screenshot: null,
        });
      }
      continue;
    }
    console.error(`  Sign-in OK: ${signInResult.url}`);

    for (const routeDef of byRole[role]) {
      console.error(`  Testing ${routeDef.route}...`);

      const validation = await validateRoute(page, routeDef, samples);
      let screenshot = null;

      if (validation.pass) {
        screenshot = path.join(screenshotDir, `${slugFor(routeDef.route)}.png`);
        try {
          await page.screenshot({ path: screenshot, fullPage: true });
          screenshot = path.relative(root, screenshot).replace(/\\/g, '/');
          console.error(`    PASS ✓ (content: ${validation.contentVerified ? 'OK' : 'WARN'})`);
        } catch (e) {
          console.error(`    PASS ✓ but screenshot failed: ${e.message}`);
          screenshot = null;
        }
      } else {
        // Still capture screenshot on failure
        const screenshotFail = path.join(screenshotDir, `${slugFor(routeDef.route)}-FAIL.png`);
        try {
          await page.screenshot({ path: screenshotFail, fullPage: true });
        } catch {}
        console.error(`    FAIL: ${validation.errors.join(', ')}`);
      }

      results.push({
        route: routeDef.route,
        concreteRoute: validation.concreteRoute,
        group: routeDef.group,
        role,
        status: validation.status,
        errors: validation.errors,
        contentVerified: validation.contentVerified,
        contentNote: validation.contentNote,
        bodyPreview: validation.bodyPreview,
        pass: validation.pass,
        screenshot,
      });
    }

    // Sign out before next role — clear cookies FIRST, then navigate
    try {
      await page.context().clearCookies();
      await page.goto(baseUrl + '/sign-in', { waitUntil: 'domcontentloaded', timeout: 5000 }).catch(() => {});
    } catch {}
  }

  await browser.close();

  // Write results
  const passCount = results.filter(r => r.pass).length;
  const failCount = results.filter(r => !r.pass).length;
  const contentVerifiedCount = results.filter(r => r.contentVerified).length;

  const report = {
    generated: new Date().toISOString(),
    baseUrl,
    samples,
    routes: results.map(r => ({
      route: r.route,
      concreteRoute: r.concreteRoute,
      group: r.group,
      pass: r.pass,
      contentVerified: r.contentVerified,
      errors: r.errors,
      status: r.status,
      screenshot: r.screenshot,
      contentNote: r.contentNote,
      bodyPreview: r.bodyPreview,
    })),
    summary: {
      total: results.length,
      pass: passCount,
      fail: failCount,
      contentVerified: contentVerifiedCount,
    },
  };

  fs.writeFileSync(path.join(outDir, 'validation-results.json'), JSON.stringify(report, null, 2));

  console.error('\n═══════════════════════════════════════');
  console.error(`Results: ${passCount}/${results.length} PASS`);
  console.error(`Content verified: ${contentVerifiedCount}/${results.length}`);
  console.error(`Output: ${path.join(outDir, 'validation-results.json')}`);
  console.error('═══════════════════════════════════════\n');

  // Print per-group summary
  for (const group of ['admin', 'specialist', 'reviewer', 'dynamic']) {
    const groupResults = results.filter(r => r.group === group);
    if (!groupResults.length) continue;
    const groupPass = groupResults.filter(r => r.pass).length;
    console.error(`  [${group}] ${groupPass}/${groupResults.length} routes pass`);
    for (const r of groupResults) {
      const icon = r.pass ? '✓' : '✗';
      const cvIcon = r.contentVerified ? '✓' : '?';
      console.error(`    ${icon} ${r.route} (content:${cvIcon})`);
    }
  }
}

main().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
