# Review: `_gen-scrypt.cjs`

**Project:** PhapChe | **Review:** `75dc866e-664f-4b1f-8897-9da96ec262ff`

**Comments:** 5

---

## 🟠 High (2)

**🐛 Bug** · lines 53-55

Null reference: `fresh` can be `null` if an account is deleted between the update loop and verification loop. Accessing `fresh.password` will throw a `TypeError`, aborting the script and leaving remaining accounts unverified. Add a null check before accessing `fresh.password`.

<details>
<summary>:bulb: Suggestion</summary>

```
    const fresh = await db.account.findUnique({ where: { id: acc.id } });
    if (!fresh) {
      console.log(`  ${acc.accountId}: GONE (account deleted)`);
      anyFailed = true;
      continue;
    }
    const ok = verifyPassword(fresh.password, password);
    console.log(`  ${acc.accountId}: ${ok ? 'PASS' : 'FAIL'}`);
    if (!ok) anyFailed = true;
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
    const fresh = await db.account.findUnique({ where: { id: acc.id } });
    const ok = verifyPassword(fresh.password, password);
    console.log(`  ${acc.accountId}: ${ok ? 'PASS' : 'FAIL'}`);
```
</details>

---

**🐛 Bug** · lines 50-59

Silent failure: when verification returns 'FAIL', the script logs the message but continues and eventually exits with code 0. This means a CI/CD pipeline or automation would not detect data corruption. Track verification failures and exit with a non-zero code.

<details>
<summary>:bulb: Suggestion</summary>

```
  // Verify
  console.log('\nVerification:');
  let anyFailed = false;
  for (const acc of accounts) {
    const fresh = await db.account.findUnique({ where: { id: acc.id } });
    if (!fresh) {
      console.log(`  ${acc.accountId}: GONE (account deleted)`);
      anyFailed = true;
      continue;
    }
    const ok = verifyPassword(fresh.password, password);
    console.log(`  ${acc.accountId}: ${ok ? 'PASS' : 'FAIL'}`);
    if (!ok) anyFailed = true;
  }

  await db.$disconnect();
  if (anyFailed) {
    console.error('\nVerification failures detected!');
    process.exit(1);
  }
  console.log('\nDone!');
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
  // Verify
  console.log('\nVerification:');
  for (const acc of accounts) {
    const fresh = await db.account.findUnique({ where: { id: acc.id } });
    const ok = verifyPassword(fresh.password, password);
    console.log(`  ${acc.accountId}: ${ok ? 'PASS' : 'FAIL'}`);
  }

  await db.$disconnect();
  console.log('\nDone!');
```
</details>


## 🟡 Medium (1)

**🐛 Bug** · line 62

PrismaClient not disconnected on error: the catch block in `main().catch(...)` only logs and exits, skipping `$disconnect()`. If an error occurs mid-script, database connections remain open and may leak. Disconnect before exiting in the error handler.

<details>
<summary>:bulb: Suggestion</summary>

```
let _db;
main().catch(e => { console.error('ERR:', e.message); if (_db) _db.$disconnect().finally(() => process.exit(1)); else process.exit(1); });
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
main().catch(e => { console.error('ERR:', e.message); process.exit(1); });
```
</details>


## 🔵 Low (2)

**🔧 Maintainability** · line 3

Hardcoded absolute Windows path `'D:/PhapChe/.env.local'` makes the script non-portable and leaks directory structure. Use a relative path or the standard `dotenv` default (just `require('dotenv').config()` which looks for `.env` in the CWD).

<details>
<summary>:bulb: Suggestion</summary>

```
require('dotenv').config({ path: '.env.local' });
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
require('dotenv').config({ path: 'D:/PhapChe/.env.local' });
```
</details>

---

**⚡ Performance** · line 12

The `maxmem` value `128 * N * r * 2` is double the actual scrypt memory requirement of `128 * N * r * p` (with p=1). While not harmful (it's just a safety limit, not the actual allocation), it's inconsistent with the standard formula and may mask the intent. Consider using `128 * N * r * p` for clarity.

<details>
<summary>:bulb: Suggestion</summary>

```
const key = crypto.scryptSync(password.normalize('NFKC'), salt, dkLen, { N, r, p, maxmem: 128 * N * r * p });
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
const key = crypto.scryptSync(password.normalize('NFKC'), salt, dkLen, { N, r, p, maxmem: 128 * N * r * 2 });
```
</details>


