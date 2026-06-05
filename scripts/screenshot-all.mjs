// scripts/screenshot-all.mjs
// Playwright script: start dev server, screenshot all routes, generate report
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..');
const SCREENSHOT_DIR = resolve(PROJECT_ROOT, '.planning/quick/260605-ju6-capture-screenshots/screenshots');
const REPORT_PATH = resolve(PROJECT_ROOT, '.planning/quick/260605-ju6-capture-screenshots/SCREENSHOT-REPORT.md');

mkdirSync(SCREENSHOT_DIR, { recursive: true });

const ROUTES = [
  { path: '/', label: 'Home' },
  { path: '/intake', label: 'Intake Form' },
  { path: '/admin/audit', label: 'Admin Audit' },
  { path: '/admin/users', label: 'Admin Users' },
  { path: '/admin/workspaces', label: 'Admin Workspaces' },
  { path: '/admin/requests', label: 'Admin Requests' },
  { path: '/admin/ops', label: 'Admin Ops Dashboard' },
  { path: '/admin/routing', label: 'Admin Routing' },
  { path: '/admin/templates', label: 'Admin Templates' },
  { path: '/admin/vault', label: 'Admin Vault' },
  { path: '/specialist/requests', label: 'Specialist Requests Queue' },
  { path: '/reviewer/requests', label: 'Reviewer Requests Queue' },
];

const results = [];

// Start dev server on port 3001 (to avoid conflicts)
console.log('Starting Next.js dev server...');
const server = spawn('npx', ['next', 'dev', '-p', '3001'], {
  cwd: PROJECT_ROOT,
  stdio: ['ignore', 'pipe', 'pipe'],
  shell: true,
  env: { ...process.env, APP_SESSION_USER_ID: 'cmpxf18fd00014wj8qe9ndirk' },
});

// Wait for server to be ready
await new Promise((resolveReady, reject) => {
  const timeout = setTimeout(() => reject(new Error('Server start timeout')), 60000);
  server.stdout.on('data', (data) => {
    const text = data.toString();
    process.stdout.write(text);
    if (text.includes('ready') || text.includes('localhost:3001')) {
      clearTimeout(timeout);
      setTimeout(resolveReady, 2000); // extra wait for stability
    }
  });
  server.stderr.on('data', (data) => {
    process.stderr.write(data.toString());
  });
  server.on('error', reject);
});

console.log('\nServer ready. Launching browser...\n');

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });

for (const route of ROUTES) {
  const page = await context.newPage();
  const consoleErrors = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  page.on('pageerror', (err) => consoleErrors.push(err.message));

  const filename = route.label.replace(/\s+/g, '-').toLowerCase() + '.png';
  const filepath = resolve(SCREENSHOT_DIR, filename);
  let status = 'OK';
  let notes = '';
  let screenshotTime = '';

  try {
    const start = Date.now();
    const resp = await page.goto(`http://localhost:3001${route.path}`, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });
    screenshotTime = `${Date.now() - start}ms`;

    if (!resp) {
      status = 'ERROR';
      notes = 'No response received';
    } else if (resp.status() >= 400) {
      status = 'HTTP ' + resp.status();
      notes = resp.statusText();
    }

    await page.screenshot({ path: filepath, fullPage: true });

    if (consoleErrors.length > 0) {
      notes += (notes ? '; ' : '') + 'Console errors: ' + consoleErrors.join(', ');
    }
  } catch (err) {
    status = 'CRASH';
    notes = err.message;
    try {
      await page.screenshot({ path: filepath });
    } catch {}
  } finally {
    await page.close();
  }

  results.push({
    route: route.path,
    label: route.label,
    status,
    screenshot: filename,
    time: screenshotTime,
    notes: notes || '-',
  });

  console.log(`${status === 'OK' ? '✓' : '✗'} ${route.label.padEnd(30)} ${status.padEnd(12)} ${screenshotTime}`);
}

await browser.close();

// Shut down server
server.kill('SIGTERM');
console.log('\nServer shut down.');

// Generate report
const reportLines = [
  `# Screenshot Capture Report`,
  ``,
  `**Date:** ${new Date().toISOString()}`,
  `**Environment:** Playwright + Chromium headless`,
  `**Viewport:** 1280×800`,
  `**Total routes:** ${results.length}`,
  ``,
  `## Results Summary`,
  ``,
  `| # | Route | Label | Status | Time | Screenshot | Notes |`,
  `|---|-------|-------|--------|------|------------|-------|`,
];

results.forEach((r, i) => {
  reportLines.push(
    `| ${i + 1} | \`${r.route}\` | ${r.label} | ${r.status} | ${r.time} | ${r.screenshot} | ${r.notes} |`
  );
});

const okCount = results.filter(r => r.status === 'OK').length;
const errorCount = results.filter(r => r.status !== 'OK').length;

reportLines.push(
  ``,
  `## Stats`,
  ``,
  `- **Passed:** ${okCount}/${results.length}`,
  `- **Failed/Errors:** ${errorCount}`,
  `- **Screenshots directory:** \`${SCREENSHOT_DIR}\``,
  ``,
);

if (errorCount > 0) {
  reportLines.push(
    `## Errors Found`,
    ``,
  );
  results.filter(r => r.status !== 'OK').forEach(r => {
    reportLines.push(`### ${r.label} (\`${r.route}\`)`);
    reportLines.push(`- **Status:** ${r.status}`);
    reportLines.push(`- **Notes:** ${r.notes}`);
    reportLines.push(``);
  });
}

writeFileSync(REPORT_PATH, reportLines.join('\n'), 'utf-8');
console.log(`\nReport written: ${REPORT_PATH}`);
console.log(`Screenshots: ${SCREENSHOT_DIR}/`);
