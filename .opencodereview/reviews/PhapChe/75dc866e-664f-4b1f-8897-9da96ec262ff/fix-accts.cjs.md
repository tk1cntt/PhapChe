# Review: `fix-accts.cjs`

**Project:** PhapChe | **Review:** `75dc866e-664f-4b1f-8897-9da96ec262ff`

**Comments:** 5

---

## 🔴 Critical (1)

**🐛 Bug** · lines 10-33

No database transaction: the entire loop operates without a transaction. If any step fails mid-loop (e.g., network error, constraint violation), the database is left in an inconsistent state — some accounts may be updated while others are not, and a deleted duplicate may have already been removed before its password was merged. Concurrent runs could also race on the same rows. Wrap the entire operation in an interactive transaction (await db.$transaction(...)) to ensure atomicity.

<details>
<summary>:bulb: Suggestion</summary>

```
  await db.$transaction(async (tx) => {
    for (const account of accounts) {
      const user = await tx.user.findUnique({ where: { id: account.userId } });
      if (!user) { console.log('No user for account', account.id); continue; }

      if (account.accountId !== user.email) {
        const existing = await tx.account.findFirst({
          where: { accountId: user.email, providerId: 'credential' }
        });

        if (existing) {
          if (account.password && !existing.password) {
            await tx.account.update({ where: { id: existing.id }, data: { password: account.password } });
            console.log('Merged pwd: ' + user.email + ' <- ' + account.accountId);
          }
          await tx.account.delete({ where: { id: account.id } });
          console.log('Deleted duplicate: ' + account.accountId);
        } else {
          await tx.account.update({ where: { id: account.id }, data: { accountId: user.email } });
          console.log('Fixed accountId: ' + user.email);
        }
      } else {
        console.log('OK: ' + user.email + ' accountId correct');
      }
    }
  });
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
  for (const account of accounts) {
    const user = await db.user.findUnique({ where: { id: account.userId } });
    if (!user) { console.log('No user for account', account.id); continue; }

    if (account.accountId !== user.email) {
      const existing = await db.account.findFirst({
        where: { accountId: user.email, providerId: 'credential' }
      });

      if (existing) {
        if (account.password && !existing.password) {
          await db.account.update({ where: { id: existing.id }, data: { password: account.password } });
          console.log('Merged pwd: ' + user.email + ' <- ' + account.accountId);
        }
        await db.account.delete({ where: { id: account.id } });
        console.log('Deleted duplicate: ' + account.accountId);
      } else {
        await db.account.update({ where: { id: account.id }, data: { accountId: user.email } });
        console.log('Fixed accountId: ' + user.email);
      }
    } else {
      console.log('OK: ' + user.email + ' accountId correct');
    }
  }
```
</details>


## 🟠 High (2)

**🐛 Bug** · lines 20-25

Data loss: when the 'existing' account already has a password and the duplicate also has a password, the duplicate's password is silently discarded on deletion. The condition 'account.password && !existing.password' means if both have passwords, neither is merged and the duplicate's password is lost. At minimum, log a warning when this occurs; ideally, determine which password is the correct one (e.g., by attempting bcrypt verification against both) before discarding.

<details>
<summary>:bulb: Suggestion</summary>

```
        if (account.password && !existing.password) {
          await db.account.update({ where: { id: existing.id }, data: { password: account.password } });
          console.log('Merged pwd: ' + user.email + ' <- ' + account.accountId);
        } else if (account.password && existing.password) {
          console.warn('Both accounts have passwords, keeping existing for: ' + user.email + ' (discarding: ' + account.accountId + ')');
        }
        await db.account.delete({ where: { id: account.id } });
        console.log('Deleted duplicate: ' + account.accountId);
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
        if (account.password && !existing.password) {
          await db.account.update({ where: { id: existing.id }, data: { password: account.password } });
          console.log('Merged pwd: ' + user.email + ' <- ' + account.accountId);
        }
        await db.account.delete({ where: { id: account.id } });
        console.log('Deleted duplicate: ' + account.accountId);
```
</details>

---

**🔒 Security** · lines 35-39

Hardcoded plaintext credentials: the test password 'Demo@123456' is embedded directly in the source. If this script is committed to version control, the credential is exposed. Use an environment variable (e.g., process.env.TEST_PASSWORD) or remove the bcrypt test block before checking in.

<details>
<summary>:bulb: Suggestion</summary>

```
  const test = await db.account.findFirst({ where: { accountId: 'admin.demo@example.test' } });
  if (test?.password) {
    const testPassword = process.env.TEST_PASSWORD;
    if (testPassword) {
      const match = await bcrypt.compare(testPassword, test.password);
      console.log('\nBcrypt test: ' + (match ? 'PASS' : 'FAIL'));
    } else {
      console.log('\nSkipping bcrypt test: TEST_PASSWORD env var not set');
    }
  }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
  const test = await db.account.findFirst({ where: { accountId: 'admin.demo@example.test' } });
  if (test?.password) {
    const match = await bcrypt.compare('Demo@123456', test.password);
    console.log('\nBcrypt test: ' + (match ? 'PASS' : 'FAIL'));
  }
```
</details>


## 🟡 Medium (2)

**🐛 Bug** · line 45

Error handling only logs the first line of the error message (e.message.split('\n')[0]), discarding the stack trace and any additional context. This makes debugging failures difficult. Log the full error (e.g., console.error(e)) so the stack trace is preserved.

<details>
<summary>:bulb: Suggestion</summary>

```
main().catch(e => { console.error(e); process.exit(1); });
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
main().catch(e => { console.error(e.message.split('\n')[0]); process.exit(1); });
```
</details>

---

**🐛 Bug** · lines 12-14

No null/undefined check for user.email. If a user row has a null or undefined email field, the script would set account.accountId to null/undefined (line 21) or use it in a findFirst query (lines 14-16), potentially causing incorrect matches or data corruption. Add a guard: if (!user.email) { console.warn('User has no email, skipping', user.id); continue; }

<details>
<summary>:bulb: Suggestion</summary>

```
    if (!user) { console.log('No user for account', account.id); continue; }
    if (!user.email) { console.warn('User has no email, skipping', user.id); continue; }

    if (account.accountId !== user.email) {
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
    if (!user) { console.log('No user for account', account.id); continue; }

    if (account.accountId !== user.email) {
```
</details>


