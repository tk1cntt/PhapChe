# Review: `.planning/quick/260607-jo3-verify-all-screens-with-content-screensh/validate-screens.cjs`

**Project:** PhapChe | **Review:** `75dc866e-664f-4b1f-8897-9da96ec262ff`

**Comments:** 9

---

## 🔴 Critical (1)

**🐛 Bug** · lines 118-122

The cookie name `session_token` is incorrect. The project uses `better-auth.session_token` (see `src/middleware.ts` line 7). This means the API-based fallback login will never work — the cookie will be ignored by the server, and the user will remain unauthenticated, causing all routes to falsely report login failures.

<details>
<summary>:bulb: Suggestion</summary>

```
      await page.context().addCookies([{
        name: 'better-auth.session_token',
        value: apiResult.token,
        domain: new URL(baseUrl).hostname,
        path: '/'
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
      await page.context().addCookies([{
        name: 'session_token',
        value: apiResult.token,
        domain: 'localhost',
        path: '/'
```
</details>


## 🟠 High (2)

**🐛 Bug** · line 121

The cookie `domain` is hardcoded to `'localhost'`. When `baseUrl` points to a different host (e.g., staging, CI container), the cookie won't be sent, rendering the fallback login useless. Use `new URL(baseUrl).hostname` to dynamically match the target domain.

<details>
<summary>:bulb: Suggestion</summary>

```
        domain: new URL(baseUrl).hostname,
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
        domain: 'localhost',
```
</details>

---

**🐛 Bug** · lines 101-102

The login form selectors `page.locator('input').nth(0)` and `page.locator('input').nth(1)` are fragile. If the page has hidden inputs, search inputs, or CSRF token fields, these indices will target the wrong elements. Use semantic selectors like `input[type='email']` and `input[type='password']`, or `input[name='email']` / `input[name='password']`.

<details>
<summary>:bulb: Suggestion</summary>

```
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
  await page.locator('input').nth(0).fill(email);
  await page.locator('input').nth(1).fill(password);
```
</details>


## 🟡 Medium (4)

**🐛 Bug** · lines 55-60

The `httpRequest` helper has no timeout. If the server hangs or is unreachable, the promise will never resolve or reject, causing the script to hang indefinitely. Add a timeout via `req.setTimeout()` or use `AbortController` with a reasonable timeout (e.g., 15 seconds).

<details>
<summary>:bulb: Suggestion</summary>

```
    const req = lib.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    });
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    req.on('error', reject);
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
    const req = lib.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    });
    req.on('error', reject);
```
</details>

---

**🐛 Bug** · lines 195-198

The browser instance is not closed in a `finally` block. If `main()` throws before reaching `browser.close()` (line 195), the browser process will leak and remain running indefinitely. Wrap the browser lifecycle in a try/finally or use a cleanup pattern.

<details>
<summary>:bulb: Suggestion</summary>

```
  const results = [];
  const browser = await chromium.launch({ headless: false });

  try {
  const roles = ['admin', 'specialist', 'reviewer'];
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
  const results = [];
  const browser = await chromium.launch({ headless: false });

  const roles = ['admin', 'specialist', 'reviewer'];
```
</details>

---

**🔧 Maintainability** · lines 158-162

The heuristic login detection (`bodyText.includes('Sign in') && bodyText.includes('password') && bodyText.length < 500`) is fragile. A non-English locale, an error page containing the word 'password', or a long login page with additional content would cause false negatives or positives. Consider checking for the presence of a specific login form element (e.g., `page.locator('form[action*="sign-in"]')`) instead.

<details>
<summary>:bulb: Suggestion</summary>

```
  // Check for login form element instead of text heuristics
  const loginForm = await page.locator('form[action*="sign-in"], input[type="password"]').count();
  if (loginForm > 0 && currentUrl.includes('/sign-in')) {
    console.log(`FAIL: ${route} - page shows login form`);
    await page.screenshot({ path: screenshotPath.replace('.png', '-FAIL-login.png') });
    return { route, status: 'FAIL', reason: 'shows login form', url: currentUrl };
  }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
  if (bodyText.includes('Sign in') && bodyText.includes('password') && bodyText.length < 500) {
    console.log(`FAIL: ${route} - page shows login form`);
    await page.screenshot({ path: screenshotPath.replace('.png', '-FAIL-login.png') });
    return { route, status: 'FAIL', reason: 'shows login form', url: currentUrl };
  }
```
</details>

---

**🔒 Security** · lines 32-36

Hardcoded credentials in source code (lines 29-32) could be accidentally committed to public repositories or exposed in logs. Consider loading credentials from environment variables (e.g., `ADMIN_EMAIL`, `ADMIN_PASSWORD`) with these values as defaults only for local development.

<details>
<summary>:bulb: Suggestion</summary>

```
const CREDENTIALS = {
  admin: {
    email: process.env.ADMIN_EMAIL || 'admin.demo@example.test',
    password: process.env.ADMIN_PASSWORD || 'Demo@123456',
  },
  specialist: {
    email: process.env.SPECIALIST_EMAIL || 'specialist.demo@example.test',
    password: process.env.SPECIALIST_PASSWORD || 'Demo@123456',
  },
  reviewer: {
    email: process.env.REVIEWER_EMAIL || 'reviewer.demo@example.test',
    password: process.env.REVIEWER_PASSWORD || 'Demo@123456',
  },
};
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
const CREDENTIALS = {
  admin: { email: 'admin.demo@example.test', password: 'Demo@123456' },
  specialist: { email: 'specialist.demo@example.test', password: 'Demo@123456' },
  reviewer: { email: 'reviewer.demo@example.test', password: 'Demo@123456' },
};
```
</details>


## 🔵 Low (2)

**🔧 Maintainability** · lines 150-152

`waitForLoadState('domcontentloaded')` on line 138 is redundant because `page.goto` already used `waitUntil: 'networkidle'`, which is a stricter condition. The DOM is guaranteed to be loaded by this point.

<details>
<summary>:bulb: Suggestion</summary>

```
  // Wait for page to stabilize after navigation
  await page.waitForTimeout(2000);
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
  // Wait for page to load
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2000);
```
</details>

---

**🔧 Maintainability** · lines 97-102

After a successful API sign-in, the function still navigates to `/sign-in` and attempts browser-based login. This is redundant and could interfere with the already-established session. Consider skipping the browser form fill when API sign-in succeeds, or at least checking `page.url()` before filling the form.

<details>
<summary>:bulb: Suggestion</summary>

```
  // Navigate to sign-in
  await page.goto(baseUrl + '/sign-in', { waitUntil: 'networkidle' });

  // If already redirected away from sign-in (e.g., due to existing session), skip form fill
  if (page.url().includes('/sign-in')) {
    await page.locator('input').nth(0).fill(email);
    await page.locator('input').nth(1).fill(password);
  }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
  // Navigate to sign-in
  await page.goto(baseUrl + '/sign-in', { waitUntil: 'networkidle' });

  // Fill form
  await page.locator('input').nth(0).fill(email);
  await page.locator('input').nth(1).fill(password);
```
</details>


