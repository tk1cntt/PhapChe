# Review: `src/lib/constants/partner-statuses.ts`

**Project:** PhapChe | **Review:** `75dc866e-664f-4b1f-8897-9da96ec262ff`

**Comments:** 2

---

## 🟡 Medium (2)

**🔧 Maintainability** · lines 8-15

**Misleading constant name and comments**: `PARTNER_ALLOWED_STATUSES` aggregates statuses that belong to three different roles (specialist, reviewer, coordinator_admin) under a single "partner" umbrella. The inline comments say "partner can mark as approved after review" and "partner can mark as delivered", but per `request-workflow.ts`, only `reviewer` can transition to `approved` and only `coordinator_admin` can transition to `delivered`. If this constant is used in a UI dropdown to let a "partner" pick any status, a specialist could select `approved` and the backend would correctly reject it — but the UX would be confusing. Consider splitting into separate role-specific constants (e.g. `SPECIALIST_STATUSES`, `REVIEWER_STATUSES`, `COORDINATOR_STATUSES`) or at minimum clarifying the comment to explain that "partner" is a collective term encompassing multiple roles.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
// Partner-allowed statuses (aggregated across specialist, reviewer, coordinator roles)
// See request-workflow.ts canTransitionRequestStatus() for per-role enforcement
// - specialist: in_progress, pending_review
// - reviewer: approved (also revision_required, not listed here)
// - coordinator_admin: delivered
export const PARTNER_ALLOWED_STATUSES = [
  REQUEST_STATUS.IN_PROGRESS,
  REQUEST_STATUS.PENDING_REVIEW,
  REQUEST_STATUS.APPROVED,
  REQUEST_STATUS.DELIVERED,
] as const;
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
// Partner allowed status transitions based on request-workflow.ts
// Partners can transition from in_progress to pending_review
export const PARTNER_ALLOWED_STATUSES = [
  REQUEST_STATUS.IN_PROGRESS,      // 'in_progress'
  REQUEST_STATUS.PENDING_REVIEW,    // 'pending_review'
  REQUEST_STATUS.APPROVED,          // 'approved' - partner can mark as approved after review
  REQUEST_STATUS.DELIVERED,        // 'delivered' - partner can mark as delivered
] as const;
```
</details>

---

**🔧 Maintainability** · line 28

**Weak type annotation**: `REQUEST_STATUS_LABELS` is typed as `Record<string, string>`, which loses the key constraint. If a new status is added to `REQUEST_STATUS` in `types.ts`, TypeScript will not flag this labels object as missing a key. Similarly, typos in keys won't be caught. Use `Record<RequestStatus, string>` instead (import `RequestStatus` from `@/lib/types`).

<details>
<summary>:bulb: Suggestion</summary>

```typescript
export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export const REQUEST_STATUS_LABELS: Record<string, string> = {
```
</details>


