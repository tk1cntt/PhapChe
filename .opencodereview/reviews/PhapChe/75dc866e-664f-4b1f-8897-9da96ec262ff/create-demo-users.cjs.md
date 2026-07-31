# Review: `create-demo-users.cjs`

**Project:** PhapChe | **Review:** `75dc866e-664f-4b1f-8897-9da96ec262ff`

**Comments:** 4

---

## 🔴 Critical (1)

**🔒 Security** · line 38

**Security (Critical): Plain-text password storage.** The password `'Demo@123456'` is stored directly in the database without hashing. This means anyone with database access can read all demo user passwords in plain text. If the same account provider is used for real authentication, this pattern could leak into production. Use a proper password hashing function (e.g., bcrypt, argon2) before storing credentials.

<details>
<summary>:bulb: Suggestion</summary>

```
            // Password must be hashed before storage; e.g., require('bcrypt').hashSync('Demo@123456', 10)
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
            password: 'Demo@123456',
```
</details>


## 🟠 High (2)

**🔒 Security** · lines 10-15

**Security (High): Hardcoded, weak, shared password.** All demo users share the same password `'Demo@123456'`, which is weak and hardcoded in source. If this script is ever used outside a fully isolated demo environment, it creates a serious security risk. Consider reading from environment variables and generating unique passwords per user.

<details>
<summary>:bulb: Suggestion</summary>

```
    const demoPassword = process.env.DEMO_PASSWORD || 'Demo@123456';
    const users = [
      { email: 'admin.demo@example.test', name: 'Admin Demo', role: 'super_admin' },
      { email: 'customer.demo@example.test', name: 'Customer Demo', role: 'customer' },
      { email: 'specialist.demo@example.test', name: 'Specialist Demo', role: 'specialist' },
      { email: 'reviewer.demo@example.test', name: 'Reviewer Demo', role: 'reviewer' },
    ];
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
    const users = [
      { email: 'admin.demo@example.test', name: 'Admin Demo', role: 'super_admin' },
      { email: 'customer.demo@example.test', name: 'Customer Demo', role: 'customer' },
      { email: 'specialist.demo@example.test', name: 'Specialist Demo', role: 'specialist' },
      { email: 'reviewer.demo@example.test', name: 'Reviewer Demo', role: 'reviewer' },
    ];
```
</details>

---

**🐛 Bug** · lines 22-40

**Bug (High): Missing transaction — orphaned user on account creation failure.** User creation and account creation are separate operations without a transaction. If `db.account.create` fails (line 33), the user is already persisted (line 27), leaving an orphaned user record with no associated account. This breaks data consistency. Wrap both creates in a Prisma interactive transaction (`db.$transaction`).

<details>
<summary>:bulb: Suggestion</summary>

```
        const result = await db.$transaction(async (tx) => {
          const newUser = await tx.user.create({
            data: {
              email: u.email,
              name: u.name,
              isActive: true,
              emailVerified: true,
              memberships: {
                create: { workspaceId: workspace.id, role: u.role, isActive: true }
              }
            }
          });
          await tx.account.create({
            data: {
              userId: newUser.id,
              accountId: u.email,
              providerId: 'credential',
              password: 'Demo@123456',
            }
          });
          return newUser;
        });
        console.log('Created:', u.email, result.id, 'role:', u.role);
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
        const newUser = await db.user.create({
          data: {
            email: u.email,
            name: u.name,
            isActive: true,
            emailVerified: true,
            memberships: {
              create: { workspaceId: workspace.id, role: u.role, isActive: true }
            }
          }
        });
        await db.account.create({
          data: {
            userId: newUser.id,
            accountId: u.email,
            providerId: 'credential',
            password: 'Demo@123456',
          }
        });
```
</details>


## 🟡 Medium (1)

**🐛 Bug** · lines 17-43

**Bug (Medium): Error handling stops entire seeding on first failure.** The `catch` block (line 44) logs the error and exits, but the loop is already broken by the uncaught exception. If user 2 fails, users 3 and 4 are never attempted. Move the try/catch inside the loop so that a single user failure does not prevent the remaining users from being seeded (improving idempotency and resilience).

<details>
<summary>:bulb: Suggestion</summary>

```
    for (const u of users) {
      try {
        let user = await db.user.findUnique({ where: { email: u.email } });
        if (user) {
          console.log('Exists:', u.email, user.id);
        } else {
          const newUser = await db.user.create({
            data: {
              email: u.email,
              name: u.name,
              isActive: true,
              emailVerified: true,
              memberships: {
                create: { workspaceId: workspace.id, role: u.role, isActive: true }
              }
            }
          });
          await db.account.create({
            data: {
              userId: newUser.id,
              accountId: u.email,
              providerId: 'credential',
              password: 'Demo@123456',
            }
          });
          console.log('Created:', u.email, newUser.id, 'role:', u.role);
        }
      } catch (e) {
        console.error('Failed to seed user', u.email, ':', e.message);
      }
    }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
    for (const u of users) {
      let user = await db.user.findUnique({ where: { email: u.email } });
      if (user) {
        console.log('Exists:', u.email, user.id);
      } else {
        const newUser = await db.user.create({
          data: {
            email: u.email,
            name: u.name,
            isActive: true,
            emailVerified: true,
            memberships: {
              create: { workspaceId: workspace.id, role: u.role, isActive: true }
            }
          }
        });
        await db.account.create({
          data: {
            userId: newUser.id,
            accountId: u.email,
            providerId: 'credential',
            password: 'Demo@123456',
          }
        });
        console.log('Created:', u.email, newUser.id, 'role:', u.role);
      }
    }
```
</details>


