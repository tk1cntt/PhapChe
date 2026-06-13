# Phase 49: Operations — Real Data Integration - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-13
**Phase:** 49-Operations — Real Data Integration
**Areas discussed:** Data contract, Component split, SLA behavior, Test scope

---

## Initial Gray Areas

| Option | Description | Selected |
|--------|-------------|----------|
| Data contract | Khóa API/service trả về gì cho stat cards, workload, timeline, operations table; dùng lại ops-service hiện có hay thêm endpoint kiểu /api/admin/operations. | ✓ |
| Component split | Khóa cách chia source component trong src/components/admin: client container, stat grid, workload panel, timeline, SLA table; tuyệt đối không đặt source mới trong src/legacy. | ✓ |
| SLA behavior | Khóa cách hiển thị SLA bars/status từ deadline/status age thật: màu xanh/cam/đỏ, empty state, overdue, missing deadline. | ✓ |
| Test scope | Khóa bộ testcase bắt buộc cho UI/API/e2e theo yêu cầu: whitebox, blackbox, abnormal, error, e2e và DB-only data. | ✓ |

**User's choice:** Discuss all four areas.
**Notes:** User had already instructed integration into `src/app/[locale]`, component source under `src/components`, and legacy/layout files as references only.

---

## Data Contract

### Endpoint Shape

| Option | Description | Selected |
|--------|-------------|----------|
| One endpoint | Dùng một endpoint /api/admin/operations trả về stats + workload + timeline + table. Khuyến nghị vì màn Operations cần tải đồng bộ và đơn giản giống phase 48. | ✓ |
| Split endpoints | Tách /stats, /workload, /timeline, /requests. Linh hoạt hơn nhưng tăng code/test surface cho MVP. | |
| Server page | Không dùng API client fetch, page server gọi service rồi render. Ít client state hơn nhưng khó dùng toolbar refresh/filter như phase 48. | |

**User's choice:** One endpoint.
**Notes:** Lock aggregate endpoint for screen data.

### Filters

| Option | Description | Selected |
|--------|-------------|----------|
| Template filters | Search + status + workspace + refresh theo pattern AdminToolbar/template. Khuyến nghị vì đủ match UI và scope MVP. | |
| Ops filters full | Thêm specialist/reviewer/date/matter type vào API ngay. Hữu ích vận hành nhưng có thể vượt scope UI template. | ✓ |
| Read-only only | Chỉ render dữ liệu không filter. Ít code hơn nhưng không đạt toolbar filters functional nếu áp requirement ADMIN-OPS-06. | |

**User's choice:** Ops filters full.
**Notes:** Endpoint should support full Operations filters.

### Timeline Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Recent global | Hiển thị timeline gần nhất toàn workspace/tất cả workspace theo quyền từ audit/workflow events. Khuyến nghị cho màn Operations tổng quan. | ✓ |
| Selected row | Chỉ tải timeline cho request đang chọn. Rõ ngữ cảnh hơn nhưng cần interaction chọn dòng, có thể lệch template tổng quan. | |
| Both | Màn chính có timeline recent global; click dòng có thể fetch timeline chi tiết theo request nếu đã có route/endpoint. Nhiều code hơn. | |

**User's choice:** Recent global.
**Notes:** Main timeline is overview-level recent activity.

---

## Component Split

### Component Granularity

| Option | Description | Selected |
|--------|-------------|----------|
| Screen components | Tạo các component màn rõ ràng: AdminOperationsClient, OperationsStats, OperationsWorkloadPanel, OperationsTimeline, OperationsTable. Khuyến nghị vì dễ test từng phần. | ✓ |
| Single client | Một AdminOperationsClient chứa gần hết UI. Ít file hơn nhưng khó whitebox test và dễ phình to. | |
| Generic reuse | Tổng quát hóa lại AdminRequestsTable/AdminToolbar để dùng chung. Có thể sạch hơn nhưng dễ refactor ngoài scope. | |

**User's choice:** Screen components.
**Notes:** New source belongs under `src/components/admin`.

### Template Fidelity

| Option | Description | Selected |
|--------|-------------|----------|
| Pixel parity | Giữ layout/spacing/color/shadow gần template nhất có thể, chỉ thay data source bằng DB/API. Khuyến nghị vì phase success criteria yêu cầu match template. | ✓ |
| Pattern parity | Chỉ giữ cấu trúc chính, style theo component hiện có. Nhanh hơn nhưng có thể lệch template. | |
| Minimal viable | Chỉ cần đúng dữ liệu thật, UI cải thiện sau. Không phù hợp success criteria hiện tại. | |

**User's choice:** Pixel parity.
**Notes:** `layout/admin-operations.html` and legacy/mock sources are references only.

### Loading/Error/Empty Ownership

| Option | Description | Selected |
|--------|-------------|----------|
| Client-owned | AdminOperationsClient quản lý loading/error/empty và truyền data xuống component con. Khuyến nghị vì giống phase 48 và dễ e2e retry. | ✓ |
| Each component | Mỗi panel tự xử lý empty/error. Linh hoạt nhưng dễ inconsistent. | |
| Server boundary | Dùng Next error/loading boundary. Hợp RSC hơn nhưng Phase 49 có filter client nên khó đồng nhất. | |

**User's choice:** Client-owned.
**Notes:** Child components should stay focused and easy to test.

---

## SLA Behavior

### SLA Source

| Option | Description | Selected |
|--------|-------------|----------|
| Deadline first | Ưu tiên `LegalRequest.slaDeadline`; nếu thiếu thì fallback status age/currentStatusSince. Khuyến nghị vì dùng dữ liệu SLA thật khi có, vẫn hiển thị được case thiếu deadline. | ✓ |
| Status age only | Chỉ dùng số ngày ở status hiện tại từ workflow transitions. Nhất quán với ops-service hiện có nhưng không phản ánh deadline thật nếu DB có. | |
| Deadline only | Chỉ dùng slaDeadline. Chính xác deadline nhưng nhiều row có thể thiếu thanh SLA/empty. | |

**User's choice:** Deadline first.
**Notes:** Preserve real deadline semantics and safe fallback.

### SLA Color Levels

| Option | Description | Selected |
|--------|-------------|----------|
| Simple 3-level | green = ok, orange = near due/aging warn, red = overdue/danger. Khuyến nghị vì match ADMIN-OPS-05 và template. | |
| 4-level plus blue | Thêm blue/no SLA hoặc informational. Rõ hơn nhưng có thể lệch requirement chỉ nêu green/orange/red. | ✓ |
| Exact template | Clone chính xác ngưỡng nếu layout/legacy có logic cụ thể; nếu không có thì planner tự suy ra. Ít quyết định hơn nhưng mơ hồ. | |

**User's choice:** 4-level plus blue.
**Notes:** Blue handles no-SLA/informational states.

### Missing Data

| Option | Description | Selected |
|--------|-------------|----------|
| Explicit fallback | Hiển thị “Chưa có SLA”/blue hoặc fallback từ updatedAt/currentStatusSince; không crash, không hardcode sample. Khuyến nghị cho abnormal/error coverage. | ✓ |
| Hide bar | Không hiển thị SLA bar cho row thiếu dữ liệu. Gọn nhưng người vận hành khó biết thiếu config. | |
| Treat warn | Thiếu dữ liệu coi là cảnh báo orange. Nổi bật vấn đề data nhưng có thể tạo false alarm. | |

**User's choice:** Explicit fallback.
**Notes:** Missing deadline/transition must be visible and safe.

---

## Test Scope

### Test Structure

| Option | Description | Selected |
|--------|-------------|----------|
| Layered full | Whitebox component tests + blackbox API/service tests + abnormal/error tests + Playwright e2e DB→UI. Khuyến nghị vì đúng CLAUDE.md và đủ coverage. | ✓ |
| E2E heavy | Tập trung Playwright cho toàn màn, ít unit/component hơn. Bắt UI tốt nhưng khó đạt coverage code. | |
| Service heavy | Tập trung service/API, e2e smoke render. Nhanh hơn nhưng thiếu testcase UI đầy đủ. | |

**User's choice:** Layered full.
**Notes:** Must satisfy project testing policy.

### Test Data

| Option | Description | Selected |
|--------|-------------|----------|
| DB seed helper | Tạo seed/helper insert LegalRequest, assignments, workflowTransition, auditEvent rồi UI/API đọc từ DB. Khuyến nghị vì đúng rule DB-only. | ✓ |
| Reuse global seed | Dùng seed hiện có nếu đủ dữ liệu. Ít code hơn nhưng dễ phụ thuộc trạng thái global và thiếu edge cases. | |
| Mock fetch UI | Mock API cho component tests, e2e dùng DB. Chỉ phù hợp whitebox nhỏ; không được thay thế DB flow chính. | |

**User's choice:** DB seed helper.
**Notes:** UI/API/E2E data should come from DB insertion and reads.

### E2E Flow

| Option | Description | Selected |
|--------|-------------|----------|
| Render+filters+SLA | Login admin → /vi/admin/operations → thấy stats/workload/timeline/table từ DB → filter thay đổi rows → SLA colors/fallback đúng. Khuyến nghị đủ end-to-end. | ✓ |
| Render only | Chỉ chứng minh màn render từ DB. Nhanh nhưng thiếu filter/SLA behavior đã khóa. | |
| Full interactions | Thêm click row, drill-down timeline chi tiết, export. Có thể vượt scope vì chưa khóa capability drill-down/export. | |

**User's choice:** Render+filters+SLA.
**Notes:** Drill-down/export not locked for this phase.

---

## Final Gate

| Option | Description | Selected |
|--------|-------------|----------|
| Ready context | Tạo 49-CONTEXT.md và discussion log với các quyết định đã khóa. | ✓ |
| Explore more | Thảo luận thêm gray areas khác trước khi ghi context. | |

**User's choice:** Ready context.

---

## Claude's Discretion

- Exact DTO field names, pagination defaults, and component filenames may be decided during planning if they preserve locked decisions and existing style.

## Deferred Ideas

None.
