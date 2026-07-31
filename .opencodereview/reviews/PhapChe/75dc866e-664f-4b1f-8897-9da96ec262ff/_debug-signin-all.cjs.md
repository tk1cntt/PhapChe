# Review: `_debug-signin-all.cjs`

**Project:** PhapChe | **Review:** `75dc866e-664f-4b1f-8897-9da96ec262ff`

**Comments:** 9

---

## 🔴 Critical (1)

**🔒 Security** · lines 53-58

Hardcoded credentials in source code will be exposed in version control history. Use environment variables (e.g., process.env.TEST_ADMIN_EMAIL) or a secrets file excluded from git.

<details>
<summary>:bulb: Suggestion</summary>

```
  const roles = [
    [process.env.TEST_ADMIN_EMAIL || 'admin.demo@example.test', process.env.TEST_PASSWORD || 'Demo@123456', 'Admin'],
    [process.env.TEST_SPECIALIST_EMAIL || 'specialist.demo@example.test', process.env.TEST_PASSWORD || 'Demo@123456', 'Specialist'],
    [process.env.TEST_REVIEWER_EMAIL || 'reviewer.demo@example.test', process.env.TEST_PASSWORD || 'Demo@123456', 'Reviewer'],
    [process.env.TEST_CUSTOMER_EMAIL || 'customer.demo@example.test', process.env.TEST_PASSWORD || 'Demo@123456', 'Customer'],
  ];
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
  const roles = [
    ['admin.demo@example.test', 'Demo@123456', 'Admin'],
    ['specialist.demo@example.test', 'Demo@123456', 'Specialist'],
    ['reviewer.demo@example.test', 'Demo@123456', 'Reviewer'],
    ['customer.demo@example.test', 'Demo@123456', 'Customer'],
  ];
```
</details>


## 🟠 High (3)

**🐛 Bug** · lines 3-5

Browser resource leak on error: if any exception occurs after `browser` is created but before `browser.close()`, the browser process is orphaned. Wrap the body in try/finally to guarantee cleanup.

<details>
<summary>:bulb: Suggestion</summary>

```
async function testRole(email, password, roleName) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  try {
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
async function testRole(email, password, roleName) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
```
</details>

---

**🐛 Bug** · lines 23-25

Corresponding to the try block above, every early return path and the normal end of the function must go through `finally { await browser.close(); }`. Currently each `await browser.close(); return;` pair is duplicated, and any new early-exit risks a leak.

<details>
<summary>:bulb: Suggestion</summary>

```
    console.log(`  FAIL: Form elements missing. Body: ${body.slice(0, 200)}`);
    return;
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
    console.log(`  FAIL: Form elements missing. Body: ${body.slice(0, 200)}`);
    await browser.close();
    return;
```
</details>

---

**🐛 Bug** · lines 49-52

Remove standalone browser.close() and return; the finally block handles cleanup.

<details>
<summary>:bulb: Suggestion</summary>

```
  } finally {
    await browser.close();
  }
}

async function main() {
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
  await browser.close();
}

async function main() {
```
</details>


## 🟡 Medium (3)

**🐛 Bug** · lines 42-47

Weak success check: only verifying that the URL no longer contains '/sign-in' yields false positives. The test should assert that the response body contains expected authenticated content (e.g., dashboard elements, role-specific text) or that API auth responses return 200/redirect codes.

<details>
<summary>:bulb: Suggestion</summary>

```
  if (url.includes('/sign-in')) {
    const body = await page.locator('body').innerText().catch(() => '');
    console.log(`  FAIL: Still on sign-in. Body: ${body.slice(0, 300)}`);
  } else {
    const authReqs = allReqs.filter(r => r.url.includes('/api/auth'));
    const authSucceeded = authReqs.some(r => r.status >= 200 && r.status < 400);
    if (!authSucceeded) {
      console.log(`  FAIL: Redirected to ${url} but no successful auth API response`);
    } else {
      console.log(`  OK: Redirected to ${url}`);
    }
  }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
  if (url.includes('/sign-in')) {
    const body = await page.locator('body').innerText().catch(() => '');
    console.log(`  FAIL: Still on sign-in. Body: ${body.slice(0, 300)}`);
  } else {
    console.log(`  OK: Redirected to ${url}`);
  }
```
</details>

---

**🐛 Bug** · lines 36-40

No validation of API auth responses: the script logs API calls but never asserts on their status codes. A 401/500 response could be silently ignored while the redirect check still passes. See the suggestion above that integrates auth response validation into the success check.

<details>
<summary>:bulb: Suggestion</summary>

```
  let authStatuses = [];
  for (const r of allReqs) {
    if (r.url.includes('/api/auth')) {
      console.log(`    ${r.status || r.method} ${r.url} ${r.body}`);
      if (r.status) authStatuses.push(r.status);
    }
  }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
  for (const r of allReqs) {
    if (r.url.includes('/api/auth')) {
      console.log(`    ${r.status || r.method} ${r.url} ${r.body}`);
    }
  }
```
</details>

---

**🔧 Maintainability** · lines 30-32

Arbitrary `waitForTimeout(5000)` after form submission is fragile. If the server is slow, it may fail; if fast, it wastes time. Use `page.waitForURL(url => !url.includes('/sign-in'), { timeout: 30000 })` or `page.waitForNavigation()` for a reliable signal.

<details>
<summary>:bulb: Suggestion</summary>

```
  await page.locator('button[type="submit"]').first().click();

  await page.waitForURL(url => !url.includes('/sign-in'), { timeout: 30000 }).catch(() => {});
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
  await page.locator('button[type="submit"]').first().click();

  await page.waitForTimeout(5000);
```
</details>


## 🔵 Low (2)

**🔧 Maintainability** · lines 11-12

`page.waitForTimeout(1000)` after `networkidle` is likely unnecessary and adds flakiness. The `networkidle` event already waits for network activity to settle; remove this extra wait or replace with `page.waitForLoadState('networkidle')` if needed.

<details>
<summary>:bulb: Suggestion</summary>

```
  await page.goto('http://localhost:3000/sign-in', { waitUntil: 'networkidle', timeout: 30000 });
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
  await page.goto('http://localhost:3000/sign-in', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1000);
```
</details>

---

**🔧 Maintainability** · line 64

`e.message` loses the error stack trace, making debugging harder. Log `e` directly or use `console.error(e)` to preserve the full stack.

<details>
<summary>:bulb: Suggestion</summary>

```
main().catch(e => { console.error(e); process.exit(1); });
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
main().catch(e => { console.error('ERR:', e.message); process.exit(1); });
```
</details>


