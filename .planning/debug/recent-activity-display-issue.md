---
status: fixed
trigger: "Phần hoạt động gần đây của user dashboard đang hiển thị chưa đúng mock ui - tất cả các mục đều hiển thị 'draft.save' thay vì nội dung thực tế"
created: 2026-06-22T11:42:23Z
updated: 2026-06-22T14:15:00Z
phase: 75
---

## Symptoms

### Expected Behavior
Panel "Hoạt động gần đây" (Recent Activity) trên user dashboard nên hiển thị các hoạt động thực tế với mô tả có ý nghĩa:
- "Hợp đồng đã được tạo"
- "Yêu cầu đã được phê duyệt"
- "Tài liệu đã được tải lên"
- Thời gian hiển thị đúng (ví dụ: "2 giờ trước", "1 ngày trước")

### Actual Behavior
Tất cả các mục đều hiển thị cùng một nội dung:
- **Title**: `draft.save`
- **Description**: `draft đã được draft.save.`
- **Time**: `1d trước`
- Lặp lại 10 lần với cùng nội dung

### Error Messages
Không có lỗi JavaScript console. Dữ liệu hiển thị nhưng nội dung không chính xác.

### Timeline
- Issue này xuất hiện sau khi implement Phase 75 (User Dashboard)
- Có thể do dữ liệu mock không đúng hoặc logic mapping không đúng

### Reproduction
1. Đăng nhập vào dashboard
2. Scroll xuống panel "Hoạt động gần đây"
3. Thấy tất cả items đều hiển thị "draft.save"

---

## Investigation

### Evidence Gathered

1. **ActivityTimeline component** (`src/components/dashboard/ActivityTimeline.tsx`):
   - Render `a.action`, `a.description`, `a.relativeTime`
   - Data flow từ `DashboardClient` -> props

2. **Dashboard page** (`src/app/[locale]/dashboard/page.tsx`):
   - Fetch `prisma.auditEvent.findMany()` (line 78-86)
   - Transform `recentActivities` (line 131-232)
   - Logic mapping xử lý: `request.*`, `document.*`, `partner.*`, `workspace.*`, `user.*`
   - Fallback (line 218-221): `formatActivityAction(action)` + `${targetType} đã được ${action.toLowerCase()}`

3. **Draft save API** (`src/app/api/intake/draft/save/route.ts`):
   - Line 148: `action: 'draft.save'` - tạo audit event với action không theo convention
   - Action `draft.save` không khớp với bất kỳ pattern nào trong dashboard transform

4. **Seed data** (`prisma/seed/operations.ts`):
   - Actions: `request.create`, `request.update`, etc. (underscore format)
   - Không tạo ra `draft.save`

### Root Cause Identified

**ROOT CAUSE FOUND**

Trong `src/app/api/intake/draft/save/route.ts` (line 148), khi save draft, code tạo audit event với action `draft.save`.

Trong dashboard (`page.tsx` line 218-221), action `draft.save` không khớp pattern nào:
- Không có `request.`, `document.`, `partner.`, `workspace.`, `user.` prefix
- Fallback xử lý:
  - `actionText = formatActivityAction('draft.save')` -> trả về `draft.save` (không có mapping)
  - `descriptionText = "draft đã được draft.save."`

---

## Resolution

### Root Cause
Action `draft.save` không tuân theo naming convention được xử lý trong dashboard transform logic.

### Fix Applied
1. Sửa action trong draft save API từ `draft.save` thành `draft.created`/`draft.updated`
2. Thêm handler cho `draft.*` pattern trong dashboard transform (backup fix)

### Files Modified
- `src/app/api/intake/draft/save/route.ts` (line 148)
- `src/app/[locale]/dashboard/page.tsx` (line 218-221)

### Specialist Review
N/A - TypeScript/React fix straightforward

---

## Evidence

- timestamp: 2026-06-22T14:10:00Z
  source: src/app/api/intake/draft/save/route.ts
  finding: action: 'draft.save' hardcoded at line 148
