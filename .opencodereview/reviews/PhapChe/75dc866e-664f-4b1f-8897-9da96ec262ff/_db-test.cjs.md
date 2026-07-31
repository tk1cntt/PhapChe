# Review: `_db-test.cjs`

**Project:** PhapChe | **Review:** `75dc866e-664f-4b1f-8897-9da96ec262ff`

**Comments:** 5

---

## 🟡 Medium (4)

**🔒 Security** · line 17

**Hardcoded default password**: `'Demo@123456'` is a plaintext fallback embedded in source code. If this script is committed to version control, it exposes a default credential pattern. If this default were to accidentally match a real user's password, the comparison would succeed, potentially misleading diagnostics. Consider removing the default and requiring the password via environment variable, or using an obviously non-functional placeholder.

<details>
<summary>:bulb: Suggestion</summary>

```
      const testPwd = process.env.TEST_PASSWORD;
      if (!testPwd) throw new Error('TEST_PASSWORD env var is required');
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
      const testPwd = process.env.TEST_PASSWORD || 'Demo@123456';
```
</details>

---

**🐛 Bug** · line 26

**Resource leak on error**: If `main()` throws before `db.$disconnect()` is reached (e.g., during `findMany`), the `.catch()` handler calls `process.exit(1)` without releasing the Prisma connection pool. This can leave database connections dangling. Consider wrapping the main logic in a `try/finally` block to guarantee `$disconnect` is always called.

<details>
<summary>:bulb: Suggestion</summary>

```
main()
  .catch(e => { console.error('ERR:', e.message); })
  .finally(() => db.$disconnect().then(() => process.exitCode = 1));
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
main().catch(e => { console.error('ERR:', JSON.stringify(e)); process.exit(1); });
```
</details>

---

**🔒 Security** · line 26

**Error information leakage**: `JSON.stringify(e)` on a Prisma error can expose sensitive internal details such as database connection strings, table schemas, and full stack traces in logs. Use `e.message` or a dedicated logger that sanitizes error output.

<details>
<summary>:bulb: Suggestion</summary>

```
main().catch(e => { console.error('ERR:', e.message); process.exit(1); });
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
main().catch(e => { console.error('ERR:', JSON.stringify(e)); process.exit(1); });
```
</details>

---

**🐛 Bug** · line 20

**Missing null guard for `acc.user`**: The code accesses `acc.user.email` in the loop, but if the `user` relation returns `null` (e.g., orphaned account with no associated user), this will throw a `TypeError` and crash the script. Add a null check or use optional chaining.

<details>
<summary>:bulb: Suggestion</summary>

```
    console.log(`  ${acc.user?.email ?? 'N/A'} | pwd: ${pwdSet ? 'YES' : 'NO'} | bcrypt: ${bcryptOk ? 'PASS' : '---'}`);
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
    console.log(`  ${acc.user.email} | pwd: ${pwdSet ? 'YES' : 'NO'} | bcrypt: ${bcryptOk ? 'PASS' : '---'}`);
```
</details>


## 🔵 Low (1)

**🔧 Maintainability** · line 1

**Hardcoded absolute path**: `'D:/PhapChe/.env.local'` is a Windows-specific, machine-dependent absolute path. This makes the script non-portable across environments and developers. Consider using a relative path like `'../../.env.local'` or relying on dotenv's default behavior (which looks for `.env` in `cwd`).

<details>
<summary>:bulb: Suggestion</summary>

```
require('dotenv').config({ path: '../../.env.local' });
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
require('dotenv').config({ path: 'D:/PhapChe/.env.local' });
```
</details>


