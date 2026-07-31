# Review: `src/lib/prisma.ts`

**Project:** PhapChe | **Review:** `ec71dde0-f69d-4e95-ac8c-84a3bbe9e1e6`

**Comments:** 2

---

## 🟡 Medium (1)

**🔧 Maintainability** · lines 3-5

The double type assertion `as unknown as { prisma?: PrismaClient }` bypasses TypeScript type checking. If the shape of the cached object changes (e.g., someone adds another property to `globalThis`), the mismatch won't be caught at compile time. Consider using a `declare global` block to extend the `globalThis` type properly.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
// Use declare global for proper type extension
// Place this outside the module scope or in a .d.ts file:
// declare global {
//   // eslint-disable-next-line no-var
//   var prisma: PrismaClient | undefined;
// }

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};
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


## 🔵 Low (1)

**🔧 Maintainability** · line 7

The singleton pattern is well-established but lacks a comment explaining why it's used (preventing multiple PrismaClient instances during Next.js hot reloading in development). Adding a brief comment would help future maintainers understand the intent.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
// Cache the PrismaClient instance on globalThis to avoid exhausting
// database connections during hot reloading in development.
export const prisma = globalForPrisma.prisma ?? new PrismaClient();
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export const prisma = globalForPrisma.prisma ?? new PrismaClient();
```
</details>


