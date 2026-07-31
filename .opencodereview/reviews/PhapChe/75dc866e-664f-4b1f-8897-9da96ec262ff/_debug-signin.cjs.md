# Review: `_debug-signin.cjs`

**Project:** PhapChe | **Review:** `75dc866e-664f-4b1f-8897-9da96ec262ff`

**Comments:** 5

---

## 🔴 Critical (1)

**🐛 Bug** · lines 33-38

Network response listener is registered AFTER the sign-in action and the 5-second wait. All sign-in related HTTP responses (including the actual login API call) have already completed by the time this listener is attached. The `failedRequests` array will only capture responses that occur after line 28, making the failed request check unreliable and effectively useless for validating the sign-in flow.

<details>
<summary>:bulb: Suggestion</summary>

```
  const failedRequests = [];
  page.on('response', resp => {
    if (resp.status() >= 400) {
      failedRequests.push(`${resp.status()} ${resp.url()}`);
    }
  });

  // Move the listener registration BEFORE the sign-in action
  // (i.e., right after `const page = await browser.newPage();`)
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
  const failedRequests = [];
  page.on('response', resp => {
    if (resp.status() >= 400) {
      failedRequests.push(`${resp.status()} ${resp.url()}`);
    }
  });
```
</details>


## 🟠 High (1)

**🔒 Security** · lines 12-13

Hardcoded credentials in plaintext. If this debug script is committed to source control (even accidentally), credentials will be exposed. Consider reading credentials from environment variables (`process.env.SIGNIN_EMAIL`, `process.env.SIGNIN_PASSWORD`) or a local `.env` file that is `.gitignore`-d.

<details>
<summary>:bulb: Suggestion</summary>

```
  const email = process.env.SIGNIN_EMAIL || 'admin.demo@example.test';
  const password = process.env.SIGNIN_PASSWORD;
  if (!password) throw new Error('SIGNIN_PASSWORD env var required');
  await page.locator('input[id="signin_email"], input[id*="email"], input[placeholder*="Email" i]').first().fill(email);
  await page.locator('input[type="password"]').first().fill(password);
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
  await page.locator('input[id="signin_email"], input[id*="email"], input[placeholder*="Email" i]').first().fill('admin.demo@example.test');
  await page.locator('input[type="password"]').first().fill('Demo@123456');
```
</details>


## 🟡 Medium (3)

**🐛 Bug** · line 19

Fixed `waitForTimeout(5000)` after form submission is fragile. If the app is slow (cold start, CI environment), 5 seconds may not be enough, causing the script to read the page state before sign-in completes. Conversely, if the app is fast, the script wastes time. Use `page.waitForURL()` or `page.waitForNavigation()` to wait for the actual redirect, or poll for a success indicator element.

<details>
<summary>:bulb: Suggestion</summary>

```
  // Wait for redirect or a success indicator instead of a fixed timeout
  await page.waitForURL(url => url !== 'http://localhost:3000/sign-in', { timeout: 15000 });
  // Or: await page.waitForSelector('.dashboard, .user-menu', { timeout: 15000 });
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
  await page.waitForTimeout(5000);
```
</details>

---

**🐛 Bug** · line 26

The error message selector `.ant-message-error, [class*="error"], [class*="message"]` is overly broad. `[class*="message"]` will match elements with class containing "message" — including success messages, info messages, or neutral messaging components. This causes false positives where non-error messages are reported as errors. Narrow the selector to only match actual error UI elements.

<details>
<summary>:bulb: Suggestion</summary>

```
  // Use more specific selectors for error elements only
  const errorEl = await page.locator('.ant-message-error, [class*="error-message"], [class*="errorMessage"], [role="alert"]').all();
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
  const errorEl = await page.locator('.ant-message-error, [class*="error"], [class*="message"]').all();
```
</details>

---

**🐛 Bug** · line 47

If `page.goto()` or any step before the script ends throws an error, the browser is never closed. The `main().catch()` handler only logs the error and exits, potentially leaving orphaned Chromium processes. Use a `try/finally` block inside `main()` to ensure `browser.close()` is always called.

<details>
<summary>:bulb: Suggestion</summary>

```
async function main() {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    // ... rest of the script ...
    await browser.close();
  } catch (e) {
    console.error('ERR:', e.message);
    await browser.close();
    process.exit(1);
  }
}

main();
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
main().catch(e => { console.error('ERR:', e.message); process.exit(1); });
```
</details>


