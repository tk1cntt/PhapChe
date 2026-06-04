---
phase: 11
slug: wire-review-init
status: verified
threats_open: 0
asvs_level: 1
created: 2026-06-04
updated: 2026-06-04
---

# Phase 11 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| Browser -> Server action | `startReviewAction` receives FormData from untrusted client | `documentVersionId`, `requestId` (opaque IDs) |
| Server action -> Review service | Validated by `startReview`'s RBAC + state checks | `session` (server-validated), `documentVersionId` (string) |

---

## Threat Register

| Threat ID | Category | Component | Disposition | Mitigation | Status |
|-----------|----------|-----------|-------------|------------|--------|
| T-11-01 | Spoofing | `startReviewAction` | mitigate | Server action calls `requireAppSession()` at `actions.ts:101` before calling `startReview` — validates authentication via Next.js session token | closed |
| T-11-02 | Tampering | `startReviewAction` form input | mitigate | `startReview` in `review-service.ts:95-96` validates `documentVersionId` exists via Prisma lookup and checks `docVersion.status !== 'submitted_for_review'` before creating review. Server-side validation rejects tampered IDs. | closed |
| T-11-03 | Repudiation | `startReview` audit | mitigate | `startReview` in `review-service.ts:123-135` emits `recordAuditEvent` with `action='review.started'`, safe metadata (`docVersionId`, `reviewId`, `reviewerId`), within `prisma.$transaction` — atomic, non-repudiable | closed |
| T-11-04 | Info Disclosure | `startReviewAction` response | accept | `startReview` returns only `{ reviewId, status }` — no document content, PII, or legal content in response. Acceptable for MVP. | closed |
| T-11-05 | DoS | `startReview` | accept | Single review creation per `documentVersionId` + `reviewerId` with guard (line 105-108). No rate-limiting for MVP — acceptable risk for SME-scale deployment. | closed |
| T-11-06 | Elevation | `startReviewAction` | mitigate | `startReview` at `review-service.ts:98-100` checks `assignedReviewerId === session.userId` OR admin roles before creating review. Non-assigned users get `FORBIDDEN` error. | closed |

*Status: open · closed*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| R-11-01 | T-11-04 | `startReviewAction` response limited to non-sensitive metadata (`reviewId`, `status`). No PII or legal content crosses boundary. | Phase architect | 2026-06-04 |
| R-11-02 | T-11-05 | SME-scale MVP — no rate-limiting needed. Single review creation guard already prevents duplicate abuse. | Phase architect | 2026-06-04 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-06-04 | 6 | 6 | 0 | gsd-security-auditor (Claude) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-06-04
