# Phase 85: Database Schema Improvement - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-17
**Phase:** 85-Database-Schema-Improvement
**Areas discussed:** N/A (auto-resolved from architecture review)
**Mode:** --auto

---

## Auto-Resolution Summary

All decisions were auto-resolved from the independent architecture review completed on 2026-06-17.

| Area | Auto-Resolved To | Rationale |
|------|-----------------|-----------|
| Assignment Source of Truth | Option B (RequestAssignment) | Industry standard, history preservation |
| Vault/File Architecture | Option B + Simple (File + VaultItem) | Simplified two-tier, DRY principle |
| Review FK | Option A (documentVersionId as primary FK) | Immutable audit, legal traceability |
| MatterType Reference | Option A (matterTypeId FK) | Type safety, query performance |
| FK Addition Strategy | Phase 1 (NON-BREAKING) | Safety first approach |
| CHECK Constraints | Add for all enum fields | Data integrity at DB level |
| Migration Strategy | Expand-Contract with feature flag | Rollback capability |
| Unique Index Fixes | Partial unique indexes | SQLite NULL workaround |

---

## Prior Work

This discussion phase was auto-resolved because:

1. An independent architecture review was completed on 2026-06-17
2. All technical decisions were already made with proper trade-off analysis
3. The review followed the 4-step methodology:
   - Bước 1: Liệt kê và Phân rã (Neutral Listing)
   - Bước 2: Phân tích theo Tiêu chí (Attribute Mapping)
   - Bước 3: Đề xuất dựa trên Context (Contextual Recommendation)
   - Bước 4: Chế độ Phản biện Nghịch đảo (Adversarial Mode)

## Documents Referenced

- `prisma/db_suggest.md` — Original analysis
- `prisma/DB_IMPROVEMENT_PLAN.md` — Initial improvement plan
- `prisma/DB_ARCHITECTURE_REVIEW.md` — Expert review with final recommendations

## Risks Identified (from Adversarial Review)

1. **Race Condition** — Concurrent assignment can set wrong isCurrent flag
   - Mitigation: Use `BEGIN EXCLUSIVE` transaction
2. **Query Performance** — JOIN vs direct query can be slower
   - Mitigation: Index on (requestId, kind, isCurrent)
3. **Orphan FileAssets** — VaultItem deletion doesn't cascade to FileAsset
   - Mitigation: `ON DELETE CASCADE` or background cleanup

## Deferred Ideas

- Translation table refactoring (P3)
- Event sourcing implementation
- PostgreSQL migration
- Module-based migration file organization
