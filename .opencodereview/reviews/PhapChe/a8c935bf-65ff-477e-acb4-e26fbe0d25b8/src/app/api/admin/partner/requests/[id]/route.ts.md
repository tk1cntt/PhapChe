# Review: `src/app/api/admin/partner/requests/[id]/route.ts`

**Project:** PhapChe | **Review:** `a8c935bf-65ff-477e-acb4-e26fbe0d25b8`

**Comments:** 2

---

## 🟡 Medium (1)

**🔧 Maintainability** · lines 62-67

Spreading the entire Prisma result (`...request`) into the API response exposes all top-level fields of the LegalRequest model. If new sensitive fields (e.g., internal notes, audit fields) are added to the model in the future, they will be automatically leaked in this admin endpoint. Consider explicitly picking only the fields that should be returned to the client.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    // Explicitly pick safe fields to return
    const { id, matterType, matterTypeDisplay: _, ...safeFields } = request as any;
    return NextResponse.json({
      data: {
        ...safeFields,
        matterTypeDisplay
      }
    });
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    return NextResponse.json({
      data: {
        ...request,
        matterTypeDisplay
      }
    });
```
</details>


## 🔵 Low (1)

**🔧 Maintainability** · lines 58-60

The type assertion `(request as { matterTypeRef?: ... })` is a workaround because Prisma's return type doesn't account for the conditionally included `matterTypeRef` relation. This cast bypasses type safety. Consider using a properly typed variable or restructuring the feature-flag logic to avoid the cast (e.g., always include `matterTypeRef` and handle the display logic in the response layer).

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    // Always include matterTypeRef (it's harmless when the flag is off, just null)
    // Then no type cast is needed:
    const matterTypeDisplay = isEnabled('DB_MIGRATION_PHASE4')
      ? request.matterTypeRef?.key ?? request.matterType
      : request.matterType;
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const matterTypeDisplay = isEnabled('DB_MIGRATION_PHASE4')
      ? (request as { matterTypeRef?: { key?: string | null } | null }).matterTypeRef?.key ?? request.matterType
      : request.matterType;
```
</details>


