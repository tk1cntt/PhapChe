# Review: `src/lib/delivery/delivery-service.ts`

**Project:** PhapChe | **Review:** `ec71dde0-f69d-4e95-ac8c-84a3bbe9e1e6`

**Comments:** 6

---

## 🟠 High (1)

**🐛 Bug** · lines 116-129

**Missing audit event for `closeDeliveredRequest`.** The `markRequestDelivered` function records an audit event (`delivery.ready_notified`), but `closeDeliveredRequest` does not call `recordAuditEvent` at all. This leaves a gap in the audit trail for the request lifecycle — there is no record of who closed the request or why. Add a `recordAuditEvent` call similar to `markRequestDelivered`, e.g. with action `delivery.closed`.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
export async function closeDeliveredRequest(input: CloseDeliveryInput): Promise<{ id: string; status: RequestStatus }> {
  const reason = input.reason.trim();
  if (!reason) throw new Error('CLOSE_REASON_REQUIRED');

  const { request } = await getDeliveryActionRequest(input.session, input.requestId, 'delivered');
  const correlationId = input.correlationId ?? `close-${input.requestId}-${Date.now()}`;

  const updated = await transitionRequestStatus({
    requestId: input.requestId,
    actorId: input.session.userId,
    toStatus: 'closed',
    reason,
    correlationId,
  });

  await recordAuditEvent({
    actorId: input.session.userId,
    workspaceId: request.workspaceId,
    action: 'delivery.closed',
    targetType: 'REQUEST',
    targetId: request.id,
    requestId: request.id,
    correlationId,
    metadataSummary: `requestId=${request.id}; reason=${reason}`,
  });

  return updated;
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export async function closeDeliveredRequest(input: CloseDeliveryInput): Promise<{ id: string; status: RequestStatus }> {
  const reason = input.reason.trim();
  if (!reason) throw new Error('CLOSE_REASON_REQUIRED');

  await getDeliveryActionRequest(input.session, input.requestId, 'delivered');

  return transitionRequestStatus({
    requestId: input.requestId,
    actorId: input.session.userId,
    toStatus: 'closed',
    reason,
    correlationId: input.correlationId ?? `close-${input.requestId}-${Date.now()}`,
  });
}
```
</details>


## 🟡 Medium (4)

**🐛 Bug** · lines 88-111

**Non-transactional status update and side effects in `markRequestDelivered`.** The status is transitioned to `'delivered'` *before* `sendDeliveryReadyEmail` and `recordAuditEvent` are called. If either of those subsequent calls fails (e.g. network error, email service down), the request will be stuck in `'delivered'` state without the customer ever being notified, and the audit trail will be incomplete. Consider one of: (a) calling the side effects *before* the status transition (with idempotency guards), (b) wrapping all operations in a compensating transaction/saga, or (c) using an outbox pattern to guarantee eventual consistency.

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  const updated = await transitionRequestStatus({
    requestId: request.id,
    actorId: input.session.userId,
    toStatus: 'delivered',
    correlationId,
  });

  await sendDeliveryReadyEmail({
    to: request.createdBy.email,
    requestTitle: request.title,
    portalUrl,
    filenames,
  });

  await recordAuditEvent({
    actorId: input.session.userId,
    workspaceId: request.workspaceId,
    action: 'delivery.ready_notified',
    targetType: 'REQUEST',
    targetId: request.id,
    requestId: request.id,
    correlationId,
    metadataSummary: `requestId=${request.id}; documentCount=${finalVaultFiles.length}`,
  });
```
</details>

---

**🐛 Bug** · lines 53-70

**Potential race condition: status check and transition are not atomic.** `getDeliveryActionRequest` validates that the request is in `expectedStatus`, then `transitionRequestStatus` is called separately. If two concurrent calls both pass the status check before either transitions, both could attempt to deliver/close the same request. Unless `transitionRequestStatus` internally performs an atomic compare-and-swap on the current status, this is a TOCTOU race. Verify that `transitionRequestStatus` uses an atomic conditional update (e.g. `WHERE status = 'approved'`), or add a concurrency control mechanism.

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
async function getDeliveryActionRequest(session: AppSession, requestId: string, expectedStatus: RequestStatus) {
  if (!session.activeWorkspaceId) throw new Error('FORBIDDEN');
  if (!(await canAccessRequest(session, requestId))) throw new Error('FORBIDDEN');

  const request = await prisma.legalRequest.findFirst({
    where: { id: requestId, workspaceId: session.activeWorkspaceId },
    select: {
      id: true,
      workspaceId: true,
      title: true,
      status: true,
      assignedSpecialistId: true,
      createdBy: { select: { email: true } },
    },
  });

  if (!request) throw new Error('REQUEST_NOT_FOUND');
  if (request.status !== expectedStatus) throw new Error('INVALID_REQUEST_STATUS');
```
</details>

---

**🔧 Maintainability** · line 86

**Hardcoded portal URL path.** The string `/customer/requests/${request.id}` is a business-related URL path hardcoded in the service layer. Changes to routing would require a code change here. Extract this to a configuration constant or a URL-building utility (e.g. `routes.customerRequest(request.id)`) so that routing changes are centralized.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  const portalUrl = buildCustomerPortalUrl(request.id);
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  const portalUrl = `/customer/requests/${request.id}`;
```
</details>

---

**🐛 Bug** · line 178

**Duplicate `documentVersionId` in vault files causes silent data loss.** The `vaultFilesByVersion` map uses `documentVersionId` as the key. Since `VaultFile` has no unique constraint on `documentVersionId`, multiple vault files can share the same version. When that happens, the map silently overwrites earlier entries. Because `vaultFiles` is ordered by `createdAt: 'desc'`, the first (newest) entry is set, then overwritten by the subsequent (older) entry — so the *oldest* vault file wins, which is likely the opposite of what's intended. Consider either: (a) adding a unique constraint on `documentVersionId` in the schema, or (b) using a `Map<string, VaultFile[]>` and selecting the correct one, or (c) reversing the order to `'asc'` so the newest file wins in the overwrite.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    // Use the newest vault file per version (asc order so last wins)
    const vaultFilesByVersion = new Map(
      vaultFiles
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
        .map((file) => [file.documentVersionId, file])
    );
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const vaultFilesByVersion = new Map(vaultFiles.map((file) => [file.documentVersionId, file]));
```
</details>


## 🔵 Low (1)

**⚡ Performance** · line 120

**Unused return value from `getDeliveryActionRequest`.** In `closeDeliveredRequest`, the result of `getDeliveryActionRequest` is discarded (`await`-ed but not assigned). This means the `request` and `finalVaultFiles` are fetched from the database but never used. While the validation side effects (status check, RBAC, final-document check) are still useful, the fetched data is wasted. If you adopt the audit-event suggestion above, destructure `request` from the return value to avoid a redundant lookup.

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  await getDeliveryActionRequest(input.session, input.requestId, 'delivered');
```
</details>


