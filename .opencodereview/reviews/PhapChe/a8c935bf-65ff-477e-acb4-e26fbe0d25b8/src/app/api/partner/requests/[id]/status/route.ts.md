# Review: `src/app/api/partner/requests/[id]/status/route.ts`

**Project:** PhapChe | **Review:** `a8c935bf-65ff-477e-acb4-e26fbe0d25b8`

**Comments:** 5

---

## 🟠 High (3)

**🐛 Bug** · lines 131-134

The thrown error in the transaction re-validation block is missing the `error` property, which `isStructuredError` requires. The function checks `typeof obj.error === 'string'`, but the thrown object only has `status` and `detail`. This causes the error to fall through to the generic 500 handler instead of returning the intended 400 `INVALID_TRANSITION` response.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
          throw Object.assign(new Error('INVALID_TRANSITION'), {
            status: 400,
            error: 'INVALID_TRANSITION',
            detail: `Cannot transition from '${current.status}' to '${status}'`,
          });
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
          throw Object.assign(new Error('INVALID_TRANSITION'), {
            status: 400,
            detail: `Cannot transition from '${current.status}' to '${status}'`,
          });
```
</details>

---

**🐛 Bug** · line 29

The `'review'` status is listed in `PARTNER_ALLOWED_STATUSES` but is unreachable from any other status via `WORKFLOW_TRANSITIONS`. No transition targets `'review'` — the only outgoing transitions from `'review'` are `['revision_required', 'approved']`. Either a transition like `'pending_review' → 'review'` is missing, or `'review'` should be removed from the allowed list.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  'pending_review': ['approved', 'in_progress', 'review'],
  'review': ['revision_required', 'approved'],
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  'review': ['revision_required', 'approved'],
```
</details>

---

**🔒 Security** · lines 127-136

Access control (assignedPartnerId / engagement.partnerId) is verified only once before the transaction (lines 74-76). If a concurrent admin reassigns the request to a different partner, the original partner could still update the status within the transaction. The transaction should re-verify access control against the current assignment to prevent TOCTOU.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
      // Re-validate access control against fresh assignment
      const currentAccess = await tx.legalRequest.findUniqueOrThrow({
        where: { id },
        select: { assignedPartnerId: true, engagement: { select: { partnerId: true } } },
      });
      const hasAccessRecheck = currentAccess.assignedPartnerId === member.partnerId ||
        currentAccess.engagement?.partnerId === member.partnerId;
      if (!hasAccessRecheck) {
        throw Object.assign(new Error('FORBIDDEN'), {
          status: 403,
          error: 'FORBIDDEN',
          detail: 'Partner no longer has access to this request',
        });
      }

      // Re-validate transition against fresh status
      if (status !== current.status) {
        const allowedNextRecheck = WORKFLOW_TRANSITIONS[current.status] || [];
        if (!allowedNextRecheck.includes(status)) {
          throw Object.assign(new Error('INVALID_TRANSITION'), {
            status: 400,
            error: 'INVALID_TRANSITION',
            detail: `Cannot transition from '${current.status}' to '${status}'`,
          });
        }
      }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
      // Re-validate transition against fresh status
      if (status !== current.status) {
        const allowedNextRecheck = WORKFLOW_TRANSITIONS[current.status] || [];
        if (!allowedNextRecheck.includes(status)) {
          throw Object.assign(new Error('INVALID_TRANSITION'), {
            status: 400,
            detail: `Cannot transition from '${current.status}' to '${status}'`,
          });
        }
      }
```
</details>


## 🟡 Medium (1)

**🐛 Bug** · line 27

The `'cancelled'` status appears as a valid transition target from `'in_progress'` in `WORKFLOW_TRANSITIONS`, but it is not included in `PARTNER_ALLOWED_STATUSES`. This means a partner can never actually set the status to `'cancelled'`, making the transition definition dead. Either add `'cancelled'` to the allowed list or remove it from the workflow transitions.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  'in_progress': ['pending_review'],
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  'in_progress': ['pending_review', 'cancelled'],
```
</details>


## 🔵 Low (1)

**🔧 Maintainability** · line 110

No-op transitions (setting status to its current value) are allowed (line 106: `status !== request.status`). This creates a workflowTransition record and audit event with identical `fromStatus`/`toStatus`, which may pollute the timeline and audit logs. Consider rejecting same-status updates explicitly.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    if (status === request.status) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', detail: 'Status is already the current value', field: 'status' },
        { status: 400 }
      );
    }
    if (!allowedNextStatuses.includes(status)) {
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    if (status !== request.status && !allowedNextStatuses.includes(status)) {
```
</details>


