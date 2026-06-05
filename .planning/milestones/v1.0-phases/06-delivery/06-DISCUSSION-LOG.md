# Phase 6: delivery - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-31
**Phase:** 06-delivery
**Mode:** --auto
**Areas discussed:** Customer portal, Final document filtering, Signed download, Notification, Close request flow

---

## Customer portal

| Option | Description | Selected |
|--------|-------------|----------|
| Dedicated customer route | Add `/customer/requests/[requestId]`, separated from internal UI and filtered for customer role. | ✓ |
| Shared request detail tab | Reuse existing request detail and add customer-facing tab. | |
| Admin-style internal view | Reuse internal workbench structure with customer copy. | |

**User's choice:** Auto-selected recommended default: Dedicated customer route.
**Notes:** Separation reduces risk of leaking internal specialist/reviewer data.

---

## Final document filtering

| Option | Description | Selected |
|--------|-------------|----------|
| Final-only vault artifacts | Show only `DocumentVersion.status = final` and related `VaultFile` records for customer-owned request. | ✓ |
| All approved request files | Show every file once request is approved. | |
| Manual curated list | Internal user selects which files customer sees. | |

**User's choice:** Auto-selected recommended default: Final-only vault artifacts.
**Notes:** Server-side filtering required. Frontend filtering is not security.

---

## Signed download

| Option | Description | Selected |
|--------|-------------|----------|
| Provider signed URL | API validates RBAC/final visibility, records audit, returns/redirects to 15-minute signed URL. | ✓ |
| Stub URL | Keep current `requestVaultFileAccess()` stub. | |
| Proxy file bytes through app | App streams file directly after authorization. | |

**User's choice:** Auto-selected recommended default: Provider signed URL.
**Notes:** Current `src/lib/documents/vault-service.ts` has stub. Preserve no-raw-storageKey boundary.

---

## Notification

| Option | Description | Selected |
|--------|-------------|----------|
| Email notification | Send simple email when request transitions to `delivered`. | ✓ |
| In-app notification | Build internal notification center. | |
| No notification | Customer discovers delivery by checking portal. | |

**User's choice:** Auto-selected recommended default: Email notification.
**Notes:** Email should include request title, document list/link, expiry warning. No notification preferences in MVP.

---

## Close request flow

| Option | Description | Selected |
|--------|-------------|----------|
| Specialist/coordinator close | Assigned specialist or coordinator/admin can close delivered request with reason. | ✓ |
| Coordinator only | Only coordinator/admin closes request. | |
| Customer confirms then close | Close after customer confirms/downloads. | |

**User's choice:** Auto-selected recommended default: Specialist/coordinator close.
**Notes:** Customer download confirmation not required. Audit delivery/close events.

---

## Claude's Discretion

- Exact download button placement.
- Exact close confirmation UI.
- Exact email wording.
- Exact module/file names for provider abstraction.

## Deferred Ideas

- E-sign integration — v2 signature flow.
- In-app notification center — future customer communication phase.
- Customer download tracking/confirmation — analytics/audit enhancement, not required for MVP.
- Notification preferences/opt-out — post-MVP settings.
