# Review: `_quick-auth-test.cjs`

**Project:** PhapChe | **Review:** `75dc866e-664f-4b1f-8897-9da96ec262ff`

**Comments:** 3

---

## 🟠 High (1)

**🐛 Bug** · lines 7-31

Overlapping pageerror listeners accumulate across loop iterations. Line 7 registers a global listener (never removed), and line 20 adds a new listener per iteration without removing the previous one. This causes errors from earlier pages to leak into later iterations' errors2 arrays, making error attribution unreliable.

<details>
<summary>:bulb: Suggestion</summary>

```
  const pages = [
    '/admin/ops',
    '/admin/routing',
    '/admin/templates',
    '/admin/users',
    '/admin/vault',
  ];

  for (const p of pages) {
    const errors2 = [];
    const handler = e => errors2.push(e.message.slice(0, 120));
    page.on('pageerror', handler);
    const r = await page.goto(BASE + p, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);
    const body = await page.locator('body').innerText().catch(() => '');
    console.log(`[${p}] status=${r.status()} body=${body.slice(0, 80)} errors=${errors2.join(' | ') || 'none'}`);
    page.off('pageerror', handler);
  }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
  const errors = [];
  page.on('pageerror', e => errors.push(e.message.slice(0, 120)));

  await page.goto(BASE + '/sign-in', { waitUntil: 'networkidle', timeout: 15000 });
  await page.locator('#signin_email, input[id*="email"]').first().fill('admin.demo@example.test');
  await page.locator('input[type="password"]').first().fill('Demo@123456');
  await page.locator('button[type="submit"]').first().click();
  await page.waitForTimeout(3000);

  const pages = [
    '/admin/ops',
    '/admin/routing',
    '/admin/templates',
    '/admin/users',
    '/admin/vault',
  ];

  for (const p of pages) {
    const errors2 = [];
    page.on('pageerror', e => errors2.push(e.message.slice(0, 120)));
    const r = await page.goto(BASE + p, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);
    const body = await page.locator('body').innerText().catch(() => '');
    console.log(`[${p}] status=${r.status()} body=${body.slice(0, 80)} errors=${errors2.join(' | ') || 'none'}`);
  }
```
</details>


## 🟡 Medium (1)

**🐛 Bug** · lines 13-16

No verification that sign-in succeeded before navigating to admin pages. The script fills credentials and waits 3 seconds blindly. If sign-in fails (e.g., wrong password, server error), the script still proceeds to the admin pages, and failures are misattributed as page-specific errors rather than authentication failures.

<details>
<summary>:bulb: Suggestion</summary>

```
  await page.locator('button[type="submit"]').first().click();
  await page.waitForURL('**/admin/**', { timeout: 15000 });
  // Verify sign-in succeeded by checking for a known element on the landing page
  await expect(page.locator('.dashboard, .admin-layout, [data-testid="admin-shell"]').first()).toBeVisible({ timeout: 10000 });

  const pages = [
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
  await page.locator('button[type="submit"]').first().click();
  await page.waitForTimeout(3000);

  const pages = [
```
</details>


## 🔵 Low (1)

**🔧 Maintainability** · line 14

Fixed waitForTimeout delays (3000ms and 2000ms) make the test flaky. If the app is slow, the test may proceed before the page is ready; if fast, it wastes time. Consider using waitForNavigation, waitForURL, or waitForSelector for sign-in, and rely on networkidle for admin page loads.

<details>
<summary>:bulb: Suggestion</summary>

```
  await page.waitForURL('**/admin/**', { timeout: 15000 });
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
  await page.waitForTimeout(3000);
```
</details>


