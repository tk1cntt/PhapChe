# Review: `check-admin.cjs`

**Project:** PhapChe | **Review:** `75dc866e-664f-4b1f-8897-9da96ec262ff`

**Comments:** 5

---

## 🟠 High (1)

**🔒 Security** · line 14

**Sensitive data exposure via account logging**: `JSON.stringify(account)` logs the entire Account object, which in NextAuth.js/Prisma typically contains OAuth secrets like `access_token`, `refresh_token`, `id_token`, and `expires_at`. This is a security risk — these tokens could be captured in log output, stdout, or CI/CD logs. Consider logging only non-sensitive fields (e.g., `account.provider`, `account.providerAccountId`, `account.id`) or using a sanitized serializer.

<details>
<summary>:bulb: Suggestion</summary>

```
  console.log('Account:', account ? { provider: account.provider, providerAccountId: account.providerAccountId } : null);
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
  console.log('Account:', JSON.stringify(account));
```
</details>


## 🟡 Medium (2)

**🔧 Maintainability** · line 13

**Non-deterministic account selection**: `findFirst` without an `orderBy` clause returns an arbitrary (database-dependent) account when multiple accounts exist for the same user. This makes the script's output unpredictable. Consider adding `orderBy: { provider: 'asc' }` or other deterministic ordering, or use `findMany` to list all accounts.

<details>
<summary>:bulb: Suggestion</summary>

```
  const account = await db.account.findFirst({ where: { userId: user.id }, orderBy: { provider: 'asc' } });
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
  const account = await db.account.findFirst({ where: { userId: user.id } });
```
</details>

---

**🐛 Bug** · line 19

**Resource leak on query failure**: The `.catch()` handler calls `process.exit(1)` without first calling `db.$disconnect()`. If the Prisma client has an active connection pool when the error occurs, those connections are not gracefully released. While `process.exit` ultimately closes them, it skips Prisma's cleanup logic. Add `await db.$disconnect()` before `process.exit(1)`.

<details>
<summary>:bulb: Suggestion</summary>

```
main().catch(async e => { console.error(e.message.split('\n')[0]); await db.$disconnect(); process.exit(1); });
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
main().catch(e => { console.error(e.message.split('\n')[0]); process.exit(1); });
```
</details>


## 🔵 Low (2)

**🔧 Maintainability** · line 19

**Error details suppressed**: Only the first line of `e.message` is printed (`e.message.split('\n')[0]`), which can hide the full error message and stack trace during debugging. For a one-off admin script, full error visibility is important. Consider logging the entire error with `console.error(e)` or at least `e.stack`.

<details>
<summary>:bulb: Suggestion</summary>

```
main().catch(async e => { console.error(e); await db.$disconnect(); process.exit(1); });
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
main().catch(e => { console.error(e.message.split('\n')[0]); process.exit(1); });
```
</details>

---

**🔧 Maintainability** · lines 13-14

**Missing null check on account result**: If the user exists but has no associated account, `JSON.stringify(account)` logs `null` without any explicit indication. This could be confusing. Consider adding a guard that logs a clear message when no account is found.

<details>
<summary>:bulb: Suggestion</summary>

```
  const account = await db.account.findFirst({ where: { userId: user.id }, orderBy: { provider: 'asc' } });
  if (!account) {
    console.log('No account found for user');
  } else {
    console.log('Account:', account.provider, account.providerAccountId);
  }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
  const account = await db.account.findFirst({ where: { userId: user.id } });
  console.log('Account:', JSON.stringify(account));
```
</details>


