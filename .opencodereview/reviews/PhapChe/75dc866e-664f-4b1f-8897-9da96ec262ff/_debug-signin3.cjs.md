# Review: `_debug-signin3.cjs`

**Project:** PhapChe | **Review:** `75dc866e-664f-4b1f-8897-9da96ec262ff`

**Comments:** 5

---

## 🔴 Critical (1)

**🔒 Security** · lines 25-26

Hardcoded plain-text credentials in source code. These will be exposed if committed to version control, even accidentally. Use environment variables (e.g., `process.env.TEST_EMAIL` / `process.env.TEST_PASSWORD`) or a secrets manager, and add proper validation to fail fast with a clear message if they are missing.

<details>
<summary>:bulb: Suggestion</summary>

```
  const email = process.env.TEST_EMAIL;
  const password = process.env.TEST_PASSWORD;
  if (!email || !password) {
    throw new Error('TEST_EMAIL and TEST_PASSWORD environment variables must be set');
  }
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


## 🟠 High (1)

**🐛 Bug** · line 41

Browser resource leak: if any error occurs before `browser.close()` (e.g., `page.goto` timeout, `page.fill` or `page.click` failure), the `catch` handler only logs the error and exits without closing the browser. This leaves orphan Chromium processes. Wrap the core logic in a `try/finally` block to guarantee `browser.close()` is always called.

<details>
<summary>:bulb: Suggestion</summary>

```
async function main() {
  const browser = await chromium.launch({ headless: true });
  try {
    // ... core logic ...
  } finally {
    await browser.close();
  }
}

main().catch(e => { console.error('ERR:', e); process.exit(1); });
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
main().catch(e => { console.error('ERR:', e.message); process.exit(1); });
```
</details>


## 🟡 Medium (2)

**🐛 Bug** · lines 27-29

`waitForTimeout(5000)` is a fixed sleep that may be insufficient for slow networks or overloaded servers, causing the script to miss the auth response and produce false negatives. Replace it with a deterministic condition such as `page.waitForURL('**/dashboard')` (or whatever the post-login URL is) or `page.waitForResponse(r => r.url().includes('/api/auth') && r.status() === 200)`.

<details>
<summary>:bulb: Suggestion</summary>

```
  await page.locator('button[type="submit"]').first().click();

  // Wait for the auth API response to confirm sign-in completed
  await page.waitForResponse(
    resp => resp.url().includes('/api/auth') && resp.status() === 200,
    { timeout: 15000 }
  );
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
  await page.locator('button[type="submit"]').first().click();

  await page.waitForTimeout(5000);
```
</details>

---

**🔧 Maintainability** · lines 12-21

No assertion that sign-in actually succeeded. The script collects logs but never verifies whether the response status indicates success (2xx) or failure (4xx/5xx). Add a check on the auth response status code and fail the script explicitly if sign-in fails.

<details>
<summary>:bulb: Suggestion</summary>

```
  let authSuccess = false;
  page.on('response', async resp => {
    if (resp.url().includes('/api/auth')) {
      try {
        const body = await resp.text();
        console.log(`Auth response [${resp.status()}]: ${body.slice(0, 300)}`);
        if (resp.status() >= 200 && resp.status() < 300) {
          authSuccess = true;
        }
      } catch (e) {
        console.log(`Auth response [${resp.status()}]: (could not read body)`);
      }
    }
  });
  // ... after waiting ...
  if (!authSuccess) {
    throw new Error('Sign-in did not complete successfully');
  }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
  page.on('response', async resp => {
    if (resp.url().includes('/api/auth')) {
      try {
        const body = await resp.text();
        console.log(`Auth response [${resp.status()}]: ${body.slice(0, 300)}`);
      } catch (e) {
        console.log(`Auth response [${resp.status()}]: (could not read body)`);
      }
    }
  });
```
</details>


## 🔵 Low (1)

**🔧 Maintainability** · line 41

The `catch` handler logs only `e.message`, discarding the stack trace which is critical for debugging. Log the full error object: `console.error('ERR:', e)`.

<details>
<summary>:bulb: Suggestion</summary>

```
main().catch(e => { console.error('ERR:', e); process.exit(1); });
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
main().catch(e => { console.error('ERR:', e.message); process.exit(1); });
```
</details>


