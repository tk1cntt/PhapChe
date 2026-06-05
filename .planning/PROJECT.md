# Legal-as-a-Service Platform

## Current State (v1.0 MVP — Shipped 2026-06-05)

v1.0 MVP đã hoàn thành với **14 phases, 49 plans, 70 tasks** — 360 commits, 12,413 LOC TypeScript/TSX, 51,879 insertions across 304 files.

**What shipped:**
- Foundation: RBAC, audit, workspace isolation, workflow state machine
- Intake: Vietnamese customer chat/form intake with structured answers, file upload, status tracking
- Routing: Capability matrix, coordinator assignment, specialist/reviewer queue
- Documents & Vault: Versioned templates, draft generation from intake, private file storage with permissions
- Review: Reviewer portal with split-view, QC checklist, approve/reject workflow
- Delivery: Customer delivery page with signed URL downloads, request close
- Operations: Dashboard, filters, workload, SLA tracking, audit timeline
- Ant Design: Full UI migration to antd across admin/specialist/customer/reviewer route groups

**Tech stack:** Next.js 14 (App Router), TypeScript, Prisma + SQLite, Ant Design 6, Tailwind CSS

## What This Is

Hệ thống quản trị pháp lý thông minh cho SME, dùng giao diện hội thoại để tiếp nhận yêu cầu pháp lý, chuẩn hóa thông tin đầu vào, điều phối chuyên viên xử lý, kiểm soát chất lượng bởi reviewer, giao tài liệu cuối cùng cho khách hàng và lưu hồ sơ trong Legal Vault.

Sản phẩm không phải "AI lawyer" tự tư vấn luật thay con người. Giá trị chính là biến dịch vụ pháp lý thuê ngoài thành quy trình số có trạng thái, checklist, phân quyền, tài liệu, audit trail và chất lượng đầu ra nhất quán.

## Core Value

SME gửi yêu cầu pháp lý theo cách đơn giản như nhắn tin và nhận tài liệu/tư vấn đã qua kiểm soát chất lượng, có thể truy vết toàn bộ quá trình xử lý.

## Requirements

### Validated

- ✓ **Foundation** — RBAC, audit, workspace isolation, workflow state machine — v1.0
- ✓ **Intake** — Vietnamese chat/form intake, structured answers, file upload, status page — v1.0
- ✓ **Routing** — Capability matrix, coordinator assignment, specialist/reviewer queues — v1.0
- ✓ **Documents** — Versioned templates, draft generation, submit-for-review — v1.0
- ✓ **Vault** — Private file storage, versioning, permissioned access, audit trail — v1.0
- ✓ **Review** — Split-view reviewer portal, QC checklist, approve/reject with comments — v1.0
- ✓ **Delivery** — Customer delivery page, signed URL downloads, request close — v1.0
- ✓ **Operations** — Dashboard, filters, workload, SLA, audit timeline — v1.0
- ✓ **Folder/Tag** — Internal file classification for vault organization — v1.0
- ✓ **Ant Design UI** — Complete migration to antd across all route groups — v1.0

### Active (v2.0 Candidates)

- [ ] OCR tự động nhận dạng giấy tờ upload (business licenses, IDs, contracts)
- [ ] AI đề xuất loại nghiệp vụ và trường intake từ file upload
- [ ] AI tóm tắt hồ sơ cho specialist với citation
- [ ] AI draft section từ template/clause library (low-risk sections)
- [ ] AI flag rủi ro trước khi reviewer review
- [ ] Tích hợp e-sign (ký số)
- [ ] Compliance calendar với reminders
- [ ] Billing automation
- [ ] E2E test coverage cho toàn bộ workflow (hiện tại mới có Phase 1 tests)

### Out of Scope

- AI tự kết luận pháp lý thay reviewer — rủi ro sai luật và liability cao; AI chỉ hỗ trợ intake/draft/tóm tắt khi có guardrails.
- Open lawyer marketplace — khó kiểm soát chất lượng; MVP dùng pool specialist/reviewer nội bộ.
- Workflow builder tùy biến vô hạn — overbuild; MVP dùng state machine cố định theo request.

## Context

Nguồn yêu cầu đến từ `docs/note.txt` và `docs/Có.docx`.

Tài liệu mô tả Legal-as-a-Service Platform cho SME, lấy chat-based interface làm điểm chạm chính. Khách hàng chọn nghiệp vụ như soạn hợp đồng lao động, đăng ký nhãn hiệu, soạn hợp đồng đại lý; hệ thống hỏi bộ câu hỏi đầu vào rồi tạo request và/hoặc tài liệu dựa trên template.

Luồng nghiệp vụ mẫu: khách chọn "Soạn hợp đồng đại lý", bot hỏi tên đối tác, tỷ lệ chiết khấu, thời hạn hợp đồng; hệ thống kiểm tra logic/điều khoản liên quan; bản thảo được gửi trong chat; nếu cần chỉnh sửa đặc thù thì chuyển specialist xử lý qua dashboard nội bộ.

Tài liệu nhấn mạnh tư duy E-Myth: không xây AI biết tất cả, mà xây "cây thư mục quy trình/SOP". Mọi câu hỏi nên rơi vào quy trình đã định sẵn; ngoài quy trình thì chuyển con người xử lý, sau đó bổ sung SOP để máy hóa lần sau.

### Technical Debt & Known Issues

- Pre-existing TypeScript errors in template pages (out of scope for v1.0)
- `npm run typecheck` has pre-existing failures outside ops code
- No DATABASE_URL configured for demo data seeding
- Phase 01 verification has `human_needed` status (needs browser check for UI interaction)
- No e2e tests beyond Phase 1 foundation

## Constraints

- **Legal accuracy**: Nội dung/tài liệu pháp lý phải qua reviewer trước khi final — giảm rủi ro tư vấn sai.
- **Security**: Hồ sơ pháp lý doanh nghiệp nhạy cảm — file phải private, phân quyền theo tenant/request, signed URL ngắn hạn, audit đầy đủ.
- **MVP scope**: Ưu tiên workflow end-to-end hơn OCR/e-sign/AI nâng cao — chứng minh vận hành trước khi automation.
- **Template governance**: Template phải versioned, có trạng thái approved/published/deprecated — tránh dùng nhầm mẫu cũ.
- **Workflow integrity**: Status thay đổi qua backend state machine — không hard-code logic ở frontend.
- **Traceability**: Review phải gắn với document version cụ thể — tránh duyệt bản này nhưng gửi bản khác.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| MVP là legal operations cockpit, không phải AI lawyer | Giảm rủi ro pháp lý, tập trung core value xử lý request có QC | ✓ Good — validated by v1.0 |
| Intake dùng chat/form hybrid nhưng output phải structured | Raw chat khó route, khó review, khó generate document | ✓ Good — validated by v1.0 |
| Reviewer QC bắt buộc trước delivery/final | Chất lượng pháp lý là niềm tin cốt lõi | ✓ Good — validated by v1.0 |
| Capability Matrix rule-based trước, auto-routing sau | Tránh overbuild khi chưa có dữ liệu vận hành | ✓ Good — validated by v1.0 |
| Legal Vault versioned + audit từ đầu | Hồ sơ pháp lý cần truy vết và phân quyền | ✓ Good — validated by v1.0 |
| OCR/e-sign/compliance calendar nâng cao để v2 | Không chặn end-to-end MVP | ✓ Good — deferred to v2 |
| Stack: modular monolith Next.js + PostgreSQL/Prisma + S3/R2 | Nhanh cho MVP, ít infra, vẫn đủ mở rộng | ✓ Good — validated by v1.0 |
| Gap-closure phases (08-14) sau milestone audit | Fix broken flows và design gaps trước khi ship | ✓ Good — all gaps closed |
| Ant Design UI cho phase 14 | Component library chuẩn, giảm maintenance UI custom | ✓ Good — zero custom UI remaining |

---

*Last updated: 2026-06-05 after v1.0 milestone*
