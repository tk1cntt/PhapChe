# Review: `src/lib/prisma.ts`

**Project:** PhapChe | **Review:** `a2736937-db71-4beb-86ac-fff7eae35f18`

**Comments:** 2

---

## 🔵 Low (2)

**🔧 Maintainability** · lines 3-5

The double type assertion `as unknown as` bypasses TypeScript's type safety. Consider using `declare global` to augment the global type instead, which is cleaner and type-safe.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
// Using declaration merging for type-safe global augmentation
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const globalForPrisma = globalThis;
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};
```
</details>

---

**🔧 Maintainability** · lines 3-7

Consider adding a brief comment explaining why the globalThis caching pattern is used — to prevent multiple PrismaClient instances during hot reloading in development, which can exhaust database connections.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
// PrismaClient is attached to `globalThis` in development to prevent
// exhausting database connections during hot reloading.
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();
```
</details>


