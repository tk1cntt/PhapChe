# Review: `src/app/api/files/route.ts`

**Project:** PhapChe | **Review:** `a8c935bf-65ff-477e-acb4-e26fbe0d25b8`

**Comments:** 4

---

## 🔴 Critical (1)

**🔒 Security** · lines 73-89

**Critical Security Issue: Missing organization membership check when `requestId` is not provided.**

When `requestId` is `null`/falsy, the workspace membership check (lines 67-78) is entirely skipped. Any authenticated user can upload a file to *any* `organizationId` they choose by simply omitting the `requestId` field. This bypasses organization-level authorization and allows cross-organization data tampering.

**Suggestion**: Add an organization-level membership check that is independent of `requestId`. For example, verify that the user is an active member of the organization before allowing upload:

```ts
const orgMembership = await prisma.workspaceMembership.findFirst({
  where: { userId, isActive: true, workspace: { organizationId } },
  select: { id: true },
});
if (!orgMembership) {
  return NextResponse.json(
    { error: 'Forbidden', detail: 'Not a member of this organization' },
    { status: 403 }
  );
}
```

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    // Verify organization membership
    const orgMembership = await prisma.workspaceMembership.findFirst({
      where: { userId, isActive: true, workspace: { organizationId } },
      select: { id: true },
    });
    if (!orgMembership) {
      return NextResponse.json(
        { error: 'Forbidden', detail: 'Not a member of this organization' },
        { status: 403 }
      );
    }

    // Verify workspace membership (stricter: must also belong to the request's workspace)
    if (requestId) {
      const membership = await prisma.workspaceMembership.findFirst({
        where: {
          userId,
          isActive: true,
          workspace: {
            organizationId,
            requests: { some: { id: requestId } },
          },
        },
        select: { id: true },
      });
      if (!membership) {
        return NextResponse.json(
          { error: 'Forbidden', detail: 'Not a member of this workspace' },
          { status: 403 }
        );
      }
    }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    // Verify workspace membership
    if (requestId) {
      const membership = await prisma.workspaceMembership.findFirst({
        where: {
          userId,
          isActive: true,
          workspace: { requests: { some: { id: requestId } } },
        },
        select: { id: true },
      });
      if (!membership) {
        return NextResponse.json(
          { error: 'Forbidden', detail: 'Not a member of this workspace' },
          { status: 403 }
        );
      }
    }
```
</details>


## 🟠 High (1)

**🔒 Security** · lines 75-80

**High: No cross-validation between `organizationId` and `requestId`.**

When both `organizationId` and `requestId` are provided, the membership check only verifies that the user can access the request's workspace — but it does *not* verify that the request actually belongs to the specified `organizationId`. This means a request from org A could be associated with a file upload to org B, leading to data inconsistency and potential cross-organization data leakage.

**Suggestion**: Include `organizationId` in the membership query's workspace filter (as shown in the suggestion code above), ensuring the workspace containing the request also belongs to the specified organization.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
      const membership = await prisma.workspaceMembership.findFirst({
        where: {
          userId,
          isActive: true,
          workspace: {
            organizationId,
            requests: { some: { id: requestId } },
          },
        },
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
      const membership = await prisma.workspaceMembership.findFirst({
        where: {
          userId,
          isActive: true,
          workspace: { requests: { some: { id: requestId } } },
        },
```
</details>


## 🟡 Medium (2)

**🔧 Maintainability** · lines 118-129

**Medium: Fragile error classification via string matching on `error.message`.**

Error handling relies on `error.message.includes('PERMISSION')` and `error.message.includes('VALIDATION')` to classify errors from the storage service. If the storage service changes its error messages (e.g., rephrasing, localization), these checks silently break and all errors will fall through to the generic 500 response, hiding the real cause from the client.

**Suggestion**: Use custom error classes (e.g., `StoragePermissionError`, `StorageValidationError`) in the storage service and check with `instanceof` instead:

```ts
if (error instanceof StoragePermissionError) {
  return NextResponse.json(…, { status: 403 });
}
if (error instanceof StorageValidationError) {
  return NextResponse.json(…, { status: 400 });
}
```

<details>
<summary>:bulb: Suggestion</summary>

```typescript
      if (error instanceof StoragePermissionError) {
        return NextResponse.json(
          { error: 'Forbidden', detail: 'Permission denied' },
          { status: 403 }
        );
      }
      if (error instanceof StorageValidationError) {
        return NextResponse.json(
          { error: 'Validation error', detail: 'Invalid file upload request' },
          { status: 400 }
        );
      }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
      if (error.message.includes('PERMISSION')) {
        return NextResponse.json(
          { error: 'Forbidden', detail: 'Permission denied' },
          { status: 403 }
        );
      }
      if (error.message.includes('VALIDATION')) {
        return NextResponse.json(
          { error: 'Validation error', detail: 'Invalid file upload request' },
          { status: 400 }
        );
      }
```
</details>

---

**🔒 Security** · lines 91-93

**Medium: No file size limit validation before buffering the entire file into memory.**

The entire file is read into memory via `file.arrayBuffer()` and `Buffer.from(arrayBuffer)` without any size check. A malicious user could upload an arbitrarily large file, causing memory exhaustion and a denial-of-service (DoS) condition on the server.

**Suggestion**: Add a file size check before reading the buffer. Next.js App Router supports a `maxFileSize` option via `bodySize` in route segment config, or you can validate `file.size` from the parsed `File` object:

```ts
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
if (file.size > MAX_FILE_SIZE) {
  return NextResponse.json(
    { error: 'Validation error', detail: 'File exceeds maximum size limit' },
    { status: 400 }
  );
}
```

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    // Validate file size before buffering
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Validation error', detail: 'File exceeds maximum size limit' },
        { status: 400 }
      );
    }

    // Get file buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    // Get file buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
```
</details>


