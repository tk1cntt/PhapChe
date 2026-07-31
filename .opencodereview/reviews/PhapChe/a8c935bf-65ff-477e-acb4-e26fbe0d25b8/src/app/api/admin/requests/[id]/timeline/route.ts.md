# Review: `src/app/api/admin/requests/[id]/timeline/route.ts`

**Project:** PhapChe | **Review:** `a8c935bf-65ff-477e-acb4-e26fbe0d25b8`

**Comments:** 5

---

## 🔴 Critical (1)

**🔒 Security** · lines 61-64

Missing request-level authorization: any user with 'specialist' or 'reviewer' role can access the timeline of ANY request. There is no workspace membership check (workspaceId is fetched but never used) and no verification that the current user is actually assigned to (or authorized to view) this specific request. This allows a specialist in workspace A to view timeline data for requests in workspace B.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    const hasAccess = session.roles?.some((r) => (ALLOWED_ROLES as readonly string[]).includes(r));
    if (!hasAccess) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    const { id } = await params;

    // Verify request exists AND user has workspace access or is assigned
    const legalRequest = await prisma.legalRequest.findFirst({
      where: {
        OR: [{ id }, { code: id }],
        workspaceId: { in: session.workspaceIds || [] },
      },
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const hasAccess = session.roles?.some((r) => (ALLOWED_ROLES as readonly string[]).includes(r));
    if (!hasAccess) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }
```
</details>


## 🟠 High (1)

**🐛 Bug** · lines 153-161

Stale current assignments: the 'current' block reads from legalRequest.assignedSpecialist/assignedReviewer (direct fields on LegalRequest), while the timeline draws assignments from the requestAssignment table. If the two sources are out of sync (e.g., due to a failed transaction or legacy data migration), the API will return contradictory data — the timeline may show a recent reassignment while 'current' still reflects the old value. Consider deriving current assignments from the requestAssignment table (e.g., the most recent entry per role where isCurrent is true).

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    // ── Current assignments (derived from assignment table for consistency) ──
    const latestAssignment = (kind: string) =>
      assignments.find((a) => a.kind === kind && a.isCurrent);

    const current: TimelineResponse['current'] = {
      specialist: latestAssignment('specialist')?.user
        ? { id: latestAssignment('specialist')!.user.id, name: latestAssignment('specialist')!.user.name }
        : null,
      reviewer: latestAssignment('reviewer')?.user
        ? { id: latestAssignment('reviewer')!.user.id, name: latestAssignment('reviewer')!.user.name }
        : null,
    };
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    // ── Current assignments ──
    const current: TimelineResponse['current'] = {
      specialist: legalRequest.assignedSpecialist
        ? { id: legalRequest.assignedSpecialist.id, name: legalRequest.assignedSpecialist.name }
        : null,
      reviewer: legalRequest.assignedReviewer
        ? { id: legalRequest.assignedReviewer.id, name: legalRequest.assignedReviewer.name }
        : null,
    };
```
</details>


## 🟡 Medium (2)

**🔧 Maintainability** · lines 69-77

Dead code: workspaceId is selected in the query (line 73) but never referenced anywhere in the handler. Either remove it or use it for a workspace-level authorization check (recommended).

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    const legalRequest = await prisma.legalRequest.findFirst({
      where: {
        OR: [{ id }, { code: id }],
        // Add workspace filter: workspaceId: { in: session.workspaceIds || [] },
      },
      select: {
        id: true,
        assignedSpecialist: { select: { id: true, name: true } },
        assignedReviewer: { select: { id: true, name: true } },
      },
    });
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const legalRequest = await prisma.legalRequest.findFirst({
      where: { OR: [{ id }, { code: id }] },
      select: {
        id: true,
        workspaceId: true,
        assignedSpecialist: { select: { id: true, name: true } },
        assignedReviewer: { select: { id: true, name: true } },
      },
    });
```
</details>

---

**⚡ Performance** · lines 86-109

No pagination or limit on timeline results. For requests with a long history (many transitions, assignments, or audit events), this endpoint could return hundreds or thousands of records in a single response, causing memory pressure and slow load times. Consider adding `take` limits to each query or implementing cursor-based pagination.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    const [transitions, assignments, audits] = await Promise.all([
      prisma.workflowTransition.findMany({
        where: { requestId },
        orderBy: { createdAt: 'desc' },
        take: 200,
        include: {
          actor: { select: { id: true, name: true } },
        },
      }),
      prisma.requestAssignment.findMany({
        where: { requestId },
        orderBy: { createdAt: 'desc' },
        take: 200,
        include: {
          user: { select: { id: true, name: true } },
          createdBy: { select: { id: true, name: true } },
        },
      }),
      prisma.auditEvent.findMany({
        where: { requestId },
        orderBy: { createdAt: 'desc' },
        take: 200,
        include: {
          actor: { select: { id: true, name: true } },
        },
      }),
    ]);
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const [transitions, assignments, audits] = await Promise.all([
      prisma.workflowTransition.findMany({
        where: { requestId },
        orderBy: { createdAt: 'desc' },
        include: {
          actor: { select: { id: true, name: true } },
        },
      }),
      prisma.requestAssignment.findMany({
        where: { requestId },
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true } },
          createdBy: { select: { id: true, name: true } },
        },
      }),
      prisma.auditEvent.findMany({
        where: { requestId },
        orderBy: { createdAt: 'desc' },
        include: {
          actor: { select: { id: true, name: true } },
        },
      }),
    ]);
```
</details>


## 🔵 Low (1)

**🔧 Maintainability** · line 61

Unnecessary type cast: ALLOWED_ROLES is already typed as `readonly ['super_admin', 'coordinator_admin', 'specialist', 'reviewer']` via `as const`, so casting to `readonly string[]` is redundant. Simply remove the cast.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    const hasAccess = session.roles?.some((r) => ALLOWED_ROLES.includes(r));
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const hasAccess = session.roles?.some((r) => (ALLOWED_ROLES as readonly string[]).includes(r));
```
</details>


