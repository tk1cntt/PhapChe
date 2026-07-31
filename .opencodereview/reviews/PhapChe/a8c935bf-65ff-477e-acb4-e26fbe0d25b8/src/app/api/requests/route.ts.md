# Review: `src/app/api/requests/route.ts`

**Project:** PhapChe | **Review:** `a8c935bf-65ff-477e-acb4-e26fbe0d25b8`

**Comments:** 9

---

## 🟠 High (4)

**🔒 Security** · lines 22-23

Pagination parameters are unsanitized. `parseInt` on a non-numeric string (e.g., `?skip=abc`) yields `NaN`, which Prisma will silently treat as 0, hiding the bad input. Additionally, `take` is not capped — an attacker can pass `?take=999999999` to cause a denial-of-service by fetching an unbounded number of records.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  const rawSkip = parseInt(searchParams.get('skip') || '0', 10);
  const rawTake = parseInt(searchParams.get('take') || '20', 10);
  const skip = Number.isNaN(rawSkip) || rawSkip < 0 ? 0 : rawSkip;
  const take = Number.isNaN(rawTake) || rawTake < 0 ? 20 : Math.min(rawTake, 100);
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  const skip = parseInt(searchParams.get('skip') || '0', 10);
  const take = parseInt(searchParams.get('take') || '20', 10);
```
</details>

---

**🐛 Bug** · lines 125-130

`engagementId` is used without validating that it belongs to the same workspace or even exists. Since `engagementId` has a foreign key constraint on the `Engagement` table (per schema), passing an invalid/non-existent ID will cause a Prisma foreign key constraint violation, resulting in an unhandled error and a 500 response.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  // Verify engagement belongs to workspace if provided
  if (engagementId) {
    const engagement = await prisma.engagement.findFirst({
      where: { id: engagementId, workspaceId },
      select: { id: true },
    });
    if (!engagement) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', detail: 'Invalid engagement or engagement does not belong to this workspace', field: 'engagementId' },
        { status: 400 }
      );
    }
  }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  const request = await prisma.legalRequest.create({
    data: {
      code: requestCode,
      workspaceId,
      matterTypeId,
      engagementId: engagementId || null,
```
</details>

---

**🐛 Bug** · lines 122-123

Request code generation is not collision-safe. `Date.now()` has millisecond resolution and `Math.random()` is not cryptographically strong. Under high concurrency, two requests in the same millisecond can produce the same code. If the DB has a unique constraint on `code`, the second insert will fail with an unhandled error. If there is no unique constraint, duplicate codes will silently corrupt data.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  // Generate request code with collision retry
  let requestCode: string;
  let attempt = 0;
  const MAX_ATTEMPTS = 5;
  do {
    requestCode = `REQ-${Date.now().toString(36).toUpperCase()}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
    attempt++;
  } while (
    attempt < MAX_ATTEMPTS &&
    (await prisma.legalRequest.findUnique({ where: { code: requestCode }, select: { id: true } }))
  );
  if (attempt >= MAX_ATTEMPTS) {
    return NextResponse.json({ error: 'INTERNAL_ERROR', detail: 'Failed to generate unique request code' }, { status: 500 });
  }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  // Generate request code — atomic via create with timestamp suffix
  const requestCode = `REQ-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
```
</details>

---

**🐛 Bug** · lines 125-158

The request creation and audit log are not wrapped in a transaction. If the `auditEvent.create` call fails (e.g., DB error, network blip), the `legalRequest` will have been persisted but the audit trail will be missing, breaking data integrity guarantees.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  const [request] = await prisma.$transaction([
    prisma.legalRequest.create({
      data: {
        code: requestCode,
        workspaceId,
        matterTypeId,
        engagementId: engagementId || null,
        title,
        description: description || null,
        priority: priority || 'medium',
        status: 'submitted',
        createdById: session.user.id,
        contactName: contactName || null,
        contactEmail: contactEmail || null,
        contactPhone: contactPhone || null,
        intakeData: intakeData || null,
      },
      include: {
        workspace: { select: { id: true, name: true, slug: true } },
        matterTypeRef: { select: { id: true, key: true } },
      },
    }),
    prisma.auditEvent.create({
      data: {
        actorId: session.user.id,
        workspaceId,
        action: 'request.create',
        targetType: 'request',
        targetId: '', // Will be set after transaction via update, or use interactive transaction
        requestId: '',
        metadataSummary: JSON.stringify({ code: requestCode, title, matterTypeId }),
      },
    }),
  ]);
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  const request = await prisma.legalRequest.create({
    data: {
      code: requestCode,
      workspaceId,
      matterTypeId,
      engagementId: engagementId || null,
      title,
      description: description || null,
      priority: priority || 'medium',
      status: 'submitted',
      createdById: session.user.id,
      contactName: contactName || null,
      contactEmail: contactEmail || null,
      contactPhone: contactPhone || null,
      intakeData: intakeData || null,
    },
    include: {
      workspace: { select: { id: true, name: true, slug: true } },
      matterTypeRef: { select: { id: true, key: true } },
    },
  });

  // Log to audit
  await prisma.auditEvent.create({
    data: {
      actorId: session.user.id,
      workspaceId,
      action: 'request.create',
      targetType: 'request',
      targetId: request.id,
      requestId: request.id,
      metadataSummary: JSON.stringify({ code: requestCode, title, matterTypeId }),
    },
  });
```
</details>


## 🟡 Medium (4)

**🐛 Bug** · line 133

The `priority` field is accepted from user input without validation against allowed values. If a client sends `priority: 'critical'` or any arbitrary string, it will be stored in the DB, leading to silent data corruption. The field should be validated against an enum (e.g., `low`, `medium`, `high`).

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  // Validate priority
  const ALLOWED_PRIORITIES = ['low', 'medium', 'high'] as const;
  if (priority && !ALLOWED_PRIORITIES.includes(priority)) {
    return NextResponse.json(
      { error: 'VALIDATION_ERROR', detail: `priority must be one of: ${ALLOWED_PRIORITIES.join(', ')}`, field: 'priority' },
      { status: 400 }
    );
  }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
      priority: priority || 'medium',
```
</details>

---

**🐛 Bug** · line 137

`contactEmail` is accepted from user input without basic format validation. A malformed email (e.g., `'not-an-email'`) will be stored in the DB, potentially causing downstream issues when the system tries to send notifications.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  // Validate contactEmail format if provided
  if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
    return NextResponse.json(
      { error: 'VALIDATION_ERROR', detail: 'Invalid email format', field: 'contactEmail' },
      { status: 400 }
    );
  }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
      contactEmail: contactEmail || null,
```
</details>

---

**🔧 Maintainability** · lines 32-34

The `where` variable is typed as `Record<string, unknown>` which is essentially an escape hatch from TypeScript's type safety. This masks Prisma's type inference and can hide real type errors if the schema changes. Use Prisma's generated `Prisma.LegalRequestWhereInput` type instead.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  const where: Prisma.LegalRequestWhereInput = {
    workspaceId: { in: workspaceIds },
  };
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  const where: Record<string, unknown> = {
    workspaceId: { in: workspaceIds },
  };
```
</details>

---

**⚡ Performance** · lines 36-41

In the GET route, the `where` object is constructed with `Record<string, unknown>` and filters are added via direct property assignment (`where.status = status`). This bypasses Prisma's type safety and, more importantly, the `matterTypeId` filter uses `where.matterTypeId = matterTypeId` — but the Prisma model field is `matterTypeId` (the FK), so this is actually correct, but constructing the where clause dynamically with loose typing risks accidentally filtering on non-existent or misspelled fields. Use Prisma's typed where input.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  if (status) {
    where.status = status;
  }
  if (matterTypeId) {
    where.matterTypeId = matterTypeId;
  }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  if (status) {
    where.status = status;
  }
  if (matterTypeId) {
    where.matterTypeId = matterTypeId;
  }
```
</details>


## 🔵 Low (1)

**🐛 Bug** · lines 68-71

The GET route's error handler does not use `isStructuredError` (unlike the POST route). If a Prisma error with a structured shape is thrown, it will be swallowed by the generic `INTERNAL_ERROR` handler, losing useful error context. This is inconsistent with the POST handler.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  } catch (error: unknown) {
    if (isStructuredError(error)) {
      return NextResponse.json({ error: error.error, detail: error.detail }, { status: error.status });
    }
    console.error('Error listing requests:', error);
    return NextResponse.json({ error: 'INTERNAL_ERROR', detail: 'Internal server error' }, { status: 500 });
  }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  } catch (error: unknown) {
    console.error('Error listing requests:', error);
    return NextResponse.json({ error: 'INTERNAL_ERROR', detail: 'Internal server error' }, { status: 500 });
  }
```
</details>


