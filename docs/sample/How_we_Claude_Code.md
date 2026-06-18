Dưới đây là bản **tổng hợp chi tiết workshop “How we Claude Code”** từ transcript bạn gửi.

Nguồn chính là transcript workshop bạn upload. 

---

# 1. Workshop này nói về điều gì?

Workshop hướng dẫn cách team Anthropic dùng **Claude Code** trong quy trình phát triển phần mềm, đặc biệt là khi làm việc với **AI agents chạy lâu hơn, tự xử lý nhiều bước hơn**, và cần một cách làm việc mới để:

* lấy yêu cầu tốt hơn từ người dùng,
* mô tả sản phẩm / UI rõ hơn,
* giảm việc agent làm sai rồi tốn nhiều token để sửa,
* xác minh kết quả bằng cơ chế agent-native,
* dùng HTML như một dạng spec giàu thông tin hơn Markdown.

Người trình bày là **Arno**, thuộc Applied AI team của Anthropic. Nội dung dựa trên talk/blog của Tariq về ý tưởng **“The Unreasonable Effectiveness of HTML files”**. 

Thông điệp chính của workshop là:

> Khi model ngày càng mạnh, đừng cố ép nó bằng quá nhiều ràng buộc cứng. Hãy để Claude khai thác yêu cầu từ bạn, dựng spec giàu ngữ cảnh hơn, rồi tự xác minh sản phẩm bằng các contract có thể đọc được trong artifact.

---

# 2. Bối cảnh: Vì sao cần đổi cách làm việc với Claude Code?

Workshop mở đầu bằng nhận định rằng AI agents đang ngày càng có khả năng xử lý task dài và phức tạp hơn. Khi agent chạy lâu hơn, rủi ro cũng lớn hơn:

* nếu spec ban đầu mơ hồ, agent có thể đi sai hướng;
* nếu không có verification rõ, người dùng khó biết kết quả đúng hay sai;
* nếu chỉ dùng Markdown dài, người đọc dễ bỏ qua hoặc hiểu sai;
* nếu phải sửa nhiều vòng, token và thời gian bị lãng phí.

Vì vậy, workshop đề xuất chuyển từ cách làm:

```text
Prompt ngắn → Agent tự đoán → Sinh code → Người kiểm tra thủ công
```

sang cách làm:

```text
Claude phỏng vấn người dùng → Sinh spec rõ hơn → Dựng HTML artifact → Gắn verification vào artifact → Agent/human/CI cùng xác minh
```

---

# 3. Ba cấp độ chính trong workshop

Workshop được chia thành 3 phần lớn.

## Phần 1: Để Claude phỏng vấn bạn thay vì bạn tự viết spec hoàn chỉnh

Ý tưởng: con người thường **không giỏi mô tả đầy đủ yêu cầu ngay từ đầu**. Ta thường “biết khi nhìn thấy”, nhưng khó viết một spec chuẩn ngay lần đầu.

Workshop nói rằng Claude có thể giỏi hơn trong việc **khai thác yêu cầu tiềm ẩn** từ bạn, giống như khi product team phỏng vấn user.

Ví dụ trong workshop là một app đơn giản: **bill splitting app** — app chia tiền khi đi ăn/chơi cùng bạn bè.

Thay vì prompt kiểu:

```text
Make a bill splitting app.
```

hoặc tệ hơn:

```text
Make it better.
```

Người trình bày khuyến nghị prompt theo hướng:

```text
Tôi muốn xây app chia bill.
Hãy phỏng vấn tôi để làm rõ yêu cầu, audience, use case, edge cases.
Đừng vội build ngay.
Hãy dùng ask-user-question tool để hỏi tôi từng câu.
```

Điểm quan trọng là không cần over-specify toàn bộ kết quả, mà nên chỉ rõ **domain, audience, mục tiêu, phạm vi cần hỏi**. Sau đó để Claude hỏi tiếp.

### Điểm rút ra

Prompt tốt không phải là prompt dài nhất. Prompt tốt là prompt khiến Claude:

* biết cần hỏi thêm gì,
* không tự đoán quá nhiều,
* khai thác requirement theo từng vòng,
* giúp người dùng làm rõ thứ họ thật sự muốn.

---

# 4. Phần 2: Dùng HTML file thay cho Markdown spec

Workshop nhấn mạnh rằng Markdown vẫn hữu ích, nhưng khi spec quá dài, nhiều người sẽ không đọc kỹ. Đặc biệt với frontend/UI/product flow, Markdown không đủ trực quan.

Người trình bày nói rằng:

* Markdown file dài hơn khoảng vài trăm dòng thường khó đọc;
* HTML chứa được nhiều thông tin trực quan hơn;
* HTML có thể thể hiện layout, hierarchy, interaction, visual direction;
* HTML dễ feedback hơn, nhất là khi dùng screenshot;
* Claude có thể tạo nhiều hướng thiết kế khác nhau để người dùng chọn.

Trong demo, Claude được yêu cầu tạo **4 design directions** cho app chia bill. Các hướng có aesthetic khác nhau, ví dụ:

* brutalist,
* Tokyo fintech,
* các style UI khác nhau.

Người dùng có thể mở từng HTML file, click thử, nhìn layout, rồi feedback lại Claude.

### Vì sao HTML spec tốt hơn trong nhiều trường hợp?

Vì HTML spec không chỉ nói:

```text
Nút nằm ở bên phải.
Form có 3 field.
Trang có dashboard.
```

Nó có thể thể hiện trực tiếp:

* spacing,
* hierarchy,
* màu sắc,
* cảm giác UI,
* layout thật,
* responsive idea,
* interaction giả lập,
* visual affordance.

Với frontend, feedback kiểu:

```text
Cái này hơi lệch.
Nút này chưa nổi bật.
Bảng này trông quá đơn điệu.
Hero section này chưa premium.
```

thường khó diễn tả bằng chữ, nhưng rất dễ chỉ ra bằng ảnh/screenshot.

Workshop cũng khuyến nghị thường xuyên **chụp screenshot đưa lại cho Claude**, đặc biệt khi làm frontend, vì vision model có thể hiểu vấn đề thị giác tốt hơn việc người dùng cố mô tả bằng chữ.

---

# 5. Phần 3: Verification agent-native

Đây là phần quan trọng nhất của workshop.

Người trình bày phân biệt giữa **testing** và **verification** trong ngữ cảnh này.

Testing thường là test code truyền thống:

```text
Unit test
Integration test
E2E test
CI test
```

Verification ở đây là: làm sao để artifact do agent tạo ra có thể **tự công bố trạng thái, contract, invariant, probe**, để cả người và agent đều có thể kiểm tra.

Workshop demo bằng một app React nhỏ: **to-do app**.

App có các thao tác:

* thêm task,
* đánh dấu done,
* xoá task,
* clear completed,
* cập nhật trạng thái total / active / done.

Vấn đề: Làm sao để Claude hoặc agent xác minh app đang đúng mà không phải đoán trạng thái UI bằng cách scrape DOM thông thường?

Giải pháp: component sẽ **emit state ra DOM** thông qua các data attributes / verification contract.

Ví dụ concept:

```html
<div
  data-verify-unit="todo-app"
  data-total="3"
  data-active="2"
  data-done="1"
>
  ...
</div>
```

Khi user thêm/xoá/tick task, các giá trị này cập nhật. Agent có thể đọc trực tiếp contract này từ DOM.

---

# 6. Verification framework trong workshop gồm những gì?

Trong repo workshop có một phase riêng cho verification. Nó xoay quanh các thành phần:

## 6.1. Schemas

Schema mô tả dữ liệu component cần expose là gì.

Ví dụ với to-do app:

```text
total
active
done
items
status
```

Schema giúp agent biết cần đọc gì và format dữ liệu thế nào.

## 6.2. Fixtures

Fixture là các trạng thái mẫu đã biết trước.

Ví dụ:

```text
Empty list
One active item
One completed item
Mixed active/completed
All completed
```

Agent hoặc dashboard có thể load từng fixture và kiểm tra app có phản ứng đúng không.

## 6.3. Invariants

Invariant là các điều kiện **luôn phải đúng**.

Ví dụ:

```text
total = active + done
done không thể lớn hơn total
active không thể âm
clear completed không được xoá active item
```

Trong workshop có một invariant cố tình bị làm sai:

```text
3 + 4 không bằng 10
```

Mục tiêu là để demo dashboard/agent phát hiện verification failure.

## 6.4. Probes

Probe là hành động kiểm tra, không chỉ happy path.

Ví dụ:

```text
Add item
Toggle item
Delete item
Clear completed
Replay scenario
```

Workshop nhấn mạnh rằng verification tốt không chỉ kiểm tra đường đi đẹp, mà cần “push off the happy path”.

## 6.5. DOM contract

Đây là phần để agent đọc trạng thái từ app mà không cần hiểu sâu React internals.

Thay vì agent phải đoán từ text hiển thị, app chủ động expose:

```text
data-verify-unit
data-total
data-active
data-done
data-state
data-contract
```

Nghĩa là app trở nên “agent-readable”.

---

# 7. Ba bề mặt verification

Workshop đưa ra 3 cách chạy verification.

## 7.1. Human-readable dashboard

Có một dashboard để con người bấm:

```text
Run one verification
Run all verifications
Xem pass/fail
Xem detail từng bước
```

Đây là bề mặt dành cho người kiểm tra thủ công nhưng có cấu trúc rõ.

## 7.2. Agent-first browser verification

Claude Code có thể dùng Playwright MCP để mở browser, đọc DOM contract, chạy verification, phát hiện lỗi và giải thích nguyên nhân.

Trong demo, Claude phát hiện lỗi kiểu:

```text
Schema got rejected
4 + 3 does not equal 10
```

Đây là điểm cốt lõi: agent không chỉ viết code, mà còn tự đọc contract để xác minh code.

## 7.3. Headless verification trong CLI/CI

Có thể chạy lệnh kiểu:

```bash
bun verify
```

để chạy verification matrix headlessly, tương tự CI.

Vậy cùng một verification framework có thể dùng cho:

```text
Human dashboard
Claude/browser agent
CI/headless
```

Đây là thiết kế rất mạnh, vì không phải viết 3 hệ thống kiểm tra khác nhau.

---

# 8. Recording verification làm bằng chứng

Workshop còn đề cập việc ghi lại quá trình verification thành video/clip.

Mục đích:

* lưu bằng chứng app đã hoạt động đúng,
* chia sẻ với đồng nghiệp,
* upload lên S3 hoặc hệ thống nội bộ,
* review lại các thay đổi frontend,
* giảm số lần con người phải kiểm tra trực tiếp.

Người trình bày nói rằng Claude Code team cũng dùng hướng này cho frontend changes: ghi lại các clip verification để chứng minh thay đổi hoạt động đúng.

Đây là một idea rất hữu ích cho team phát triển sản phẩm:

```text
Code change → Agent chạy verification → Record evidence → Share/review
```

---

# 9. Các command / mode được nhắc tới

Workshop có nhắc một số cách dùng Claude Code:

## Auto mode

Người trình bày khuyến nghị mạnh:

```text
Use auto mode.
```

Auto mode giúp Claude Code tự xử lý workflow dễ hơn, giảm việc user phải approve/lựa chọn từng bước quá nhiều.

## Fast mode

Fast mode được dùng để iterate nhanh hơn, đặc biệt khi tạo spec hoặc design direction.

Ghi chú: fast mode có thể tốn chi phí hơn, nhưng hữu ích khi cần tốc độ.

## Effort parameter

Người trình bày khuyến nghị dùng:

```text
/effort x-high
```

hoặc max effort trong một số trường hợp.

Mục đích là để model suy nghĩ kỹ hơn cho các task cần reasoning/phân tích/phức tạp.

## Ask user question tool

Đây là công cụ quan trọng trong phần requirement extraction. Prompt nên yêu cầu Claude dùng tool này để hỏi lại người dùng trước khi build.

---

# 10. Repo workshop gồm các phase nào?

Transcript nói repo có 3 phase chính.

## Phase 1: Requirement interview

Claude phỏng vấn người dùng về app bill splitting để khai thác yêu cầu.

Mục tiêu:

```text
Đừng bắt người dùng tự viết spec hoàn chỉnh.
Hãy để Claude hỏi và làm rõ requirement.
```

## Phase 2: Generate HTML design directions

Claude tạo nhiều hướng thiết kế bằng HTML để user so sánh và feedback.

Mục tiêu:

```text
Dùng HTML làm artifact/spec trực quan hơn Markdown.
```

## Phase 3: Verification framework

Dùng to-do React app để demo:

* schemas,
* fixtures,
* invariants,
* DOM state emissions,
* verification dashboard,
* Playwright MCP,
* headless verification,
* recording evidence.

Mục tiêu:

```text
Embed verification vào chính artifact để agent/human/CI cùng kiểm tra được.
```

---

# 11. Quy trình được đề xuất sau workshop

Có thể tóm tắt thành workflow như sau:

```text
1. Nêu domain và mục tiêu ban đầu
   ↓
2. Yêu cầu Claude phỏng vấn để lấy requirement
   ↓
3. Claude tạo spec rõ hơn
   ↓
4. Claude tạo nhiều HTML design directions
   ↓
5. User xem, click, screenshot, feedback
   ↓
6. Chốt hướng thiết kế
   ↓
7. Build app/component
   ↓
8. Gắn data contracts vào DOM
   ↓
9. Định nghĩa schema, fixture, invariant, probe
   ↓
10. Chạy verification bằng dashboard / Claude / CI
   ↓
11. Record evidence nếu cần
   ↓
12. Iterate tiếp
```

---

# 12. Ý nghĩa thực tế cho team dev/product

Workshop này không chỉ nói về Claude Code, mà còn gợi ý một mô hình làm phần mềm mới với AI agent.

## Với product/spec

Thay vì PM hoặc dev viết spec dài ngay từ đầu, có thể dùng Claude để phỏng vấn:

```text
Audience là ai?
Use case chính là gì?
Edge cases là gì?
Điều gì là out of scope?
UX mong muốn ra sao?
Dữ liệu cần quản lý là gì?
```

## Với UI/UX

HTML mockup có thể thay Figma nhẹ trong giai đoạn đầu:

```text
Tạo 4 concept
So sánh nhanh
Click thử
Screenshot feedback
Chốt visual direction
```

Không cần chờ design hoàn chỉnh mới bắt đầu trao đổi.

## Với frontend engineering

Component nên được thiết kế để agent đọc được:

```text
Expose state ra DOM
Có data attributes rõ ràng
Có test fixture
Có invariant
Có verification dashboard
```

Điều này giúp agent không phải “nhìn đoán”, mà có contract cụ thể để xác minh.

## Với QA/CI

Verification có thể chạy ở nhiều nơi:

```text
Local dashboard
Claude Code browser
Headless CLI
CI pipeline
Recorded evidence
```

---

# 13. Những điểm hay nhất của workshop

## 13.1. Không xem prompt là lệnh một chiều

Thay vì:

```text
Tôi ra lệnh, Claude làm.
```

Workshop hướng tới:

```text
Claude phỏng vấn, làm rõ, đề xuất, rồi mới build.
```

Đây là cách làm phù hợp hơn với agent mạnh.

## 13.2. HTML là spec giàu thông tin

HTML không chỉ là output, mà có thể trở thành:

```text
Spec
Prototype
Design exploration
Feedback surface
Verification surface
```

## 13.3. Verification phải nằm trong artifact

Thay vì test nằm tách biệt hoàn toàn, artifact nên tự expose trạng thái để agent có thể kiểm tra.

Đây là điểm rất quan trọng cho tương lai agentic development.

## 13.4. Agent không chỉ code, mà còn verify

Claude Code được dùng không chỉ để tạo code, mà còn để:

```text
đọc DOM contract,
chạy Playwright,
phát hiện invariant fail,
giải thích lỗi,
đề xuất sửa.
```

---

# 14. Những giới hạn / lưu ý được nhắc tới

## HTML spec có tốn token hơn không?

Workshop trả lời rằng có thể một lần sinh HTML sẽ tốn nhiều token hơn Markdown, nhưng về dài hạn có thể tiết kiệm hơn vì:

* ít hiểu nhầm hơn,
* feedback nhanh hơn,
* giảm số vòng sửa,
* dễ nhìn và xác nhận hơn.

## Sonnet hay Opus?

Người trình bày khuyến nghị dùng **Opus 4.7** cho workflow này, nhất là khi có vision/screenshot/frontend verification. Theo transcript, Opus 4.7 có vision model tốt hơn và phù hợp hơn với dạng workflow này. 

## Verification không thay thế toàn bộ testing

Workshop không nói bỏ test truyền thống. Thay vào đó, verification là lớp bổ sung giúp agent/human xác nhận artifact theo cách trực quan và contract-driven hơn.

---

# 15. Checklist áp dụng vào project của bạn

Nếu bạn muốn áp dụng workshop này vào dự án thật, có thể bắt đầu theo checklist sau.

## Giai đoạn requirement

```text
[ ] Viết prompt yêu cầu Claude phỏng vấn trước khi build
[ ] Xác định audience chính
[ ] Xác định use case chính
[ ] Xác định out-of-scope
[ ] Xác định edge cases
[ ] Xác định success criteria
```

## Giai đoạn design

```text
[ ] Yêu cầu Claude tạo 3-5 HTML design directions
[ ] Mỗi direction có style riêng
[ ] Có mock data đủ thật
[ ] Có responsive layout cơ bản
[ ] User feedback bằng screenshot
[ ] Chốt 1 direction hoặc remix nhiều direction
```

## Giai đoạn implementation

```text
[ ] Component có data-testid hoặc data-verify-unit
[ ] State quan trọng được emit ra DOM
[ ] Có fixture cho các trạng thái chính
[ ] Có invariant cho logic nghiệp vụ
[ ] Có probe cho happy path và edge path
```

## Giai đoạn verification

```text
[ ] Có dashboard human-readable
[ ] Có script headless verify
[ ] Có Playwright/MCP để agent chạy browser verification
[ ] Có output pass/fail rõ
[ ] Có recording evidence nếu cần review
```

---

# 16. Tóm tắt ngắn gọn

Workshop này dạy 3 tư duy chính:

```text
1. Đừng tự viết requirement quá cứng ngay từ đầu.
   Hãy để Claude phỏng vấn bạn để làm rõ yêu cầu.

2. Đừng chỉ dùng Markdown spec dài.
   Hãy dùng HTML artifact để mô tả sản phẩm trực quan hơn.

3. Đừng chỉ để con người kiểm tra bằng mắt.
   Hãy gắn verification contract vào artifact để agent, human và CI đều kiểm tra được.
```

Một câu cô đọng nhất:

> Claude Code hiệu quả hơn khi bạn biến quá trình làm phần mềm thành một vòng lặp gồm phỏng vấn yêu cầu, tạo HTML artifact, và xác minh bằng contract mà agent có thể tự đọc/chạy.
