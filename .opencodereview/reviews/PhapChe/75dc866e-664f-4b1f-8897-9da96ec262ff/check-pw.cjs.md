# Review: `check-pw.cjs`

**Project:** PhapChe | **Review:** `75dc866e-664f-4b1f-8897-9da96ec262ff`

**Comments:** 4

---

## 🔴 Critical (1)

**🐛 Bug** · lines 5-6

Critical bug: `findFirst` can return `null` when no account with `providerId: 'credential'` exists. Accessing `a.password` on null will throw `TypeError: Cannot read properties of null`, crashing the script with an unhelpful error. Add a null check before accessing `a.password`.

<details>
<summary>:bulb: Suggestion</summary>

```
db.account.findFirst({ where: { providerId: 'credential' } }).then(a => {
  if (!a) {
    console.error('No credential account found');
    process.exit(1);
  }
  console.log('Hash prefix:', a.password.slice(0, 20));
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
db.account.findFirst({ where: { providerId: 'credential' } }).then(a => {
  console.log('Hash prefix:', a.password.slice(0, 20));
```
</details>


## 🟠 High (1)

**🐛 Bug** · line 12

Resource leak: the `.catch` handler calls `process.exit(1)` without first disconnecting the Prisma client via `db.$disconnect()`. While `process.exit` will eventually clean up, not disconnecting can leave database connections lingering. Also, the success path's `$disconnect()` is only called inside the nested `.then()` — if `bcrypt.compare` rejects, `$disconnect()` is never called. Use a `.finally()` block to ensure cleanup always runs.

<details>
<summary>:bulb: Suggestion</summary>

```
}).catch(e => { console.error(e); }).finally(() => db.$disconnect());

// Also add process.exit handling in the then/catch chain if needed
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
}).catch(e => { console.error(e); process.exit(1); });
```
</details>


## 🟡 Medium (1)

**🔒 Security** · line 7

Security: Hardcoded fallback password `'Demo@123456'` may be used unintentionally in production if `TEST_PASSWORD` is not set. This is a utility script, but consider removing the default or using a more explicit sentinel that fails loudly rather than silently using a weak password.

<details>
<summary>:bulb: Suggestion</summary>

```
  const pwd = process.env.TEST_PASSWORD;
  if (!pwd) {
    console.error('TEST_PASSWORD environment variable is required');
    process.exit(1);
  }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
  const pwd = process.env.TEST_PASSWORD || 'Demo@123456';
```
</details>


## 🔵 Low (1)

**🔒 Security** · line 6

Security: Logging the first 20 characters of the bcrypt hash exposes part of the salt and hash rounds. While bcrypt hashes are not reversible, this information leakage can aid attackers in understanding your hashing configuration. Remove or redact this log in production scripts.

<details>
<summary>:bulb: Suggestion</summary>

```
  // Avoid logging password hash in production
  // console.log('Hash prefix:', a.password.slice(0, 20));
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
  console.log('Hash prefix:', a.password.slice(0, 20));
```
</details>


