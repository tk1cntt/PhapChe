# Review: `src/lib/audit/audit.ts`

**Project:** PhapChe | **Review:** `75dc866e-664f-4b1f-8897-9da96ec262ff`

**Comments:** 3

---

## 🔴 Critical (1)

**🐛 Bug** · lines 67-73

Missing runtime validation for `targetType`. The lookup `targetTypeMap[input.targetType]` silently returns `undefined` when an unrecognized key is passed at runtime (TypeScript types are erased). This `undefined` value is then written to the database as `targetType`, causing a cryptic constraint violation or storing invalid data. Add an explicit guard that throws a descriptive error (e.g., `AUDIT_TARGET_TYPE_INVALID`) before the `db.auditEvent.create` call.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  const resolvedTargetType = targetTypeMap[input.targetType];
  if (!resolvedTargetType) throw new Error('AUDIT_TARGET_TYPE_INVALID');

  return db.auditEvent.create({
    data: {
      actorId: input.actorId ?? null,
      workspaceId: input.workspaceId,
      action: input.action,
      targetType: resolvedTargetType,
      targetId: input.targetId,
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  return db.auditEvent.create({
    data: {
      actorId: input.actorId ?? null,
      workspaceId: input.workspaceId,
      action: input.action,
      targetType: targetTypeMap[input.targetType],
      targetId: input.targetId,
```
</details>


## 🟡 Medium (1)

**🔧 Maintainability** · lines 67-78

The `db.auditEvent.create` call is not wrapped in try/catch, so raw database errors (e.g., foreign-key violations, connection failures) propagate directly to the caller. This violates the async error-handling guideline and can leak internal schema details. Consider wrapping the call in try/catch, logging the error server-side, and throwing a sanitized user-facing error.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  try {
    return await db.auditEvent.create({
      data: {
        actorId: input.actorId ?? null,
        workspaceId: input.workspaceId,
        action: input.action,
        targetType: resolvedTargetType,
        targetId: input.targetId,
        requestId: input.requestId ?? null,
        correlationId: input.correlationId,
        metadataSummary: input.metadataSummary ?? null,
      },
    });
  } catch (error) {
    console.error('Failed to record audit event:', error);
    throw new Error('AUDIT_RECORD_FAILED');
  }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  return db.auditEvent.create({
    data: {
      actorId: input.actorId ?? null,
      workspaceId: input.workspaceId,
      action: input.action,
      targetType: targetTypeMap[input.targetType],
      targetId: input.targetId,
      requestId: input.requestId ?? null,
      correlationId: input.correlationId,
      metadataSummary: input.metadataSummary ?? null,
    },
  });
```
</details>


## 🔵 Low (1)

**🔧 Maintainability** · lines 21-32

The local `AuditTargetTypeInput` union type on lines 16–27 duplicates the keys from `AUDIT_TARGET_TYPE` in `src/lib/types.ts`. If a new target type is added upstream, this file must be updated in two places (the type and `targetTypeMap`). Consider deriving the type from the map itself (e.g., `keyof typeof targetTypeMap`) or importing the const from `types.ts` to keep a single source of truth.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
// Prefer: import { AUDIT_TARGET_TYPE } from '@/lib/types';
// Then use: keyof typeof AUDIT_TARGET_TYPE
type AuditTargetTypeInput = keyof typeof targetTypeMap;
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
type AuditTargetTypeInput =
  | 'USER'
  | 'WORKSPACE'
  | 'MEMBERSHIP'
  | 'REQUEST'
  | 'MATTER_TYPE'
  | 'INTAKE_SUBMISSION'
  | 'ASSIGNMENT'
  | 'DOCUMENT'
  | 'REVIEW'
  | 'VAULT_FILE'
  | 'WORKFLOW_TRANSITION';
```
</details>


