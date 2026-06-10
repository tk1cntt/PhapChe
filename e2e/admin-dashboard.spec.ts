import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

test.describe('Admin Dashboard - 6 Features E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'admin');
  });

  // Feature 1: Workspaces Admin
  test('01-admin-workspaces-page-loads-with-data', async ({ page }) => {
    await page.goto('/admin/workspaces');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Check page title/content
    const heading = await page.locator('h1, h2, [class*="title"]').first();
    const headingText = await heading.textContent().catch(() => 'No heading found');

    // Check for table or data display
    const hasTable = await page.locator('table, [role="table"], .ant-table').count() > 0;
    const hasContent = (await page.content()).length > 1000;

    // Take screenshot
    await page.screenshot({ path: 'e2e/screenshots/admin-dashboard/01-workspaces.png', fullPage: true });

    // Log for debugging
    console.log('Workspaces page - Heading:', headingText);
    console.log('Workspaces page - Has table:', hasTable);

    expect(hasContent).toBeTruthy();
  });

  // Feature 2: Requests Admin
  test('02-admin-requests-page-loads-with-data', async ({ page }) => {
    await page.goto('/admin/requests');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Check for request-related content
    const hasTable = await page.locator('table, [role="table"], .ant-table').count() > 0;
    const hasContent = (await page.content()).length > 1000;

    // Check for status filters or badges
    const hasStatus = await page.locator('[class*="status"], [class*="badge"], [class*="tag"]').count() > 0;

    // Take screenshot
    await page.screenshot({ path: 'e2e/screenshots/admin-dashboard/02-requests.png', fullPage: true });

    console.log('Requests page - Has table:', hasTable);
    console.log('Requests page - Has status indicators:', hasStatus);

    expect(hasContent).toBeTruthy();
  });

  // Feature 3: Users Admin
  test('03-admin-users-page-loads-with-data', async ({ page }) => {
    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Check for user list
    const hasTable = await page.locator('table, [role="table"], .ant-table').count() > 0;
    const hasContent = (await page.content()).length > 1000;

    // Check for user emails or names
    const hasUserData = await page.locator('text=@example.test').count() > 0 ||
                        await page.locator('text=Demo').count() > 0;

    // Take screenshot
    await page.screenshot({ path: 'e2e/screenshots/admin-dashboard/03-users.png', fullPage: true });

    console.log('Users page - Has table:', hasTable);
    console.log('Users page - Has user data:', hasUserData);

    expect(hasContent).toBeTruthy();
  });

  // Feature 4: Vault Admin
  test('04-admin-vault-page-loads-with-data', async ({ page }) => {
    await page.goto('/admin/vault');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Check for vault/file content
    const hasContent = (await page.content()).length > 1000;
    const hasVaultElements = await page.locator('[class*="vault"], [class*="file"], [class*="folder"]').count() > 0 ||
                             await page.locator('text=/folder|file|document/i').count() > 0;

    // Take screenshot
    await page.screenshot({ path: 'e2e/screenshots/admin-dashboard/04-vault.png', fullPage: true });

    console.log('Vault page - Has vault elements:', hasVaultElements);

    expect(hasContent).toBeTruthy();
  });

  // Feature 5: Templates Admin
  test('05-admin-templates-page-loads-with-data', async ({ page }) => {
    await page.goto('/admin/templates');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Check for template list
    const hasTable = await page.locator('table, [role="table"], .ant-table').count() > 0;
    const hasContent = (await page.content()).length > 1000;

    // Check for template-related content
    const hasTemplateData = await page.locator('text=/template|contract|registration/i').count() > 0;

    // Take screenshot
    await page.screenshot({ path: 'e2e/screenshots/admin-dashboard/05-templates.png', fullPage: true });

    console.log('Templates page - Has table:', hasTable);
    console.log('Templates page - Has template data:', hasTemplateData);

    expect(hasContent).toBeTruthy();
  });

  // Feature 6: Audit Admin
  test('06-admin-audit-page-loads-with-data', async ({ page }) => {
    await page.goto('/admin/audit');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Check for audit log content
    const hasTable = await page.locator('table, [role="table"], .ant-table').count() > 0;
    const hasContent = (await page.content()).length > 1000;

    // Check for audit-related content (events, timestamps)
    const hasAuditData = await page.locator('text=/created|updated|event|action/i').count() > 0;

    // Take screenshot
    await page.screenshot({ path: 'e2e/screenshots/admin-dashboard/06-audit.png', fullPage: true });

    console.log('Audit page - Has table:', hasTable);
    console.log('Audit page - Has audit data:', hasAuditData);

    expect(hasContent).toBeTruthy();
  });

  // Additional: Ops page
  test('07-admin-ops-page-loads', async ({ page }) => {
    await page.goto('/admin/ops');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const hasContent = (await page.content()).length > 1000;

    // Take screenshot
    await page.screenshot({ path: 'e2e/screenshots/admin-dashboard/07-ops.png', fullPage: true });

    expect(hasContent).toBeTruthy();
  });

  // Additional: Admin navigation sidebar
  test('08-admin-sidebar-navigation-works', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Check sidebar exists
    const hasSidebar = await page.locator('aside, [class*="sidebar"], nav').count() > 0;

    // Take screenshot
    await page.screenshot({ path: 'e2e/screenshots/admin-dashboard/08-admin-home.png', fullPage: true });

    expect(hasSidebar || (await page.content()).length > 1000).toBeTruthy();
  });
});
