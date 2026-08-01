# Review: `src/lib/delivery/notification-service.ts`

**Project:** PhapChe | **Review:** `a2736937-db71-4beb-86ac-fff7eae35f18`

**Comments:** 5

---

## 🔴 Critical (1)

**🐛 Bug** · lines 16-17

**Missing null/undefined guard for `input`.** If `sendDeliveryReadyEmail(null)` or `sendDeliveryReadyEmail(undefined)` is called, accessing `.to` on line 13 will throw a `TypeError` before the validation logic runs. Add a top-level check: `if (!input) throw new Error('EMAIL_INPUT_REQUIRED');`.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
export async function sendDeliveryReadyEmail(input: DeliveryReadyEmailInput): Promise<DeliveryReadyEmailResult> {
  if (!input) throw new Error('EMAIL_INPUT_REQUIRED');
  if (!input.to.trim()) throw new Error('EMAIL_TO_REQUIRED');
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export async function sendDeliveryReadyEmail(input: DeliveryReadyEmailInput): Promise<DeliveryReadyEmailResult> {
  if (!input.to.trim()) throw new Error('EMAIL_TO_REQUIRED');
```
</details>


## 🟠 High (1)

**🐛 Bug** · line 21

**Missing null/undefined guard for `input.filenames`.** If `filenames` is `undefined` or `null` at runtime (e.g., the caller bypasses TypeScript), calling `.map()` will throw a `TypeError`. Add a guard before the map call.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  if (!input.filenames || !Array.isArray(input.filenames)) throw new Error('EMAIL_FILENAMES_REQUIRED');
  const filenames = input.filenames.map((filename) => filename.trim()).filter(Boolean);
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  const filenames = input.filenames.map((filename) => filename.trim()).filter(Boolean);
```
</details>


## 🟡 Medium (2)

**🔒 Security** · lines 29-30

**Unvalidated `portalUrl` used in email body.** The URL is not validated for format or safety. A malicious caller could inject a phishing link, or embed newline characters (`\n`) to break the email body structure and insert arbitrary content. Add URL validation (e.g., check that it starts with `https://` and contains no newlines).

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    if (!/^https:\/\/.+/.test(input.portalUrl) || input.portalUrl.includes('\n')) {
      throw new Error('EMAIL_PORTAL_URL_INVALID');
    }
    const body = [
      `Yêu cầu: ${input.requestTitle}`,
      'Tài liệu final:',
      ...filenames.map((filename) => `- ${filename}`),
      `Truy cập/tải xuống: ${input.portalUrl}`,
      'Liên kết tải xuống có hiệu lực trong 15 phút.',
    ].join('\n');
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    `Truy cập/tải xuống: ${input.portalUrl}`,
    'Liên kết tải xuống có hiệu lực trong 15 phút.',
```
</details>

---

**🔧 Maintainability** · lines 24-31

**Hardcoded email template and validity period.** The Vietnamese subject, body template, and the 15-minute validity period are hardcoded. This makes localization and configuration changes difficult (e.g., changing the validity duration requires a code change). Consider extracting these into a configurable template or constants.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
const VALIDITY_MINUTES = 15;
const subject = `Tài liệu final đã sẵn sàng: ${input.requestTitle}`;
const body = [
  `Yêu cầu: ${input.requestTitle}`,
  'Tài liệu final:',
  ...filenames.map((filename) => `- ${filename}`),
  `Truy cập/tải xuống: ${input.portalUrl}`,
  `Liên kết tải xuống có hiệu lực trong ${VALIDITY_MINUTES} phút.`,
].join('\n');
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  const subject = `Tài liệu final đã sẵn sàng: ${input.requestTitle}`;
  const body = [
    `Yêu cầu: ${input.requestTitle}`,
    'Tài liệu final:',
    ...filenames.map((filename) => `- ${filename}`),
    `Truy cập/tải xuống: ${input.portalUrl}`,
    'Liên kết tải xuống có hiệu lực trong 15 phút.',
  ].join('\n');
```
</details>


## 🔵 Low (1)

**🔧 Maintainability** · line 16

**Unnecessary `async` keyword.** The function body contains no `await` expressions and returns a plain object synchronously. The `async` keyword is misleading and adds unnecessary microtask overhead. Either remove `async` and wrap the return in `Promise.resolve(...)`, or keep it if async behavior (e.g., calling an email provider) is planned for the near future.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
export function sendDeliveryReadyEmail(input: DeliveryReadyEmailInput): Promise<DeliveryReadyEmailResult> {
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export async function sendDeliveryReadyEmail(input: DeliveryReadyEmailInput): Promise<DeliveryReadyEmailResult> {
```
</details>


