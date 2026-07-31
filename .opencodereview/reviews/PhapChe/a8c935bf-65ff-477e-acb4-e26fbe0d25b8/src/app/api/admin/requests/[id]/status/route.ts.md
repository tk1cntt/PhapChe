# Review: `src/app/api/admin/requests/[id]/status/route.ts`

**Project:** PhapChe | **Review:** `a8c935bf-65ff-477e-acb4-e26fbe0d25b8`

**Comments:** 2

---

## 🟡 Medium (2)

**🐛 Bug** · lines 31-46

The `note` field destructured from the request body is passed directly to `transitionRequestStatus` as `reason` without validating its type. If a client sends a non-string value (e.g., an object, array, or number), it flows through to the Prisma `workflowTransition.create` call (request-workflow.ts line 165), which expects a string or null. This would cause a runtime Prisma validation error, resulting in a 500 response instead of a clear 400. Add a type check: `typeof note === 'string' || note === undefined || note === null`.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    const { status, note } = body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: 'INVALID_STATUS', detail: `Valid statuses: ${VALID_STATUSES.join(', ')}` },
        { status: 400 },
      );
    }

    if (note !== undefined && note !== null && typeof note !== 'string') {
      return NextResponse.json(
        { error: 'INVALID_NOTE', detail: 'Note must be a string' },
        { status: 400 },
      );
    }

    const correlationId = `admin-status-${id}-${Date.now()}`;

    const result = await transitionRequestStatus({
      requestId: id,
      actorId: session.userId,
      toStatus: status as RequestStatus,
      reason: note ?? null,
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const { status, note } = body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: 'INVALID_STATUS', detail: `Valid statuses: ${VALID_STATUSES.join(', ')}` },
        { status: 400 },
      );
    }

    const correlationId = `admin-status-${id}-${Date.now()}`;

    const result = await transitionRequestStatus({
      requestId: id,
      actorId: session.userId,
      toStatus: status as RequestStatus,
      reason: note ?? null,
```
</details>

---

**🔧 Maintainability** · lines 52-63

Error-to-status-code mapping relies on exact `error.message` string matching against a hardcoded dictionary. If any error message in `transitionRequestStatus` changes, or a new error type is added without updating this dictionary, it silently falls through to a generic 500. Consider using custom error classes (e.g., `class WorkflowError extends Error { constructor(message, public httpStatus) {...} }`) or an error `code` property so the mapping is resilient to message changes.

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const knownErrors: Record<string, number> = {
      REQUEST_NOT_FOUND: 404,
      INVALID_REQUEST_TRANSITION: 400,
      FORBIDDEN: 403,
      REQUEST_STATUS_CONFLICT: 409,
    };
    if (error instanceof Error && typeof error.message === 'string') {
      const code = knownErrors[error.message];
      if (code) {
        return NextResponse.json({ error: error.message, detail: error.message }, { status: code });
      }
    }
```
</details>


