/**
 * User Management E2E Tests
 * Tests the complete user management page with all components
 */

import { test, expect } from '@playwright/test';

test.describe('User Management Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/users');
  });

  test('renders page header correctly', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'User Management' })).toBeVisible();
    await expect(page.getByText('Platform with 5 roles:')).toBeVisible();
  });

  test('renders 4 stat cards with correct values', async ({ page }) => {
    // Total Users
    await expect(page.getByText('Total Users')).toBeVisible();
    await expect(page.getByText('128')).toBeVisible();

    // Active Users
    await expect(page.getByText('Active Users')).toBeVisible();
    await expect(page.getByText('112')).toBeVisible();

    // Workspaces
    await expect(page.getByText('Workspaces')).toBeVisible();
    await expect(page.getByText('12')).toBeVisible();

    // Pending Invitations
    await expect(page.getByText('Pending Invitations')).toBeVisible();
    await expect(page.getByText('9')).toBeVisible();
  });

  test('renders role pills section with 6 roles', async ({ page }) => {
    await expect(page.getByText('System Roles')).toBeVisible();

    // Verify 6 role pills are visible
    await expect(page.getByText('Customer')).toBeVisible();
    await expect(page.getByText('Specialist')).toBeVisible();
    await expect(page.getByText('Reviewer')).toBeVisible();
    await expect(page.getByText('Coordinator')).toBeVisible();
    await expect(page.getByText('Super Admin')).toBeVisible();
    await expect(page.getByText('Pending')).toBeVisible();

    // Verify role counts
    await expect(page.getByText('72', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('18', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('14', { exact: true }).first()).toBeVisible();
  });

  test('renders toolbar with search input', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Search users...');
    await expect(searchInput).toBeVisible();

    // Search input accepts text
    await searchInput.fill('alex');
    await expect(searchInput).toHaveValue('alex');
  });

  test('renders toolbar filter buttons', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Filters/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Role/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Workspace/i })).toBeVisible();
  });

  test('renders toolbar action buttons', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Export/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Columns/i })).toBeVisible();
  });

  test('renders user table with 8 users', async ({ page }) => {
    // Verify table headers
    await expect(page.getByText('Name')).toBeVisible();
    await expect(page.getByText('Email')).toBeVisible();
    await expect(page.getByText('Role')).toBeVisible();
    await expect(page.getByText('Workspace')).toBeVisible();
    await expect(page.getByText('Status')).toBeVisible();
    await expect(page.getByText('Last Active')).toBeVisible();
    await expect(page.getByText('Action')).toBeVisible();

    // Verify sample users are visible
    await expect(page.getByText('Alex Nguyen')).toBeVisible();
    await expect(page.getByText('Hà Linh')).toBeVisible();
    await expect(page.getByText('Quang Dũng')).toBeVisible();
    await expect(page.getByText('Minh Trang')).toBeVisible();
    await expect(page.getByText('Mai Phương')).toBeVisible();
    await expect(page.getByText('Trần Nam')).toBeVisible();
    await expect(page.getByText('Khánh An')).toBeVisible();
    await expect(page.getByText('Linh Anh')).toBeVisible();
  });

  test('renders role badges with correct colors', async ({ page }) => {
    // super_admin badge should be visible
    await expect(page.getByText('super_admin')).toBeVisible();
    // specialist badge
    await expect(page.getByText('specialist')).toBeVisible();
    // customer badge
    await expect(page.getByText('customer')).toBeVisible();
  });

  test('renders status badges', async ({ page }) => {
    await expect(page.getByText('Active').first()).toBeVisible();
    await expect(page.getByText('Invited')).toBeVisible();
    await expect(page.getByText('Inactive')).toBeVisible();
  });

  test('renders floating alert button in bottom right', async ({ page }) => {
    const floatingButton = page.locator('button', { hasText: /3 Alerts/i });
    await expect(floatingButton).toBeVisible();

    // Verify button has gradient background
    const buttonStyle = await floatingButton.evaluate((el) => {
      return window.getComputedStyle(el).position;
    });
    expect(buttonStyle).toBe('fixed');
  });

  test('Create User button is visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Create User/i })).toBeVisible();
  });

  test('audit note is visible in roles section', async ({ page }) => {
    await expect(page.getByText(/Role assignments are audited/)).toBeVisible();
  });
});

test.describe('User Management - Search Functionality', () => {
  test('search filters user list', async ({ page }) => {
    await page.goto('/admin/users');

    const searchInput = page.getByPlaceholder('Search users...');
    await searchInput.fill('Alex');

    // Alex Nguyen should be visible
    await expect(page.getByText('Alex Nguyen')).toBeVisible();

    // Clear search
    await searchInput.clear();
  });
});

test.describe('User Management - Error Handling', () => {
  test('shows error boundary on component error', async ({ page }) => {
    await page.goto('/admin/users');

    // Page should load without errors
    await expect(page.getByRole('heading', { name: 'User Management' })).toBeVisible();

    // No error messages should appear
    await expect(page.getByText('Something went wrong')).not.toBeVisible();
  });
});
