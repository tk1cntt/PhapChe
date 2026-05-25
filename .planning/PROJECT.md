# Legal-as-a-Service Platform

## What This Is

Hệ thống quản trị pháp lý thông minh cho SME, dùng giao diện hội thoại để tiếp nhận yêu cầu pháp lý, chuẩn hóa thông tin đầu vào, điều phối chuyên viên xử lý, kiểm soát chất lượng bởi reviewer, giao tài liệu cuối cùng cho khách hàng và lưu hồ sơ trong Legal Vault.

Sản phẩm không phải “AI lawyer” tự tư vấn luật thay con người. Giá trị chính là biến dịch vụ pháp lý thuê ngoài thành quy trình số có trạng thái, checklist, phân quyền, tài liệu, audit trail và chất lượng đầu ra nhất quán.

## Core Value

SME gửi yêu cầu pháp lý theo cách đơn giản như nhắn tin và nhận tài liệu/tư vấn đã qua kiểm soát chất lượng, có thể truy vết toàn bộ quá trình xử lý.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Khách hàng SME có thể tạo workspace và gửi yêu cầu pháp lý qua chat/form theo mẫu.
- [ ] Hệ thống chuẩn hóa câu trả lời thành intake có cấu trúc, không chỉ lưu raw chat.
- [ ] Khách hàng có thể upload giấy tờ/hồ sơ liên quan vào request.
- [ ] Admin có thể xem danh sách request, trạng thái xử lý và phân công specialist.
- [ ] Capability Matrix gợi ý specialist/reviewer phù hợp theo loại nghiệp vụ và trạng thái rảnh.
- [ ] Specialist có thể xem intake, file, ghi chú nội bộ và tạo/gửi bản nháp tài liệu.
- [ ] Reviewer có portal split view: bản thảo bên trái, checklist QC bên phải.
- [ ] Reviewer có thể approve hoặc reject/revise kèm tiêu chí chưa đạt và comment.
- [ ] Hồ sơ chỉ chuyển sang “chờ ký số/giao khách” sau khi reviewer approve.
- [ ] Khách hàng có thể nhận/tải tài liệu cuối cùng và theo dõi trạng thái request.
- [ ] Legal Vault lưu hồ sơ, bản nháp, bản final, metadata, version và quyền truy cập.
- [ ] Audit trail ghi lại thao tác quan trọng: tạo request, upload, assign, generate, review, approve, reject, deliver, download.
- [ ] Hệ thống có phân quyền customer, specialist, reviewer, coordinator/admin, super admin.
- [ ] Dữ liệu pháp lý nhạy cảm được bảo vệ bằng private storage, signed URL ngắn hạn và kiểm tra quyền server-side.

### Out of Scope

- AI tự kết luận pháp lý thay reviewer — rủi ro sai luật và liability cao; AI chỉ hỗ trợ intake/draft/tóm tắt khi có guardrails.
- OCR trong MVP — hữu ích nhưng không chặn core workflow; lưu file trước, OCR async sau.
- Tích hợp ký số trong MVP — thiết kế boundary trước, tích hợp provider sau khi workflow approve/delivery ổn.
- Marketplace luật sư mở — khó kiểm soát chất lượng; MVP dùng pool specialist/reviewer nội bộ.
- Workflow builder tùy biến vô hạn — overbuild; MVP dùng state machine cố định theo request.
- Billing/subscription tự động — không phải core value giai đoạn đầu; có thể xử lý thủ công.
- Compliance calendar nâng cao — defer sau khi Legal Vault và company profile ổn định.

## Context

Nguồn yêu cầu đến từ `docs/note.txt` và `docs/Có.docx`.

Tài liệu mô tả Legal-as-a-Service Platform cho SME, lấy chat-based interface làm điểm chạm chính. Khách hàng chọn nghiệp vụ như soạn hợp đồng lao động, đăng ký nhãn hiệu, soạn hợp đồng đại lý; hệ thống hỏi bộ câu hỏi đầu vào rồi tạo request và/hoặc tài liệu dựa trên template.

Luồng nghiệp vụ mẫu: khách chọn “Soạn hợp đồng đại lý”, bot hỏi tên đối tác, tỷ lệ chiết khấu, thời hạn hợp đồng; hệ thống kiểm tra logic/điều khoản liên quan; bản thảo được gửi trong chat; nếu cần chỉnh sửa đặc thù thì chuyển specialist xử lý qua dashboard nội bộ.

Tài liệu nhấn mạnh tư duy E-Myth: không xây AI biết tất cả, mà xây “cây thư mục quy trình/SOP”. Mọi câu hỏi nên rơi vào quy trình đã định sẵn; ngoài quy trình thì chuyển con người xử lý, sau đó bổ sung SOP để máy hóa lần sau.

Reviewer Checklist mã nghiệp vụ QC-LEG-01 gồm ba nhóm:

1. Formal Requirements:
   - Đúng mẫu mới nhất.
   - Không lỗi chính tả/trình bày, căn lề/font đồng nhất.
   - Thông tin thực thể khớp 100% với hồ sơ khách gửi.

2. Legal Content:
   - Điều luật trích dẫn còn hiệu lực.
   - Điều khoản quyền/nghĩa vụ rõ ràng, không gây hiểu lầm.
   - Có điều khoản tranh chấp, bồi thường, bất khả kháng khi phù hợp.
   - Hồ sơ giải quyết đúng nỗi đau khách mô tả.

3. Operational & Signing:
   - Vùng ký đúng vị trí.
   - Phân loại mật đúng quy định.

Reviewer Portal yêu cầu split view: bên trái bản thảo Word/PDF, bên phải checklist. Reviewer chỉ approve khi checklist đạt; reject/revise phải chọn tiêu chí chưa đạt và ghi chú trực tiếp vào đoạn cần sửa.

Coordinator cần Capability Matrix: mỗi specialist/reviewer có thẻ năng lực gồm chuyên môn như luật lao động, luật doanh nghiệp, thuế. Khi có yêu cầu, coordinator chọn loại nghiệp vụ, hệ thống gợi ý nhân sự có kỹ năng tương ứng và đang available.

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
| MVP là legal operations cockpit, không phải AI lawyer | Giảm rủi ro pháp lý, tập trung core value xử lý request có QC | — Pending |
| Intake dùng chat/form hybrid nhưng output phải structured | Raw chat khó route, khó review, khó generate document | — Pending |
| Reviewer QC bắt buộc trước delivery/final | Chất lượng pháp lý là niềm tin cốt lõi | — Pending |
| Capability Matrix rule-based trước, auto-routing sau | Tránh overbuild khi chưa có dữ liệu vận hành | — Pending |
| Legal Vault versioned + audit từ đầu | Hồ sơ pháp lý cần truy vết và phân quyền | — Pending |
| OCR/e-sign/compliance calendar nâng cao để v2 | Không chặn end-to-end MVP | — Pending |
| Stack đề xuất: modular monolith Next.js + PostgreSQL + Prisma + S3/R2 + worker | Nhanh cho MVP, ít infra, vẫn đủ mở rộng | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-26 after initialization*
