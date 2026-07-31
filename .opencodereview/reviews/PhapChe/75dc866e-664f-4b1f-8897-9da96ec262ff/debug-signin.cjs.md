# Review: `debug-signin.cjs`

**Project:** PhapChe | **Review:** `75dc866e-664f-4b1f-8897-9da96ec262ff`

**Comments:** 6

---

## 🟠 High (3)

**🔒 Security** · lines 14-15

Hardcoded credentials in source code: the email and password are plain-text literals. If this file is committed to version control, credentials are exposed. Consider reading from environment variables (e.g., `process.env.TEST_EMAIL`, `process.env.TEST_PASSWORD`) or a secure secret store.

<details>
<summary>:bulb: Suggestion</summary>

```
  const email = process.env.TEST_EMAIL || 'admin.demo@example.test';
  const password = process.env.TEST_PASSWORD;
  if (!password) throw new Error('TEST_PASSWORD environment variable is required');
  await page.locator('input[type=email], input[name=email]').first().fill(email);
  await page.locator('input[type=password]').first().fill(password);
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
  await page.locator('input[type=email], input[name=email]').first().fill('admin.demo@example.test');
  await page.locator('input[type=password]').first().fill('Demo@123456');
```
</details>

---

**🐛 Bug** · line 30

Browser resource leak on error: the `catch` handler at line 28 only logs `e.message` but does not close the browser. If any step fails (e.g., `page.goto` times out, locator not found), the browser process remains running, leaking system resources. Use `try/finally` or a pattern that guarantees `browser.close()` is called.

<details>
<summary>:bulb: Suggestion</summary>

```
})().catch(e => {
  console.error(e);
  process.exit(1);
});
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
})().catch(e => console.error(e.message));
```
</details>

---

**🐛 Bug** · lines 18-20

No assertion that sign-in actually succeeded: the script logs the final URL and errors but never verifies the sign-in outcome. A failed sign-in (e.g., wrong credentials, server error) may still produce a "successful" run. Add an assertion on the final URL (should redirect away from `/sign-in`), a success element (e.g., dashboard), or a cookie/token being set.

<details>
<summary>:bulb: Suggestion</summary>

```
  // Wait for successful sign-in redirect instead of a fixed timeout
  await page.waitForURL(url => !url.includes('/sign-in'), { timeout: 10000 });

  console.log('Final URL:', page.url());
  if (page.url().includes('/sign-in')) {
    throw new Error('Sign-in failed: still on sign-in page after submission');
  }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
  await page.waitForTimeout(5000);

  console.log('Final URL:', page.url());
```
</details>


## 🟡 Medium (2)

**🐛 Bug** · line 18

Fixed `waitForTimeout(5000)` is flaky and slow: a 5-second fixed delay may be insufficient on slow networks or CI, or waste time on fast ones. Use `page.waitForURL()` to wait for a post-sign-in redirect, or `page.waitForSelector()` for a success indicator element.

<details>
<summary>:bulb: Suggestion</summary>

```
  await page.waitForURL(url => !url.pathname.startsWith('/sign-in'), { timeout: 15000 });
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
  await page.waitForTimeout(5000);
```
</details>

---

**🔧 Maintainability** · lines 14-16

Ambiguous element selectors with `.first()`: the locators `input[type=email], input[name=email]` and `button[type=submit]` are too broad. If the page has multiple forms or hidden elements, `.first()` may target the wrong one. Use more specific selectors like `form[action*="sign-in"] input[type=email]` or `data-testid` attributes.

<details>
<summary>:bulb: Suggestion</summary>

```
  // Prefer a more specific selector, e.g., within the sign-in form
  const form = page.locator('form');
  await form.locator('input[type=email], input[name=email]').first().fill(email);
  await form.locator('input[type=password]').first().fill(password);
  await form.locator('button[type=submit]').first().click();
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
  await page.locator('input[type=email], input[name=email]').first().fill('admin.demo@example.test');
  await page.locator('input[type=password]').first().fill('Demo@123456');
  await page.locator('button[type=submit]').first().click();
```
</details>


## 🔵 Low (1)

**🐛 Bug** · line 30

`catch` handler only logs `e.message`, discarding the stack trace. This makes debugging failures harder. Log the full error object (`console.error(e)`) instead.

<details>
<summary>:bulb: Suggestion</summary>

```
})().catch(e => {
  console.error(e);
  process.exit(1);
});
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
})().catch(e => console.error(e.message));
```
</details>


