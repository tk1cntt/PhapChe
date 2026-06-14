# Phase 55: Architecture & Standards — Discussion Log

**Phase:** 55
**Date:** 2026-06-14

## Discussion Summary

This phase required implementation decisions only — requirements were locked from SPEC.md.

## Areas Discussed

### 1. StatCard Extraction Strategy

**Question:** Nên unify StatCard thành một component hay giữ riêng admin/user?

**Options presented:**
1. Unified component — Một StatCard duy nhất trong ui/, hỗ trợ 5 variants, prop i18n optional
2. Giữ 2 riêng — AdminStatCard cho admin pages, StatCard cho user pages

**Decision:** Unified component ✓

**Rationale:** Single component reduces duplication, supports all variants, optional i18n prop.

---

### 2. Type Unification Structure

**Question:** Tổ chức types theo entity hay theo layer?

**Options presented:**
1. By Entity — user.ts, workspace.ts, request.ts, audit.ts
2. By Layer — domain-types.ts, api-types.ts, ui-types.ts

**Decision:** By Entity ✓

**Rationale:** Aligns with Prisma schema structure, intuitive navigation.

---

### 3. Component Registry Format

**Question:** Markdown hay YAML/JSON format?

**Options presented:**
1. Markdown — Dễ đọc, tự động render trong GitHub
2. YAML/JSON — Machine-readable, generate docs tự động

**Decision:** Markdown ✓

**Rationale:** Simple, no build step, auto-renders in GitHub/GitLab.

---

### 4. API Response Format

**Question:** Envelope pattern hay flat response?

**Options presented:**
1. Envelope — {data, meta} với pagination metadata
2. Flat — Trả trực tiếp data, metadata qua headers

**Decision:** Envelope pattern ✓

**Rationale:** Consistent across endpoints, supports pagination, extensible for metadata.

---

## Deferred Ideas

None.

---

## Notes

All 4 gray areas resolved in single session with recommended defaults.
No scope creep detected.

---

*Discussion log created: 2026-06-14*
