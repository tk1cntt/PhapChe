# Review: `_debug-500.cjs`

**Project:** PhapChe | **Review:** `75dc866e-664f-4b1f-8897-9da96ec262ff`

**Comments:** 6

---

## 🔴 Critical (1)

**🐛 Bug** · lines 24-25

**No HTTP response status check**: `page.goto()` does not throw on HTTP error status codes (e.g., 500) in Playwright. The script's entire purpose is to debug a 500 error, yet the response status is never inspected. A 500 error from `/admin/ops` will be silently ignored.

**Fix**: Capture the response object and check its status, e.g.:
```js
const [response] = await Promise.all([
  page.waitForResponse(r => r.url().includes('/admin/ops')),
  page.goto(BASE + '/admin/ops', { waitUntil: 'networkidle', timeout: 30000 })
]);
console.log('Response status:', response.status());
if (response.status() >= 500) console.error('Server error detected!');
```

<details>
<summary>:bulb: Suggestion</summary>

```
  const [response] = await Promise.all([
    page.waitForResponse(r => r.url().includes('/admin/ops') && r.status() >= 200),
    page.goto(BASE + '/admin/ops', { waitUntil: 'networkidle', timeout: 30000 })
  ]);
  console.log('Response status:', response.status());
  if (response.status() >= 500) console.error('Server error detected!');
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
  await page.goto(BASE + '/admin/ops', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);
```
</details>


## 🟠 High (2)

**🐛 Bug** · lines 19-21

**Missing sign-in success verification**: The script fills credentials and clicks submit but never asserts that authentication succeeded. If sign-in fails silently (e.g., wrong password, server error), the script continues to navigate to `/admin/ops` and may produce misleading results.

**Fix**: After clicking submit, verify sign-in success by checking for a known authenticated element or URL change:
```js
await page.waitForURL(url => !url.includes('/sign-in'), { timeout: 10000 });
// Or: await page.waitForSelector('[data-testid="user-menu"]', { timeout: 10000 });
```

<details>
<summary>:bulb: Suggestion</summary>

```
  await page.locator('button[type="submit"]').first().click();
  await page.waitForURL(url => !url.includes('/sign-in'), { timeout: 10000 });
  console.log('Signed in, URL:', page.url());
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
  await page.locator('button[type="submit"]').first().click();
  await page.waitForTimeout(3000);
  console.log('Signed in, URL:', page.url());
```
</details>

---

**🐛 Bug** · lines 9-10

**Missing network response/error monitoring**: The script only listens for `console` and `pageerror` events, but a 500 error is an HTTP response — it will not appear as a console error or page error. Network failures (e.g., `requestfailed`) and non-2xx responses are also invisible.

**Fix**: Add listeners for network-level events:
```js
page.on('response', resp => {
  if (resp.status() >= 400) logs.push(`[HTTP ${resp.status()}] ${resp.url()}`);
});
page.on('requestfailed', req => logs.push(`[REQUESTFAILED] ${req.url()}: ${req.failure()?.errorText}`));
```

<details>
<summary>:bulb: Suggestion</summary>

```
  page.on('console', msg => logs.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', e => logs.push(`[PAGEERROR] ${e.message}`));
  page.on('response', resp => {
    if (resp.status() >= 400) logs.push(`[HTTP ${resp.status()}] ${resp.url()}`);
  });
  page.on('requestfailed', req => logs.push(`[REQUESTFAILED] ${req.url()}: ${req.failure()?.errorText}`));
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
  page.on('console', msg => logs.push(`[${msg.type()}] ${msg.text().slice(0, 300)}`));
  page.on('pageerror', e => logs.push(`[PAGEERROR] ${e.message.slice(0, 300)}`));
```
</details>


## 🟡 Medium (2)

**⚡ Performance** · line 20

**Reliance on fixed delays (`waitForTimeout`)**: Lines 21 and 26 use hardcoded `waitForTimeout(3000)` and `waitForTimeout(2000)`. These are fragile — if the app is slower than expected, the script proceeds before the page is ready; if faster, it wastes time. This is especially problematic for a debugging script trying to catch a transient error.

**Fix**: Replace with event-driven waits:
- After sign-in: `waitForURL` or `waitForSelector` for an authenticated element.
- After navigation: `waitForResponse` for the key API call, or `waitForSelector` for the page content.

<details>
<summary>:clipboard: Existing Code</summary>

```
  await page.waitForTimeout(3000);
```
</details>

---

**🔧 Maintainability** · lines 9-10

**Error message truncation loses debugging data**: Both console messages and page errors are truncated to 300 characters via `.slice(0, 300)`. For a debugging script, this can discard critical stack traces, error details, and context needed to diagnose the 500 error.

**Fix**: Remove the truncation, or log full messages to a file while keeping a truncated version for console display only.

<details>
<summary>:bulb: Suggestion</summary>

```
  page.on('console', msg => logs.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', e => logs.push(`[PAGEERROR] ${e.message}`));
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
  page.on('console', msg => logs.push(`[${msg.type()}] ${msg.text().slice(0, 300)}`));
  page.on('pageerror', e => logs.push(`[PAGEERROR] ${e.message.slice(0, 300)}`));
```
</details>


## 🔵 Low (1)

**🐛 Bug** · line 39

**Main error handler discards stack trace**: The `.catch()` handler on line 38 only logs `e.message`, losing the full stack trace. This makes debugging script-level failures (e.g., timeouts, selector mismatches) much harder.

**Fix**: Log the full error object:
```js
main().catch(e => { console.error('ERR:', e); process.exit(1); });
```

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


