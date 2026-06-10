# Phase 28: My Cases - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the analysis.

**Date:** 2026-06-11
**Phase:** 28-my-cases
**Mode:** auto (--auto flag)

---

## Analysis Summary

### Phase 28: My Cases

**Domain:** Display and manage legal requests (cases) within workspace scope

**Template:** `layout/user-cases.html`

**Gray Areas Identified (auto-selected all):**
1. Summary banner content and styling
2. Stat card values and icons
3. Toolbar search and filter behavior
4. Requests table columns and data
5. SLA badge calculation
6. Action link navigation

---

## Decisions Made (Auto Mode)

### Layout Structure
| Area | Options | Selected | Rationale |
|------|---------|----------|-----------|
| UserLayout | With/Without sidebar | With sidebar (262px) | Consistent with Phase 26-27 pattern |
| Content scroll | Nested/Independent | Independent overflow | Template uses `overflow: auto` on content |

### Summary Banner
| Area | Options | Selected | Rationale |
|------|---------|----------|-----------|
| Banner content | Template exact/Custom | Template exact | Match user-cases.html exactly |
| Create button | Link to create page | Teal gradient style | Consistent with Phase 27 |

### Stat Cards
| Card | Value | Icon | Selected |
|------|-------|------|----------|
| Tổng hồ sơ | 12 | 📄 (blue) | Template exact |
| Đang xử lý | 3 | ⏱ (orange) | Template exact |
| Hoàn tất | 8 | ✓ (green) | Template exact |
| Quá hạn | 1 | ! (red) | Template exact |

### Toolbar
| Feature | Implementation | Selected |
|---------|---------------|----------|
| Search | Real-time filtering | Template pattern |
| Filters | Status + Type dropdowns | Template pattern |
| Right tools | Export + Columns buttons | Template pattern |

### Requests Table
| Column | Implementation | Selected |
|--------|---------------|----------|
| Mã hồ sơ | Case icon + code + status | Template pattern |
| Loại yêu cầu | VN title + EN subtitle | Template pattern |
| Trạng thái | Color-coded badges | Phase 26 pattern |
| SLA | Time remaining badges | Template pattern |
| Actions | Context-aware links | Template pattern |

### Floating Chat
| Element | Value | Selected |
|---------|-------|----------|
| Label | Hỗ trợ | Phase 26-27 pattern |
| Badge | 2 Tin mới | Template exact |
| Style | Red gradient + yellow border | Phase 26 pattern |

---

## Auto-Resolution Log

```
[auto] Context exists — no prior context found, creating new
[auto] Selected all gray areas: Summary banner, Stat cards, Toolbar, Table, Floating chat
[auto] All decisions auto-resolved with template-exact values
[auto] Proceeding to context capture
```

---

## Prior Context Applied

From Phase 26 CONTEXT.md:
- UserLayout wrapper pattern
- StatCard component with variants
- Badge component with color variants
- Floating chat button style
- i18n rules for all 4 languages

From Phase 27 CONTEXT.md:
- Component architecture patterns
- Data source patterns (Prisma queries)
- Form validation approach

---

## Sample Data Requirements

From template `user-cases.html`:

**Stats:**
- Tổng: 12 (from January 2026)
- Đang xử lý: 3 (1 needs response)
- Hoàn tất: 8 (with consultation results)
- Quá hạn: 1 (missing documents)

**Sample Requests:**
| Code | Type | Status | Assignee | SLA |
|------|------|--------|----------|-----|
| REQ-2026-021 | Rà soát hợp đồng dịch vụ | Đang review | Hà Linh (Specialist) | Còn 5h |
| REQ-2026-019 | Soạn phụ lục SLA | Cần phản hồi | Quang Dũng (Reviewer) | Còn 2h |
| REQ-2026-018 | Tư vấn điều khoản bảo mật | Đã duyệt | Minh Trang (Coordinator) | Đúng hạn |
| REQ-2026-016 | Bổ sung giấy phép kinh doanh | Quá hạn | Hà Linh (Specialist) | Trễ 1 ngày |
| REQ-2026-012 | Đăng ký nhãn hiệu | Đã nộp | Khánh An (IP Specialist) | Theo dõi |

---

## Deferred Ideas

- **Case detail page:** Navigation from "Mở →" link — future phase
- **Bulk actions:** Multi-select, batch export — future phase
- **Advanced filters:** Date range, assignee filter — future phase

---

*Phase: 28-my-cases*
*Context gathered: 2026-06-11*
