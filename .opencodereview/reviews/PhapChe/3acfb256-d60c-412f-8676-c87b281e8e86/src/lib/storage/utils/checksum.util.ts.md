# Review: `src/lib/storage/utils/checksum.util.ts`

**Project:** PhapChe | **Review:** `3acfb256-d60c-412f-8676-c87b281e8e86`

**Comments:** 1

---

## 🟡 Medium (1)

**🔒 Security** · lines 53-59

The `verifyChecksum` function uses strict equality (`===`) to compare hex checksum strings. This comparison short-circuits on the first differing character, making it vulnerable to timing attacks. An attacker could measure response times to incrementally guess the expected checksum.

For cryptographic/integrity verification, use `crypto.timingSafeEqual` with `Buffer` objects to perform constant-time comparison.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
export function verifyChecksum(
  buffer: Buffer,
  expectedChecksum: string,
  algorithm: ChecksumAlgorithm = 'sha256'
): boolean {
  const actualChecksum = computeChecksum(buffer, algorithm);
  const actualBuf = Buffer.from(actualChecksum, 'hex');
  const expectedBuf = Buffer.from(expectedChecksum, 'hex');
  return actualBuf.length === expectedBuf.length && timingSafeEqual(actualBuf, expectedBuf);
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export function verifyChecksum(
  buffer: Buffer,
  expectedChecksum: string,
  algorithm: ChecksumAlgorithm = 'sha256'
): boolean {
  const actualChecksum = computeChecksum(buffer, algorithm);
  return actualChecksum === expectedChecksum;
```
</details>


