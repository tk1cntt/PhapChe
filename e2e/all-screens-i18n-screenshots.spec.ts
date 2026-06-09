import { test, expect, type Page } from '@playwright/test';
import path from 'path';
import { loginAs } from './helpers';

const QUICK_DIR = '.planning/quick/260609-apr-e2e-all-screenshots';
const LOCALES = ['vi', 'en', 'zh', 'ja'] as const;
type Locale = (typeof LOCALES)[number];
type Role = 'admin' | 'customer' | 'specialist' | 'reviewer';

type Screen = {
  name: string;
  path: string;
  localized: boolean;
};

/** Screens that need NO login */
const PUBLIC_SCREENS: Screen[] = [
  { name: 'home', path: '/', localized: true },
  { name: 'sign-in', path: '/sign-in', localized: false },
  { name: 'intake', path: '/intake', localized: true },
];

/** Screens grouped by role */
const ROLE_SCREENS: Record<Role, Screen[]> = {
  admin: [
    { name: 'admin-users', path: '/admin/users', localized: true },
    { name: 'admin-requests', path: '/admin/requests', localized: true },
    { name: 'admin-ops', path: '/admin/ops', localized: true },
    { name: 'admin-routing', path: '/admin/routing', localized: true },
    { name: 'admin-templates', path: '/admin/templates', localized: true },
    { name: 'admin-vault', path: '/admin/vault', localized: true },
    { name: 'admin-audit', path: '/admin/audit', localized: true },
    { name: 'admin-workspaces', path: '/admin/workspaces', localized: true },
  ],
  customer: [
    { name: 'customer-dashboard', path: '/customer', localized: true },
    { name: 'customer-requests', path: '/customer/requests', localized: true },
  ],
  specialist: [
    { name: 'specialist-requests', path: '/specialist/requests', localized: true },
  ],
  reviewer: [
    { name: 'reviewer-requests', path: '/reviewer/requests', localized: true },
  ],
};

function localizedPath(screen: Screen, locale: Locale) {
  if (!screen.localized) return screen.path;
  if (screen.path === '/') return `/${locale}`;
  return `/${locale}${screen.path}`;
}

function safeName(value: string) {
  return value.replace(/[^a-z0-9-]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase();
}

/**
 * Take a single screenshot, returning status info.
 */
async function captureScreen(
  page: Page,
  locale: Locale,
  screen: Screen,
  role?: Role,
): Promise<{ status: 'captured' | 'skipped' | 'failed'; reason?: string; screenshot?: string }> {
  const targetPath = localizedPath(screen, locale);
  const screenshot = `${QUICK_DIR}/screenshots/${locale}/${safeName(screen.name)}.png`;
  const screenshotPath = path.join(process.cwd(), screenshot);

  try {
    await page.goto(targetPath, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => undefined);
    await page.waitForTimeout(500); // let Ant Design animations settle

    if (role && page.url().includes('/sign-in')) {
      return { status: 'skipped', reason: 'Redirected to sign-in — session expired' };
    }

    await expect(page.locator('body')).toBeVisible({ timeout: 3000 });
    const fs = await import('fs/promises');
    await fs.mkdir(path.dirname(screenshotPath), { recursive: true });
    await page.screenshot({ path: screenshotPath, fullPage: true });

    return { status: 'captured', screenshot };
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return { status: 'failed', reason };
  }
}

// ── Public screens (no login) ──
test.describe('Public screens screenshots', () => {
  for (const locale of LOCALES) {
    test(`all public screens - ${locale}`, async ({ page }) => {
      const results: Array<{ screen: string; status: string; reason?: string }> = [];
      for (const screen of PUBLIC_SCREENS) {
        const result = await captureScreen(page, locale, screen);
        results.push({ screen: screen.name, ...result });
      }
      // Verify all public screens captured
      const failed = results.filter(r => r.status === 'failed');
      expect(failed).toHaveLength(0);
    });
  }
});

// ── Role-based screens (login once per role+locale) ──
for (const [role, screens] of Object.entries(ROLE_SCREENS) as [Role, Screen[]][]) {
  test.describe(`${role} screens screenshots`, () => {
    for (const locale of LOCALES) {
      test(`all ${role} screens - ${locale}`, async ({ page }) => {
        // Login once for this role
        await loginAs(page, role);
        if (page.url().includes('/sign-in')) {
          test.skip(true, `Skipped: ${role} login failed — database not seeded.`);
        }

        const results: Array<{ screen: string; status: string; reason?: string }> = [];
        for (const screen of screens) {
          const result = await captureScreen(page, locale, screen, role);
          results.push({ screen: screen.name, ...result });
        }

        const failed = results.filter(r => r.status === 'failed');
        if (failed.length > 0) {
          console.warn(`[${role}/${locale}] ${failed.length} screens failed:`, failed.map(f => f.screen).join(', '));
        }
        // At least one screen should capture successfully
        const captured = results.filter(r => r.status === 'captured');
        expect(captured.length).toBeGreaterThan(0);
      });
    }
  });
}
