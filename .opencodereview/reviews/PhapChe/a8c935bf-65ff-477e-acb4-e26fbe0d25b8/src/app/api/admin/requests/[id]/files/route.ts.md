# Review: `src/app/api/admin/requests/[id]/files/route.ts`

**Project:** PhapChe | **Review:** `a8c935bf-65ff-477e-acb4-e26fbe0d25b8`

**Comments:** 5

---

## 🟠 High (2)

**🐛 Bug** · lines 41-59

Assignment-based authorization is never enforced. The code fetches `assignedSpecialistId` and `assignedReviewerId` (line 40) and the comment at line 38 says 'user is authorized (workspace + assignment)', but the session user is never compared against these fields. A specialist or reviewer can access files for any request in their workspace, not just their assigned ones.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    // Verify request exists and user is authorized (workspace + assignment)
    const legalRequest = await prisma.legalRequest.findUnique({
      where: { id: requestId },
      select: { id: true, workspaceId: true, assignedSpecialistId: true, assignedReviewerId: true },
    });
    if (!legalRequest) {
      return NextResponse.json({ error: 'REQUEST_NOT_FOUND' }, { status: 404 });
    }

    // Verify workspace membership
    if (session.activeWorkspaceId && legalRequest.workspaceId !== session.activeWorkspaceId) {
      const membership = await prisma.workspaceMembership.findFirst({
        where: { userId: session.userId, workspaceId: legalRequest.workspaceId, isActive: true },
        select: { id: true },
      });
      if (!membership) {
        return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
      }
    }

    // Verify assignment: specialist and reviewer should only access their assigned requests
    const userRoles = session.roles as string[];
    if (userRoles.includes('specialist') && legalRequest.assignedSpecialistId !== session.userId) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }
    if (userRoles.includes('reviewer') && legalRequest.assignedReviewerId !== session.userId) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    // Verify request exists and user is authorized (workspace + assignment)
    const legalRequest = await prisma.legalRequest.findUnique({
      where: { id: requestId },
      select: { id: true, workspaceId: true, assignedSpecialistId: true, assignedReviewerId: true },
    });
    if (!legalRequest) {
      return NextResponse.json({ error: 'REQUEST_NOT_FOUND' }, { status: 404 });
    }

    // Verify workspace membership
    if (session.activeWorkspaceId && legalRequest.workspaceId !== session.activeWorkspaceId) {
      const membership = await prisma.workspaceMembership.findFirst({
        where: { userId: session.userId, workspaceId: legalRequest.workspaceId, isActive: true },
        select: { id: true },
      });
      if (!membership) {
        return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
      }
    }
```
</details>

---

**🔒 Security** · lines 50-59

Authorization bypass when `session.activeWorkspaceId` is null/falsy. The condition `if (session.activeWorkspaceId && ...)` short-circuits when `activeWorkspaceId` is undefined or null, skipping the workspace membership check entirely. This allows a user with no active workspace to access files from any workspace's legal request without membership verification.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    // Verify workspace membership
    if (!session.activeWorkspaceId || legalRequest.workspaceId !== session.activeWorkspaceId) {
      const membership = await prisma.workspaceMembership.findFirst({
        where: { userId: session.userId, workspaceId: legalRequest.workspaceId, isActive: true },
        select: { id: true },
      });
      if (!membership) {
        return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
      }
    }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    // Verify workspace membership
    if (session.activeWorkspaceId && legalRequest.workspaceId !== session.activeWorkspaceId) {
      const membership = await prisma.workspaceMembership.findFirst({
        where: { userId: session.userId, workspaceId: legalRequest.workspaceId, isActive: true },
        select: { id: true },
      });
      if (!membership) {
        return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
      }
    }
```
</details>


## 🟡 Medium (1)

**🐛 Bug** · line 103

The comment at the top of the file states generated document IDs should be prefixed with `doc_`, but the code uses `gen_` prefix (line 82). This mismatch will break client code that expects `doc_`-prefixed IDs, potentially causing routing failures or incorrect item identification on the frontend.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
        id: `doc_${doc.id}`,
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
        id: `gen_${doc.id}`,
```
</details>


## 🔵 Low (2)

**🔧 Maintainability** · line 16

The `FileItem` type union includes `'document'` but it is never used — only `'vault_file'` and `'generated'` are assigned. This is either dead code or indicates a missing implementation for a third file category.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  type: 'vault_file' | 'generated';
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  type: 'vault_file' | 'document' | 'generated';
```
</details>

---

**⚡ Performance** · lines 61-87

The two database queries for `vaultFiles` and `documents` are independent and executed sequentially. They could be parallelized with `Promise.all` to reduce latency.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    // Fetch VaultFiles (uploaded files) and Documents (generated documents) in parallel
    const [vaultFiles, documents] = await Promise.all([
      prisma.vaultFile.findMany({
        where: { requestId, deletedAt: null },
        include: {
          file: {
            select: {
              originalName: true,
              mimeType: true,
              size: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.document.findMany({
        where: { requestId, deletedAt: null },
        include: {
          documentVersions: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { status: true, createdAt: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    // Fetch VaultFiles (uploaded files)
    const vaultFiles = await prisma.vaultFile.findMany({
      where: { requestId, deletedAt: null },
      include: {
        file: {
          select: {
            originalName: true,
            mimeType: true,
            size: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Fetch Documents (generated documents)
    const documents = await prisma.document.findMany({
      where: { requestId, deletedAt: null },
      include: {
        documentVersions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { status: true, createdAt: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
```
</details>


