# Phase 27: Create Request - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-11
**Phase:** 27-create-request
**Mode:** auto (assumptions mode)

---

## Auto-Selected Decisions

| Area | Decision | Rationale |
|------|----------|-----------|
| Layout structure | Sidebar + 2-column grid | Matches Phase 26 patterns and template layout |
| Wizard steps | 4-step with active/inactive states | Template specification |
| Service selection | 5 radio-style options | Template has 5 service types |
| Tags | Color-coded (green/blue/orange/purple/red) | Template tag colors |
| Sidebar panels | Summary + Checklist | Template sidebar structure |
| Data source | SQLite via Prisma | Project standard (Phase 26 decision) |
| Test coverage | Full whitebox/blackbox/e2e/abnormal/error | Project requirement ≥90% |

---

## Assumptions Confirmed

### Wizard Component
- **Assumption:** WizardSteps component handles 4 steps with visual indicators
- **Confidence:** Confident (template clearly shows step 1-4 structure)

### Service Types
- **Assumption:** 5 service types from template: Soạn hợp đồng đại lý, Soạn hợp đồng lao động, Đăng ký nhãn hiệu, Rà soát hợp đồng / NDA, Dịch vụ khác
- **Confidence:** Confident (template has all 5 defined)

### Tags
- **Assumption:** Tag colors match template: green (Khuyến nghị), blue (Nhanh), purple (IP), orange (Cần tài liệu), red (Phân loại)
- **Confidence:** Confident (template CSS defines colors)

### Form Fields
- **Assumption:** Fields include: Workspace dropdown, Priority dropdown, Contact name, Contact email, Description
- **Confidence:** Confident (template has all 5 fields)

### Sidebar Panels
- **Assumption:** Two sidebar cards: Summary (Tóm tắt hồ sơ) and Checklist (Checklist cần chuẩn bị)
- **Confidence:** Confident (template shows both panels)

---

## Deferred Ideas

| Idea | Reason |
|------|--------|
| Multi-step navigation (steps 2-4) | Implement step 1 display only in Phase 27 |
| File upload for Documents step | Placeholder only, upload functionality in future phase |
| AI service type suggestion | v2.0 feature |

---

## Phase Context Reference

Phase 27 inherits patterns from:
- **Phase 26 CONTEXT.md** — Layout structure, UserLayout usage, data source patterns
- **Template `user-create-request.html`** — Full UI specification with CSS, HTML structure, sample data

