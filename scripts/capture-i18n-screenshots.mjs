import { chromium } from '@playwright/test';
import fs from 'fs/promises';
import path from 'path';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const QUICK_DIR = '.planning/quick/260609-8jq-th-c-hi-n-test-e2e-t-t-c-c-c-m-n-h-nh-v-';
const SCREENSHOT_DIR = path.join(QUICK_DIR, 'screenshots-direct');
const REPORT_PATH = path.join(QUICK_DIR, 'screen-report-direct.json');
const LOCALES = ['vi', 'en', 'zh', 'ja'];

const CREDENTIALS = {
  customer: { email: 'customer.demo@example.test', password: 'Demo@123456' },
  specialist: { email: 'specialist.demo@example.test', password: 'Demo@123456' },
  reviewer: { email: 'reviewer.demo@example.test', password: 'Demo@123456' },
  admin: { email: 'admin.demo@example.test', password: 'Demo@123456' },
};

const SCREENS = [
  { name: 'home', path: '/', localized: true },
  { name: 'sign-in', path: '/sign-in', localized: false },
  { name: 'intake', path: '/intake', localized: true },
  { name: 'customer-dashboard', path: '/customer', localized: true, role: 'customer' },
  { name: 'customer-requests', path: '/customer/requests', localized: true, role: 'customer' },
  { name: 'admin-users', path: '/admin/users', localized: true, role: 'admin' },
  { name: 'admin-requests', path: '/admin/requests', localized: true, role: 'admin' },
  { name: 'admin-ops', path: '/admin/ops', localized: true, role: 'admin' },
  { name: 'admin-routing', path: '/admin/routing', localized: true, role: 'admin' },
  { name: 'admin-templates', path: '/admin/templates', localized: true, role: 'admin' },
  { name: 'admin-vault', path: '/admin/vault', localized: true, role: 'admin' },
  { name: 'admin-audit', path: '/admin/audit', localized: true, role: 'admin' },
  { name: 'admin-workspaces', path: '/admin/workspaces', localized: true, role: 'admin' },
  { name: 'specialist-requests', path: '/specialist/requests', localized: true, role: 'specialist' },
  { name: 'reviewer-requests', path: '/reviewer/requests', localized: true, role: 'reviewer' },
];

function localizedPath(screen, locale) {
  if (!screen.localized) return screen.path;
  if (screen.path === '/') return `/${locale}`;
  return `/${locale}${screen.path}`;
}

function safeName(value) {
  return value.replace(/[^a-z0-9-]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase();
}

async function gotoSettled(page, url) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForLoadState('networkidle', { timeout: 3000 }).catch(() => undefined);
}

async function login(context, role) {
  const page = await context.newPage();
  const creds = CREDENTIALS[role];
  try {
    await gotoSettled(page, `${BASE_URL}/sign-in`);
    await page.locator('input[placeholder="Email"]').fill(creds.email, { timeout: 5000 });
    await page.locator('input[placeholder="Mật khẩu"]').fill(creds.password, { timeout: 5000 });
    await page.locator('button[type="submit"]').click({ timeout: 5000 });
    await page.waitForURL((url) => !String(url).includes('/sign-in'), { timeout: 10000 }).catch(() => undefined);
    if (page.url().includes('/sign-in')) {
      throw new Error(`login failed for ${role}`);
    }
  } finally {
    await page.close().catch(() => undefined);
  }
}

async function capture(context, locale, screen, results) {
  const page = await context.newPage();
  const targetPath = localizedPath(screen, locale);
  const url = `${BASE_URL}${targetPath}`;
  const screenshot = path.join(SCREENSHOT_DIR, locale, `${safeName(screen.name)}.png`);
  try {
    await gotoSettled(page, url);
    if (screen.role && page.url().includes('/sign-in')) {
      throw new Error(`redirected to sign-in for ${screen.role}`);
    }
    await page.locator('body').waitFor({ state: 'visible', timeout: 5000 });
    await fs.mkdir(path.dirname(screenshot), { recursive: true });
    await page.screenshot({ path: screenshot, fullPage: true, timeout: 10000 });
    results.push({ locale, screen: screen.name, path: targetPath, status: 'captured', screenshot });
    console.log(`CAPTURED ${locale} ${screen.name}`);
  } catch (error) {
    results.push({ locale, screen: screen.name, path: targetPath, status: 'failed', reason: error?.message || String(error) });
    console.log(`FAILED ${locale} ${screen.name}: ${error?.message || error}`);
  } finally {
    await page.close().catch(() => undefined);
  }
}

async function main() {
  await fs.mkdir(SCREENSHOT_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const results = [];

  try {
    const publicContext = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    for (const locale of LOCALES) {
      for (const screen of SCREENS.filter((item) => !item.role)) {
        await capture(publicContext, locale, screen, results);
      }
    }
    await publicContext.close();

    for (const role of Object.keys(CREDENTIALS)) {
      const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
      try {
        await login(context, role);
        for (const locale of LOCALES) {
          for (const screen of SCREENS.filter((item) => item.role === role)) {
            await capture(context, locale, screen, results);
          }
        }
      } catch (error) {
        const roleScreens = SCREENS.filter((item) => item.role === role);
        for (const locale of LOCALES) {
          for (const screen of roleScreens) {
            results.push({ locale, screen: screen.name, path: localizedPath(screen, locale), status: 'failed', reason: error?.message || String(error) });
          }
        }
        console.log(`ROLE FAILED ${role}: ${error?.message || error}`);
      } finally {
        await context.close().catch(() => undefined);
      }
    }
  } finally {
    await browser.close();
  }

  const counts = results.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  }, {});
  await fs.writeFile(REPORT_PATH, JSON.stringify({ baseUrl: BASE_URL, locales: LOCALES, screens: SCREENS, counts, results }, null, 2));
  console.log(JSON.stringify({ total: results.length, counts }, null, 2));

  if (counts.failed) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
