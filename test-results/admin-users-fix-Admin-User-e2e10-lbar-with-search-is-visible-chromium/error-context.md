# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin-users-fix.spec.ts >> Admin Users Page - After ReactQueryProvider Fix >> toolbar with search is visible
- Location: e2e\admin-users-fix.spec.ts:55:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByPlaceholder(/Search|Tìm kiếm/i)
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByPlaceholder(/Search|Tìm kiếm/i)

```

```yaml
- button "🇻🇳 Tiếng Việt"
- heading "GitNexus Legal" [level=3]
- img "mail"
- textbox "Email": customer.demo@example.test
- img "lock"
- textbox "Mật khẩu"
- button "Show":
  - img "eye-invisible"
- button "Đăng nhập"
- button "Open Tanstack query devtools":
  - img
- alert
```

# Test source

```ts
  1   | /**
  2   |  * Admin Users Page E2E Test - Verify ReactQueryProvider Fix
  3   |  * Tests that the admin users page loads with real data after fixing QueryClientProvider
  4   |  */
  5   | 
  6   | import { test, expect } from '@playwright/test';
  7   | 
  8   | test.describe('Admin Users Page - After ReactQueryProvider Fix', () => {
  9   |   test.beforeEach(async ({ page }) => {
  10  |     // Navigate to admin users page
  11  |     await page.goto('/vi/admin/users');
  12  |     // Wait for the page to load
  13  |     await page.waitForLoadState('networkidle');
  14  |   });
  15  | 
  16  |   test('page loads without QueryClientProvider error', async ({ page }) => {
  17  |     // Verify no React Query error in console
  18  |     const consoleErrors: string[] = [];
  19  |     page.on('console', msg => {
  20  |       if (msg.type() === 'error') {
  21  |         consoleErrors.push(msg.text());
  22  |       }
  23  |     });
  24  | 
  25  |     // Navigate to the page
  26  |     await page.goto('/vi/admin/users');
  27  |     await page.waitForLoadState('networkidle');
  28  | 
  29  |     // Should NOT see "No QueryClient set" error
  30  |     const errorText = await page.locator('body').textContent();
  31  |     expect(errorText).not.toContain('No QueryClient set');
  32  |     expect(errorText).not.toContain('QueryClientProvider');
  33  |   });
  34  | 
  35  |   test('displays user management header', async ({ page }) => {
  36  |     // Should see page title
  37  |     await expect(page.locator('h1')).toContainText(/User Management|Quản lý người dùng/i);
  38  |   });
  39  | 
  40  |   test('shows stat cards with data', async ({ page }) => {
  41  |     // Wait for stat cards to appear
  42  |     await expect(page.locator('[class*="grid"]')).toBeVisible();
  43  | 
  44  |     // Should have 4 stat cards
  45  |     const statCards = page.locator('.grid > div');
  46  |     await expect(statCards.first()).toBeVisible();
  47  |   });
  48  | 
  49  |   test('role pills section is visible', async ({ page }) => {
  50  |     // Should see role pills or role filter
  51  |     const roleSection = page.locator('text=/Role|Rôles|Người dùng/i');
  52  |     await expect(roleSection.first()).toBeVisible();
  53  |   });
  54  | 
  55  |   test('toolbar with search is visible', async ({ page }) => {
  56  |     // Should see search input
  57  |     const searchInput = page.getByPlaceholder(/Search|Tìm kiếm/i);
> 58  |     await expect(searchInput).toBeVisible();
      |                               ^ Error: expect(locator).toBeVisible() failed
  59  |   });
  60  | 
  61  |   test('no runtime error boundary displayed', async ({ page }) => {
  62  |     // Should NOT see error boundary
  63  |     await expect(page.locator('text=/Something went wrong|Lỗi/i')).not.toBeVisible();
  64  |     await expect(page.locator('text=/Retry|Thử lại/i')).not.toBeVisible();
  65  |   });
  66  | 
  67  |   test('page renders within reasonable time', async ({ page }) => {
  68  |     const startTime = Date.now();
  69  |     await page.goto('/vi/admin/users');
  70  |     await page.waitForLoadState('networkidle');
  71  |     const loadTime = Date.now() - startTime;
  72  | 
  73  |     // Should load within 10 seconds
  74  |     expect(loadTime).toBeLessThan(10000);
  75  |   });
  76  | 
  77  |   test('API returns user data', async ({ request }) => {
  78  |     // Test the API directly
  79  |     const response = await request.get('/vi/api/admin/users?page=1&pageSize=10');
  80  |     expect(response.ok()).toBeTruthy();
  81  | 
  82  |     const data = await response.json();
  83  |     expect(data).toHaveProperty('data');
  84  |     expect(data).toHaveProperty('total');
  85  |     expect(Array.isArray(data.data)).toBeTruthy();
  86  |   });
  87  | });
  88  | 
  89  | test.describe('Admin Users API', () => {
  90  |   test('GET /api/admin/users returns paginated users', async ({ request }) => {
  91  |     const response = await request.get('/vi/api/admin/users?page=1&pageSize=5');
  92  |     expect(response.ok()).toBeTruthy();
  93  | 
  94  |     const data = await response.json();
  95  |     expect(data.page).toBe(1);
  96  |     expect(data.pageSize).toBe(5);
  97  |     expect(typeof data.total).toBe('number');
  98  |     expect(Array.isArray(data.data)).toBeTruthy();
  99  |   });
  100 | 
  101 |   test('search filter works', async ({ request }) => {
  102 |     const response = await request.get('/vi/api/admin/users?search=admin&page=1&pageSize=5');
  103 |     expect(response.ok()).toBeTruthy();
  104 | 
  105 |     const data = await response.json();
  106 |     // Should filter users by search term
  107 |     expect(Array.isArray(data.data)).toBeTruthy();
  108 |   });
  109 | });
  110 | 
```