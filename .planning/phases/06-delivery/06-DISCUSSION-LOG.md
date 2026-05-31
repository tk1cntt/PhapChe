# Phase 6: delivery - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-31
**Phase:** 06-delivery
**Areas discussed:** Customer Portal Location, Final Document Filtering, Download URL Implementation, Notification Channel, Close Request Flow
**Mode:** --auto (default selections applied)

---

## Customer Portal Location

| Option | Description | Selected |
|--------|-------------|----------|
| Dedicated route `/customer/requests/[requestId]` | Separate customer portal, cleaner RBAC | ✓ |
| Tab in shared request page | Overload existing pages with role checks | |

**User's choice:** (auto-selected) Dedicated route `/customer/requests/[requestId]`
**Notes:** Follows existing pattern from specialist/reviewer portals

---

## Final Document Filtering

| Option | Description | Selected |
|--------|-------------|----------|
| Check `request.status = 'approved'` | Document version status 'approved' implicit when request approved | ✓ |
| Check documentVersion.status directly | Additional query complexity | |

**User's choice:** (auto-selected) Use request.status as source of truth
**Notes:** Less querying, consistent with RBAC

---

## Download URL Implementation

| Option | Description | Selected |
|--------|-------------|----------|
| Real signed URL (R2/S3) | Production-ready, short TTL | ✓ |
| Stub URL with token | MVP only, not secure for production | |

**User's choice:** (auto-selected) Real signed URL implementation
**Notes:** Replace stub in vault-service.ts

---

## Notification Channel

| Option | Description | Selected |
|--------|-------------|----------|
| Email via Resend | Lightweight MVP choice | ✓ |
| In-app notifications only | Less immediate | |
| Multiple channels (email + in-app) | Over-scope for MVP | |

**User's choice:** (auto-selected) Email via Resend
**Notes:** Triggered on `delivered` transition

---

## Close Request Flow

| Option | Description | Selected |
|--------|-------------|----------|
| Specialist/coordinator close without customer confirmation | Auditor sees delivery event as proof | ✓ |
| Require customer download confirmation | Blocks closure indefinitely | |

**User's choice:** (auto-selected) No customer confirmation required
**Notes:** Delivery audit event sufficient

---

## Claude's Discretion

- Download button UI (inline vs modal)
- Close request confirmation dialog style
- Document list display format (table vs cards)

## Deferred Ideas

- **E-sign integration** — Phase 7+
- **In-app notification center** — future phase
- **Customer download tracking** — future phase