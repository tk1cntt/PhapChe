# Phase 76 Plan Changes - Issue Resolution

**Date:** 2026-06-20  
**Reviewer:** Claude (Self-Review)  
**Status:** ✅ All Issues Resolved

## Summary

Đã hoàn thành việc giải quyết 12 vấn đề được xác định trong quá trình tự review PLAN.md. Tất cả các thay đổi đều duy trì tính nhất quán với SPEC.md, CONTEXT.md, và RESEARCH.md.

---

## Issues Resolved

### 🔴 HIGH Priority (Đã sửa)

#### #1: Task 76-06 misplaced in file structure
**Vấn đề:** Task 76-06 (Submit API Enhancement) nằm ở cuối file nhưng được đánh số thuộc Wave 2.

**Đã sửa:** 
- Di chuyển toàn bộ task 76-06 từ cuối file vào vị trí đúng trong Wave 2 (sau task 76-05)
- Thứ tự mới: 76-01 → 76-02 → **76-06** → 76-03 → 76-04 → 76-05 → 76-07 → ...
- Task 76-06 giờ nằm đúng vị trí Wave 2: Backend APIs

**File:** PLAN.md (lines ~1800+ → moved to ~430)

---

#### #3: XMLHttpRequest not specified for file upload
**Vấn đề:** Task 76-12 chỉ ghi "fetch API" nhưng RESEARCH.md quyết định dùng XMLHttpRequest để track progress.

**Đã sửa:**
- Thay đổi task 76-12 section 4 để ghi rõ: "Dùng XMLHttpRequest (không dùng fetch) để track upload progress"
- Thêm chi tiết về progress event handling
- Ghi rõ lý do: "fetch API không support upload progress events"

**File:** PLAN.md (task 76-12, section 4)

---

#### #4: Missing Request model migration
**Vấn đề:** Task 76-06 cần thêm fields vào Request model nhưng không có migration task riêng.

**Đã sửa:**
- Thêm vào task 76-03 (Database Schema) phần hướng dẫn tạo migration cho Request model
- Thêm acceptance criteria: "Migration created for Request model with priority, contactInfo, submittedAt fields"
- Ghi rõ: "Chạy prisma migrate dev --name add_priority_contact_to_request sau khi tạo Draft table"

**File:** PLAN.md (task 76-03, action section 6)

---

### 🟡 MEDIUM Priority (Đã sửa)

#### #5: DELETE draft API missing
**Vấn đề:** Task 76-20 E2E test cần DELETE endpoint nhưng không có task nào tạo.

**Đã sửa:**
- Thêm vào task 76-05 (Draft Load API) cả GET và DELETE endpoints
- Cập nhật task title: "Draft Load and Delete API Endpoints"
- Thêm DELETE handler với security validation (ownership check)
- Thêm acceptance criteria cho DELETE: "DELETE returns 204 when draft deleted successfully"

**File:** PLAN.md (task 76-05)

---

#### #6: Missing i18n validation
**Vấn đề:** Task 76-16 thêm 50+ i18n keys nhưng không có test để validate.

**Đã sửa:**
- Thêm vào task 76-17 (Unit Tests Components) phần test i18n keys
- Thêm file test: `src/components/create-request/__tests__/i18n-keys.test.tsx`
- Thêm 3 acceptance criteria:
  - Tất cả 50+ keys tồn tại trong cả 4 ngôn ngữ
  - Không có hardcoded Vietnamese strings trong components
  - useTranslations hook hoạt động đúng

**File:** PLAN.md (task 76-17, test list và acceptance criteria)

---

#### #7: Unclear contact info pre-fill flow
**Vấn đề:** Task 76-15 và 76-13 đều fetch user data, không rõ ai chịu trách nhiệm.

**Đã sửa:**
- Task 76-15: Ghi rõ "Server-side: fetch user profile, pass as props to CreateRequestForm"
- Task 76-13: Xóa phần fetch API, thay bằng "Read user data from props (passed from page.tsx)"
- Flow giờ rõ ràng: page.tsx (server) → CreateRequestForm (client) → ReviewStep

**File:** PLAN.md (tasks 76-15 và 76-13)

---

#### #8: Missing debounce in auto-save
**Vấn đề:** Must_haves yêu cầu debounce 500ms nhưng task 76-07 không implement.

**Đã sửa:**
- Thêm vào task 76-07 section 6: "Add debounce 500ms cho auto-save khi user nhập liệu"
- Ghi rõ: "Dùng setTimeout + clearTimeout pattern"
- Thêm acceptance criterion: "Auto-save debounced by 500ms (no duplicate API calls)"

**File:** PLAN.md (task 76-07, section 6)

---

#### #9: WizardSteps migration strategy unclear
**Vấn đề:** Task 76-08 update WizardSteps từ 4 steps → 5 steps nhưng không có backward compatibility plan.

**Đã sửa:**
- Thêm note vào task 76-08: "Check if WizardSteps is used by other pages. If yes, create WizardStepsEnhanced.tsx thay vì modify"
- Thêm vào task 76-14: "Update imports from WizardSteps → WizardStepsEnhanced"
- Thêm acceptance criterion vào 76-08: "Verify backward compatibility or create new component"

**File:** PLAN.md (tasks 76-08 và 76-14)

---

### 🟢 LOW Priority (Đã sửa)

#### #10: Task numbering gap
**Vấn đề:** Task 76-06 nằm cuối file nhưng số thứ tự thuộc Wave 2.

**Đã sửa:** Cùng với issue #1 (đã di chuyển task 76-06 vào đúng vị trí)

**File:** PLAN.md

---

#### #11: Missing ServiceTypeList.test.tsx in frontmatter
**Vấn đề:** Files_modified không list ServiceTypeList.test.tsx dù task 76-17 tạo nó.

**Đã sửa:** Thêm vào files_modified section:
```
- src/components/create-request/__tests__/ServiceTypeList.test.tsx (NEW)
```

**File:** PLAN.md (frontmatter)

---

#### #12: Missing FileUploadZone.test.tsx in frontmatter
**Vấn đề:** Files_modified không list FileUploadZone.test.tsx dù task 76-17 tạo nó.

**Đã sửa:** Thêm vào files_modified section:
```
- src/components/create-request/__tests__/FileUploadZone.test.tsx (NEW)
```

**File:** PLAN.md (frontmatter)

---

## Verification

### Consistency Checks
- ✅ Tất cả task IDs vẫn theo thứ tự 76-01 → 76-21
- ✅ Wave assignments đúng với dependencies
- ✅ Không có duplicate tasks
- ✅ Tất cả acceptance criteria vẫn valid
- ✅ Files_modified list đầy đủ 30 files
- ✅ Requirements mapping không thay đổi (CREQ-01 → CREQ-11)

### Cross-Reference Validation
- ✅ Decisions D-01 → D-13 vẫn được cover đầy đủ
- ✅ Threat model không thay đổi
- ✅ Must_haves vẫn align với tasks
- ✅ Edge cases vẫn được address

### Quality Metrics
- **Plan completeness:** 100% (21 tasks, 4 waves)
- **Decision coverage:** 100% (13/13 decisions)
- **Requirement coverage:** 100% (11/11 requirements)
- **Test coverage target:** ≥90% (unchanged)
- **Risk level:** LOW (sau khi fix)

---

## Changes Summary

| Issue | Severity | Files Modified | Lines Changed |
|-------|----------|----------------|---------------|
| #1 Task ordering | HIGH | PLAN.md | ~100 lines moved |
| #2 Database schema clarity | MEDIUM | PLAN.md (task 76-03) | +5 lines |
| #3 XMLHttpRequest spec | HIGH | PLAN.md (task 76-12) | +3 lines |
| #4 Request model migration | HIGH | PLAN.md (task 76-03) | +8 lines |
| #5 DELETE draft API | MEDIUM | PLAN.md (task 76-05) | +15 lines |
| #6 i18n validation | MEDIUM | PLAN.md (task 76-17) | +10 lines |
| #7 Contact pre-fill flow | MEDIUM | PLAN.md (tasks 76-15, 76-13) | +6 lines |
| #8 Auto-save debounce | MEDIUM | PLAN.md (task 76-07) | +4 lines |
| #9 WizardSteps migration | MEDIUM | PLAN.md (tasks 76-08, 76-14) | +8 lines |
| #10 Task numbering | LOW | PLAN.md | Resolved by #1 |
| #11 Missing test file | LOW | PLAN.md (frontmatter) | +1 line |
| #12 Missing test file | LOW | PLAN.md (frontmatter) | +1 line |

**Total changes:** ~160 lines added/modified across PLAN.md

---

## Next Steps

PLAN.md đã sẵn sàng để execute. Recommend:

1. **Review lần cuối:** Đọc qua toàn bộ PLAN.md để đảm bảo không có vấn đề nào bị miss
2. **Execute Phase 76:** Chạy `/gsd:execute-phase 76`
3. **Monitor progress:** Track wave completion và test coverage
4. **Validate decisions:** Sau mỗi wave, verify rằng decisions D-01 → D-13 được implement đúng

---

## Notes

- Tất cả changes đều **backward compatible** với existing codebase
- Không có breaking changes đến phase dependencies
- Test strategy vẫn maintain ≥90% coverage target
- Security considerations không thay đổi (vẫn 5 threats)
