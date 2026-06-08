import { test, expect, type Page } from '@playwright/test';
import path from 'path';
import { loginAs } from './helpers';

const QUICK_DIR = '.planning/quick/260609-8jq-th-c-hi-n-test-e2e-t-t-c-c-c-m-n-h-nh-v-';
const LOCALES = ['vi', 'en', 'zh', 'ja'] as const;

type Locale = (typeof LOCALES)[number];
type Role = 'admin' | 'customer' | 'specialist' | 'reviewer';

type Screen = {
  name: string;
  path: string;
  localized: boolean;
  role?: Role;
};

const SCREENS: Screen[] = [
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

const report: Array<{
  locale: Locale;
  screen: string;
  path: string;
  status: 'captured' | 'skipped' | 'failed';
  reason?: string;
  screenshot?: string;
}> = [];

function localizedPath(screen: Screen, locale: Locale) {
  if (!screen.localized) return screen.path;
  if (screen.path === '/') return `/${locale}`;
  return `/${locale}${screen.path}`;
}

function safeName(value: string) {
  return value.replace(/[^a-z0-9-]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase();
}

async function ensureRole(page: Page, role?: Role) {
  if (!role) return;
  await loginAs(page, role);
  if (page.url().includes('/sign-in')) {
    throw new Error('Skipped: Database not seeded.');
  }
}

test.describe.configure({ mode: 'serial' });

test.describe('All screens i18n screenshots', () => {
  for (const locale of LOCALES) {
    for (const screen of SCREENS) {
      const testName = `${locale} - ${screen.name}`;

      test(testName, async ({ page }, testInfo) => {
        const targetPath = localizedPath(screen, locale);
        const screenshot = `${QUICK_DIR}/screenshots/${locale}/${safeName(screen.name)}.png`;
        const screenshotPath = path.join(process.cwd(), screenshot);

        try {
          await page.context().clearCookies();
          await ensureRole(page, screen.role);
          await page.goto(targetPath, { waitUntil: 'domcontentloaded', timeout: 30000 });
          await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => undefined);

          if (screen.role && page.url().includes('/sign-in')) {
            throw new Error('Skipped: Database not seeded.');
          }

          await expect(page.locator('body')).toBeVisible();
          const fs = await import('fs/promises');
          await fs.mkdir(path.dirname(screenshotPath), { recursive: true });
          await page.screenshot({ path: screenshotPath, fullPage: true });

          report.push({ locale, screen: screen.name, path: targetPath, status: 'captured', screenshot });
        } catch (error) {
          const reason = error instanceof Error ? error.message : String(error);
          const status = reason.includes('Skipped: Database not seeded.') ? 'skipped' : 'failed';
          report.push({ locale, screen: screen.name, path: targetPath, status, reason });
        }
      });
    }
  }

  test.afterAll(async () => {
    const fs = await import('fs/promises');
    await fs.mkdir(`${QUICK_DIR}/screenshots`, { recursive: true });
    await fs.writeFile(`${QUICK_DIR}/screen-report.json`, JSON.stringify({ locales: LOCALES, screens: SCREENS, results: report }, null, 2));
  });
});
