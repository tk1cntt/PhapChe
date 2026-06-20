---
phase: 76
reviewers: [self-review]
reviewed_at: 2026-06-20T18:30:00Z
plans_reviewed: [PLAN.md]
---

# Self-Review — Phase 76: Create Request

## Summary

Plan gồm 21 tasks trong 4 waves (Foundation → Backend → Frontend → Tests), tổng ~1888 dòng. Cấu trúc tốt, decisions D-01 đến D-13 được cover đầy đủ, 11/11 CREQ-IDs có plan tương ứng. Threat model có 5 risks với mitigations rõ ràng. Tuy nhiên, có một số gaps và concerns cần address trước khi execute.

---

## Strengths

- **Wave organization rõ ràng**: 4 waves với dependency đúng thứ tự (Foundation → API → Frontend → Tests)
- **Decision coverage 100%**: Tất cả 13 decisions (D-01 đến D-13) đều có task tương ứng
- **Requirement coverage 100%**: CREQ-01 đến CREQ-11 đều được map vào plans
- **Threat model tốt**: 5 threats (IDOR, file abuse, XSS, priority escalation, contact spoofing) với mitigation + verification cụ thể
- **Acceptance criteria chi tiết**: Mỗi task có 8-15 criteria với test commands cụ thể
- **Edge coverage đầy đủ**: 14 edge cases từ SPEC đều có trong must_haves
- **Prohibitions rõ ràng**: 8 prohibitions từ SPEC đều được list
- **Test strategy comprehensive**: 77 unit tests + 20 E2E tests, target ≥ 90% coverage

---

## Concerns

### HIGH Severity

1. **Task 76-06 (Submit Enhancement) đặt sai vị trí**
   - Task 76-06 nằm SAU Wave 4 header (Integration + Tests) nhưng thuộc Wave 2 (Backend APIs)
   - Frontmatter ghi `wave: 1` nhưng content có 4 wave sections riêng
   - **Risk**: Executor có thể skip task 76-06 hoặc chạy sai thứ tự
   - **Fix**: Move task 76-06 vào Wave 2 section, trước task 76-07

2. **Missing database migration for priority/contactInfo fields**
   - Task 76-06 nói "Add priority/contactInfo/submittedAt fields to Request model (nếu cần)" — mơ hồ
   - Không có dedicated migration task cho Request model changes
   - **Risk**: Executor không biết có cần chạy `prisma migrate dev` hay không
   - **Fix**: Thêm task 76-03b hoặc gộp vào 76-03 (database schema) để cover Request model changes

3. **File upload dùng XMLHttpRequest nhưng plan không ghi rõ**
   - RESEARCH.md ghi: "File upload uses XMLHttpRequest for progress events (exception to fetch-only rule)"
   - Nhưng task 76-12 (FileUploadZone) ghi: "Call POST /api/intake/attach-file với FormData" — không nói XMLHttpRequest
   - CONTEXT.md D-07 ghi: "Upload ngay khi user chọn file" — không mention XMLHttpRequest
   - **Risk**: Executor dùng fetch API → không có progress events
   - **Fix**: Task 76-12 `<action>` phải ghi rõ "Dùng XMLHttpRequest (không fetch) để track upload progress events"

### MEDIUM Severity

4. **Task 76-08 (WizardSteps) modify file cũ nhưng không ghi rõ migration**
   - Plan ghi "Cập nhật file WizardSteps.tsx" nhưng không nói component hiện tại có bao nhiêu steps
   - Nếu WizardSteps hiện tại là 4 steps (từ v2.0), cần migration strategy
   - **Fix**: Thêm acceptance criterion: "Verify backward compatibility với existing 4-step wizard usage"

5. **Missing task cho DELETE draft API**
   - Task 76-20 E2E test 4 có: "Click Xóa → API call DELETE /api/intake/draft/:id"
   - Nhưng không có backend task tạo DELETE endpoint
   - **Fix**: Thêm task 76-05b cho DELETE /api/intake/draft/:id endpoint

6. **i18n task 76-16 không có test verification**
   - 50+ translation keys nhưng không có i18n validation test
   - Acceptance criterion chỉ ghi "npm run i18n:check (nếu có script)" — không chắc chắn
   - **Fix**: Thêm test verify tất cả keys exist trong 4 locale files, hoặc dùng next-intl's missing translation detection

7. **Contact info pre-fill logic chưa rõ ràng**
   - Task 76-13 (ReviewStep) ghi: "Pre-fill từ user profile (fetch GET /api/users/me nếu chưa có)"
   - Nhưng task 76-15 (Page Integration) cũng ghi: "Fetch user data: name, email, organization"
   - Ai fetch? Page server component hay ReviewStep client component?
   - **Fix**: Clarify: page server component fetches user data, passes as prop to CreateRequestForm → WizardProvider → ReviewStep

8. **Concurrent draft save debounce chưa có task**
   - Must_haves ghi: "Concurrent draft saves: Debounce save calls (500ms), chỉ save latest"
   - Nhưng task 76-07 (WizardProvider) ghi: "Trigger save khi isDirty && step thay đổi" — không có debounce
   - **Fix**: Task 76-07 phải thêm debounce 500ms cho auto-save useEffect

### LOW Severity

9. **Task numbering gap**: 76-06 bị skip trong Wave 2 (có 76-03, 04, 05 rồi nhảy sang 07). Task 76-06 nằm ở cuối file.

10. **Priority enum inconsistency**: CONTEXT.md ghi `'normal' | 'urgent'` nhưng plan một chỗ ghi `'low', 'medium', 'high', 'urgent'` (CREQ-09 cũ). Plan đã resolve về 2 values nhưng cần verify.

11. **Missing: ServiceTypeList.test.tsx** trong files_modified frontmatter — task 76-17 ghi tạo test này nhưng frontmatter không list.

12. **FileUploadZone.test.tsx** không có trong task 76-17 test list (chỉ ghi 6 test files nhưng FileUploadZone là component thứ 5).

---

## Suggestions

1. **Move task 76-06 vào Wave 2** — trước task 76-07 (Frontend starts). Đây là blocking issue.

2. **Add DELETE draft endpoint task** — hoặc merge vào task 76-05 (Draft Load API) thành "Draft CRUD API".

3. **Clarify XMLHttpRequest trong task 76-12** — ghi rõ trong `<action>`: "Dùng XMLHttpRequest với upload.onprogress event, KHÔNG dùng fetch API".

4. **Merge Request model migration vào task 76-03** — ghi rõ: "Add priority (String @default('normal')), contactInfo (Json?), submittedAt (DateTime?) to Request model".

5. **Add debounce vào task 76-07** — trong useEffect auto-save: "Debounce save call 500ms dùng setTimeout/clearTimeout".

6. **Clarify user data flow** — task 76-15 fetches user data server-side, passes to client via props. Task 76-13 không fetch riêng.

7. **Add ServiceTypeList.test.tsx và FileUploadZone.test.tsx** vào files_modified frontmatter.

---

## Risk Assessment

**Overall Risk: LOW-MEDIUM**

- **Strengths outweigh concerns**: Plan rất chi tiết, decisions cover 100%, edge cases đầy đủ
- **HIGH concerns fixable**: Task ordering, missing migration, XMLHttpRequest clarification — tất cả fix được trong 30 phút
- **No architectural risk**: Context + useReducer pattern đúng, wave dependency đúng, test strategy sound
- **Execution risk**: LOW nếu fix 3 HIGH concerns trước khi execute

---

## Recommended Actions Before Execution

1. ✅ **Move task 76-06 to Wave 2** (HIGH)
2. ✅ **Add DELETE draft endpoint to task 76-05** (MEDIUM)
3. ✅ **Add XMLHttpRequest clarification to task 76-12** (HIGH)
4. ✅ **Merge Request model changes into task 76-03** (HIGH)
5. ✅ **Add debounce to task 76-07** (MEDIUM)
6. ✅ **Clarify user data flow** (MEDIUM)
7. ✅ **Fix files_modified frontmatter** (LOW)
