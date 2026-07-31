# Review: `_test-signin-direct.cjs`

**Project:** PhapChe | **Review:** `75dc866e-664f-4b1f-8897-9da96ec262ff`

**Comments:** 7

---

## 🟡 Medium (2)

**🐛 Bug** · lines 16-21

**Bug: Account lookup uniqueness assumption**
Using `findFirst` without a guaranteed unique constraint on `(providerId, accountId)` may return an arbitrary matching account if duplicates exist. better-auth's schema should have a unique constraint on this pair, but if it's missing, this test script could silently verify against the wrong account. Consider using `findUnique` if the schema guarantees uniqueness, or add a comment acknowledging the assumption.

<details>
<summary>:bulb: Suggestion</summary>

```
  // Assumes unique constraint on (providerId, accountId) exists in the schema
  const account = await db.account.findUnique({
    where: {
      providerId_accountId: {
        providerId: 'credential',
        accountId: email,
      },
    },
  });
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
  const account = await db.account.findFirst({
    where: {
      providerId: 'credential',
      accountId: email,
    },
  });
```
</details>

---

**🐛 Bug** · line 31

**Bug: bcrypt.compare may throw on malformed hashes**
`bcrypt.compare` throws an error if the stored hash is malformed (not a valid bcrypt hash string). This is not caught locally — it propagates to the outer `.catch()` which only logs `e.message` and exits. Consider wrapping in a try/catch to gracefully handle corrupt hash data and provide a clear diagnostic message.

<details>
<summary>:bulb: Suggestion</summary>

```
      try {
        const match = await bcrypt.compare(password, account.password);
        console.log('  bcrypt match:', match);
      } catch (err) {
        console.error('  bcrypt.compare failed (malformed hash?):', err.message);
        console.log('  bcrypt match: false (error)');
      }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
      const match = await bcrypt.compare(password, account.password);
```
</details>


## 🔵 Low (5)

**🐛 Bug** · lines 58-61

**Bug: PrismaClient not disconnected on error paths**
`db.$disconnect()` is only called in the normal flow. If an error is thrown (e.g., from `bcrypt.compare`, a DB query failure, or the early `process.exit(1)`), the connection pool is not properly released. Use a `finally` block or `try/finally` to ensure `$disconnect()` always runs.

<details>
<summary>:bulb: Suggestion</summary>

```
  } finally {
    await db.$disconnect();
  }
}

main().catch(e => { console.error('ERR:', e); process.exit(1); });
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
  await db.$disconnect();
}

main().catch(e => { console.error('ERR:', e.message); process.exit(1); });
```
</details>

---

**🔒 Security** · lines 47-50

**Security: Session tokens unnecessarily selected**
The `token` field is selected from the `session` table but only `sessions.length` is logged. If someone later adds `console.log(sessions)` for debugging, session tokens would be leaked to the console. Select only the fields you need (`id`, `expiresAt`).

<details>
<summary>:bulb: Suggestion</summary>

```
        const sessions = await db.session.findMany({
          where: { userId: account.userId },
          select: { id: true, expiresAt: true }
        });
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
        const sessions = await db.session.findMany({
          where: { userId: account.userId },
          select: { id: true, token: true, expiresAt: true }
        });
```
</details>

---

**🔧 Maintainability** · line 1

**Maintainability: Hardcoded absolute path**
The `.env.local` path `D:/PhapChe/.env.local` is Windows-specific and hardcoded to a particular user directory. This breaks portability across environments and operating systems. Use a relative path or environment variable for the dotenv config path.

<details>
<summary>:bulb: Suggestion</summary>

```
require('dotenv').config({ path: require('path').resolve(__dirname, '.env.local') });
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
require('dotenv').config({ path: 'D:/PhapChe/.env.local' });
```
</details>

---

**🔧 Maintainability** · line 61

**Maintainability: Error handler discards stack trace**
The `.catch()` handler only logs `e.message`, which discards the stack trace — making debugging harder. Use `console.error(e)` or `console.error('ERR:', e)` to preserve the full error object.

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

---

**🔒 Security** · line 44

**Security: User email logged to console**
`JSON.stringify(user)` outputs the user's email to the console. In test scripts, this can leak PII to log files, CI/CD output, or shared terminals. Consider masking the email or only logging non-sensitive fields like `user.id`.

<details>
<summary>:bulb: Suggestion</summary>

```
        console.log('  >> User ID:', user.id);
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
        console.log('  >> User:', JSON.stringify(user));
```
</details>


