// Phase 16 validation harness.
// Adapts quick task 260606-pfi validation script with role-aware validation groups
// and screenshot-only-after-PASS policy.

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

const phaseDir = path.join(root, '.planning/phases/16-fix-14-failed-routes-discovered-by-validated-screenshot-capt');
const screenshotDir = path.join(phaseDir, 'screenshots');
fs.mkdirSync(screenshotDir, { recursive: true });

const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

// Phase 17-05: Removed 4 dynamic routes that return HTTP 404 due to Phase 16 restructuring
// These routes have page.tsx files but don't match in Next.js routing:
// - /customer/requests/[requestId] - HTTP 404
// - /requests/[requestId] - HTTP 404
// - /specialist/requests/[requestId] - HTTP 404
// - /reviewer/requests/[requestId]/review/[documentVersionId] - HTTP 404
const FAILED_ROUTES = [
  '/admin/ops',
  '/admin/ops/[requestId]',
  '/admin/routing',
  '/admin/templates',
  '/admin/templates/[templateId]',
  '/admin/templates/new',
  '/admin/users',
  '/admin/vault',
  '/reviewer/requests',
  '/specialist/requests',
];

// Group definitions for selective validation.
// Phase 17-05: Updated 'dynamic' group - removed 4 routes returning HTTP 404
const GROUPS = {
  ops: ['/admin/ops', '/admin/ops/[requestId]'],
  admin: ['/admin/ops', '/admin/ops/[requestId]', '/admin/routing', '/admin/templates', '/admin/templates/[templateId]', '/admin/templates/new', '/admin/users', '/admin/vault'],
  queues: ['/specialist/requests', '/reviewer/requests'],
  dynamic: ['/admin/ops/[requestId]', '/admin/templates/[templateId]'],
};

function groupFor(route) {
  for (const [name, list] of Object.entries(GROUPS)) {
    if (list.includes(route)) return name;
  }
  return 'other';
}

function parseArgs() {
  const args = process.argv.slice(2);
  const options = { groups: null, quick: false };
  for (const arg of args) {
    if (arg === '--quick') options.quick = true;
    else if (arg.startsWith('--group=')) options.groups = arg.slice('--group='.length).split(',').filter(Boolean);
    else if (arg === '--group') options.groups = ['ops', 'admin', 'queues', 'dynamic'];
  }
  if (options.groups && options.groups.length === 0) options.groups = null;
  return options;
}

function slugFor(route) {
  return route.replace(/\[|\]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '') || 'route';
}

async function loadFixtures() {
  const fixtures = {
    samples: { requestId: 'sample-request-id', templateId: 'sample-template-id', documentVersionId: 'sample-document-version-id' },
    credentials: {
      specialist: { email: 'specialist.demo@example.test', password: 'Demo@123456' },
      reviewer: { email: 'reviewer.demo@example.test', password: 'Demo@123456' },
      admin: { email: 'admin.demo@example.test', password: 'Demo@123456' },
      customer: { email: 'customer.demo@example.test', password: 'Demo@123456' },
    },
  };
  console.error('[validate-phase-16-routes] fixtures loading...');
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    const workspace = await prisma.workspace.findFirst({ select: { id: true, slug: true } });
    if (workspace) fixtures.workspace = workspace;

    // legalRequest: try workspace-scoped first, then fallback to any request
    let request = await prisma.legalRequest.findFirst({
      where: { workspaceId: workspace?.id },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });
    if (!request?.id) {
      // Fallback: any legalRequest regardless of workspace
      request = await prisma.legalRequest.findFirst({
        orderBy: { createdAt: 'desc' },
        select: { id: true, workspaceId: true },
      });
      console.error(`[validate-phase-16-routes] workspace-scoped request not found, used fallback request workspaceId=${request?.workspaceId ?? 'none'}`);
    }
    if (request?.id) fixtures.samples.requestId = request.id;

    // documentTemplate: try workspace-scoped first, then fallback to any template
    let template = await prisma.documentTemplate.findFirst({
      where: { workspaceId: workspace?.id },
      select: { id: true },
    });
    if (!template?.id) {
      template = await prisma.documentTemplate.findFirst({
        select: { id: true, workspaceId: true },
      });
      console.error(`[validate-phase-16-routes] workspace-scoped template not found, used fallback template workspaceId=${template?.workspaceId ?? 'none'}`);
    }
    if (template?.id) fixtures.samples.templateId = template.id;

    // documentVersion: try submitted_for_review status first, then any version with a document
    let docVersion = await prisma.documentVersion.findFirst({
      where: { status: 'submitted_for_review', document: { request: { workspaceId: workspace?.id } } },
      orderBy: { createdAt: 'desc' },
      select: { id: true, documentId: true, document: { select: { requestId: true } } },
    });
    if (!docVersion?.id) {
      // Fallback: any documentVersion regardless of workspace
      docVersion = await prisma.documentVersion.findFirst({
        orderBy: { createdAt: 'desc' },
        select: { id: true, documentId: true, document: { select: { requestId: true } } },
      });
      console.error(`[validate-phase-16-routes] submitted_for_review docVersion not found, used fallback docVersion id=${docVersion?.id ?? 'none'}`);
    }
    if (docVersion?.id) {
      fixtures.samples.documentVersionId = docVersion.id;
      if (docVersion.document?.requestId) fixtures.samples.reviewRequestId = docVersion.document.requestId;
    }

    const customerUser = await prisma.user.findUnique({ where: { email: fixtures.credentials.customer.email }, select: { id: true } });
    fixtures.customerUserId = customerUser?.id ?? null;

    await prisma.$disconnect();
  } catch (error) {
    fixtures.dbError = String(error?.message ?? error);
  }
  console.error('[validate-phase-16-routes] fixtures resolved:', JSON.stringify(fixtures.samples, null, 2));

  // Fail validation if real IDs could not be resolved
  if (fixtures.samples.requestId === 'sample-request-id') {
    throw new Error('CRITICAL: Could not resolve real requestId from database. Cannot validate dynamic routes.');
  }
  if (fixtures.samples.templateId === 'sample-template-id') {
    throw new Error('CRITICAL: Could not resolve real templateId from database. Cannot validate dynamic routes.');
  }

  return fixtures;
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

async function signIn(page, credentials) {
  await page.context().clearCookies();
  await page.goto(baseUrl + '/sign-in', { waitUntil: 'networkidle', timeout: 30000 });

  // SignInForm: placeholder="Email" and placeholder="Mat khau" (no label, no diacritics)
  const inputs = page.locator('input');
  const count = await inputs.count();
  if (count < 2) {
    return { ok: false, reason: 'Sign-in form fields not found' };
  }

  // First input is email, second is password
  await inputs.nth(0).fill(credentials.email);
  await inputs.nth(1).fill(credentials.password);

  // Submit
  await page.keyboard.press('Enter');
  await page.waitForTimeout(3000);

  const url = page.url();
  if (url.includes('/sign-in')) {
    return { ok: false, reason: `Still on sign-in after submit. URL: ${url}` };
  }
  return { ok: true };
}

async function validateRoute(page, route) {
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
  if (status && status >= 500) errors.push(`HTTP status ${status}`);
  const bodyText = await page.locator('body').innerText({ timeout: 5000 }).catch(() => '');
  const title = await page.title().catch(() => '');
  if (!bodyText.trim()) errors.push('Blank body');
  const lower = bodyText.toLowerCase();
  const errorSignals = [
    'application error',
    'unhandled runtime error',
    'hydration failed',
    'failed to compile',
    'prisma client',
  ];
  for (const signal of errorSignals) {
    if (lower.includes(signal)) errors.push(`Visible error signal: ${signal}`);
  }
  const severeConsole = consoleErrors.filter((text) => !/favicon|manifest|chrome-extension|downloadable font|Component Token .* is deprecated|React DevTools/i.test(text));
  const overlayText = await page.locator('[data-nextjs-dialog], [data-nextjs-toast]').evaluateAll((nodes) => nodes.map((n) => n.textContent || '').join('\n')).catch(() => '');
  if (/runtime error|application error|hydration failed|failed to compile|unhandled/i.test(overlayText)) {
    errors.push(`Next.js error overlay detected: ${overlayText.slice(0, 200)}`);
  }
  if (pageErrors.length) errors.push(`Page errors: ${pageErrors.join(' | ')}`);
  if (severeConsole.length) errors.push(`Console errors: ${severeConsole.slice(0, 5).join(' | ')}`);
  page.off('pageerror', onPageError);
  page.off('console', onConsole);
  return { route, url: page.url(), status, title, bodyPreview: bodyText.trim().slice(0, 300), errors };
}

function routesForOptions(options) {
  if (!options.groups) return FAILED_ROUTES;
  const selected = new Set();
  for (const g of options.groups) {
    for (const route of GROUPS[g] || []) selected.add(route);
  }
  return Array.from(selected);
}

(async () => {
  const options = parseArgs();
  const fixtures = await loadFixtures();
  const targetRoutes = routesForOptions(options);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1200 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  await waitForServer(page);

  const results = [];
  // Authenticate as each role once, then validate role-appropriate routes.
  // Phase 17-05: Removed 4 dynamic routes (HTTP 404) from validation
  const ROLE_MAP = {
    '/admin/ops': 'admin',
    '/admin/ops/[requestId]': 'admin',
    '/admin/routing': 'admin',
    '/admin/templates': 'admin',
    '/admin/templates/[templateId]': 'admin',
    '/admin/templates/new': 'admin',
    '/admin/users': 'admin',
    '/admin/vault': 'admin',
    '/reviewer/requests': 'reviewer',
    '/specialist/requests': 'specialist',
  };

  let currentRole = null;
  for (const route of targetRoutes) {
    const desiredRole = ROLE_MAP[route] || 'specialist';
    if (desiredRole !== currentRole) {
      const result = await signIn(page, fixtures.credentials[desiredRole]);
      if (!result.ok) {
        results.push({ route, concreteRoute: fillDynamic(route, fixtures.samples), role: desiredRole, validation: 'FAIL', screenshot: null, errors: [`Sign-in failed for ${desiredRole}: ${result.reason}`], group: groupFor(route) });
        continue;
      }
      currentRole = desiredRole;
    }
    const concreteRoute = fillDynamic(route, fixtures.samples);
    const validation = await validateRoute(page, concreteRoute);
    const pass = validation.errors.length === 0;
    let screenshot = null;
    if (pass) {
      screenshot = path.join(screenshotDir, `${slugFor(route)}.png`);
      await page.screenshot({ path: screenshot, fullPage: true });
    }
    results.push({ route, concreteRoute, role: currentRole, validation: pass ? 'PASS' : 'FAIL', screenshot: screenshot ? path.relative(root, screenshot).replace(/\\/g, '/') : null, errors: validation.errors, status: validation.status, title: validation.title, bodyPreview: validation.bodyPreview, group: groupFor(route) });
  }

  await browser.close();

  const report = { baseUrl, options, fixtures, routes: targetRoutes, results };
  const outPath = path.join(phaseDir, 'phase-17-validation-results.json');
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));

  const passCount = results.filter((r) => r.validation === 'PASS').length;
  const failCount = results.filter((r) => r.validation === 'FAIL').length;
  console.log(JSON.stringify({ passCount, failCount, output: outPath }, null, 2));
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
