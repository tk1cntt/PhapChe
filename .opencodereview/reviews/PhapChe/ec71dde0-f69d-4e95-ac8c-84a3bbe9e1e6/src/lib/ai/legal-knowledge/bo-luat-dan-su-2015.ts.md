# Review: `src/lib/ai/legal-knowledge/bo-luat-dan-su-2015.ts`

**Project:** PhapChe | **Review:** `ec71dde0-f69d-4e95-ac8c-84a3bbe9e1e6`

**Comments:** 6

---

## 🔴 Critical (2)

**🐛 Bug**

Điều 5 is incorrectly titled "Thời hiệu" and its content aggregates multiple distinct articles from the actual Civil Code 2015: the definition of thời hiệu (actual Điều 149), thời hiệu hưởng quyền dân sự (actual Điều 236), and thời hiệu khởi kiện (actual Điều 429). This is a composite article that does not correspond to any single real article in the Civil Code. In the actual 2015 Civil Code, Điều 5 is about "Tập quán" (customs). If this knowledge document is used for RAG-based legal retrieval, it will produce incorrect article citations, potentially leading to wrong legal advice.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
          // TODO: Split into separate articles matching the actual Civil Code:
          // - Điều 149: Thời hiệu (definition)
          // - Điều 236: Thời hiệu hưởng quyền dân sự
          // - Điều 429: Thời hiệu khởi kiện về hợp đồng
          // - Điều 588: Thời hiệu khởi kiện về bồi thường thiệt hại ngoài hợp đồng
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
          number: 'Điều 5',
          title: 'Thời hiệu',
          content: 'Thời hiệu là thời hạn do luật quy định mà khi kết thúc thời hạn đó thì phát sinh hậu quả pháp lý đối với chủ thể theo điều kiện do luật quy định. Thời hiệu hưởng quyền dân sự: 30 năm đối với bất động sản, 10 năm đối với động sản. Thời hiệu khởi kiện hợp đồng: 03 năm. Thời hiệu khởi kiện bồi thường thiệt hại ngoài hợp đồng: 03 năm.'
```
</details>

---

**🐛 Bug**

Điều 2 is incorrectly titled "Đối tượng điều chỉnh" and contains content that corresponds to Điều 1 (Phạm vi điều chỉnh) of the actual Civil Code 2015. In the real Civil Code 2015, Điều 2 is "Công nhận, tôn trọng, bảo vệ và bảo đảm quyền dân sự." This means the RAG system will cite "Điều 2" when the content actually belongs to "Điều 1", producing legally incorrect citations.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
          // Actual Civil Code: Điều 1 = "Phạm vi điều chỉnh", Điều 2 = "Công nhận, tôn trọng, bảo vệ và bảo đảm quyền dân sự"
          // This content is Điều 1, not Điều 2. The title should be "Phạm vi điều chỉnh" and number "Điều 1".
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
          number: 'Điều 2',
          title: 'Đối tượng điều chỉnh',
          content: 'Bộ luật Dân sự quy định địa vị pháp lý, chuẩn mực pháp lý về cách ứng xử của cá nhân, pháp nhân; quyền, nghĩa vụ về nhân thân và tài sản của cá nhân, pháp nhân trong các quan hệ được hình thành trên cơ sở bình đẳng, tự do ý chí, độc lập về tài sản và tự chịu trách nhiệm.'
```
</details>


## 🟠 High (3)

**🐛 Bug** · lines 55-57

The article content entries appear to be condensed summaries/paraphrases rather than the verbatim full text of the Civil Code articles. The `LegalArticle.content` type definition explicitly states "Full article content (plain Vietnamese text)", but these entries omit critical details, sub-clauses, and precise legal language from the official law. For example, Điều 117 in the actual Civil Code contains detailed sub-clauses with specific legal terminology that is not fully captured here. This discrepancy could lead to incorrect legal advice when the content is used in RAG retrieval.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
          number: 'Điều 117',
          title: 'Điều kiện có hiệu lực của giao dịch dân sự',
          content: '1. Giao dịch dân sự có hiệu lực khi có đủ các điều kiện sau đây: a) Chủ thể có năng lực pháp luật dân sự, năng lực hành vi dân sự phù hợp với giao dịch dân sự được xác lập; b) Chủ thể tham gia giao dịch dân sự hoàn toàn tự nguyện; c) Mục đích và nội dung của giao dịch dân sự không vi phạm điều cấm của luật, không trái đạo đức xã hội. 2. Hình thức của giao dịch dân sự là điều kiện có hiệu lực của giao dịch dân sự trong trường hợp luật có quy định.'
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
          number: 'Điều 117',
          title: 'Điều kiện có hiệu lực của giao dịch dân sự',
          content: 'Giao dịch dân sự có hiệu lực khi có đủ các điều kiện: a) Chủ thể có năng lực pháp luật dân sự, năng lực hành vi dân sự phù hợp với giao dịch dân sự được xác lập; b) Chủ thể tham gia giao dịch hoàn toàn tự nguyện; c) Mục đích và nội dung của giao dịch không vi phạm điều cấm của luật, không trái đạo đức xã hội. Hình thức của giao dịch dân sự là điều kiện có hiệu lực trong trường hợp luật có quy định.',
```
</details>

---

**🐛 Bug**

Điều 4 is titled "Nguồn của pháp luật dân sự" (Sources of Civil Law), but this title does not match any article in the actual Civil Code 2015. The actual title of Điều 4 is "Áp dụng Bộ luật dân sự" (Application of the Civil Code). The content listed here combines provisions from multiple articles (Điều 4, 5, 6, and Resolution 03/2015/NQ-HĐTP on án lệ). Using an incorrect article title and number for legal retrieval will cause citation errors.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
          // Actual Điều 4 title is "Áp dụng Bộ luật dân sự"
          // Sources are distributed across Điều 4 (BLDS), Điều 5 (tập quán), Điều 6 (tương tự pháp luật, lẽ công bằng)
          // Án lệ is governed by Nghị quyết 03/2015/NQ-HĐTP, not a specific article of the Civil Code
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
          number: 'Điều 4',
          title: 'Nguồn của pháp luật dân sự',
          content: '1. Bộ luật Dân sự, các luật khác có liên quan. 2. Điều ước quốc tế mà Việt Nam là thành viên. 3. Tập quán có giá trị áp dụng. 4. Án lệ. 5. Lẽ công bằng.'
```
</details>

---

**🐛 Bug**

Điều 6 is titled "Nguyên tắc thực hiện quyền dân sự", but in the actual Civil Code 2015, Điều 6 is "Áp dụng tương tự pháp luật" (Application of analogy of law). The content listed here appears to be a paraphrase of principles from Điều 3 (Nguyên tắc cơ bản) and Điều 10 (Giới hạn của việc thực hiện quyền dân sự). This misattribution means the RAG system will cite the wrong article number when retrieving this content, potentially misleading legal professionals who rely on accurate citations.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
          // Actual Điều 6 is "Áp dụng tương tự pháp luật"
          // The content here corresponds to principles in Điều 3 and Điều 10
          // Consider: create a separate article entry for Điều 10 (Giới hạn thực hiện quyền dân sự)
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
          number: 'Điều 6',
          title: 'Nguyên tắc thực hiện quyền dân sự',
          content: 'Cá nhân, pháp nhân thực hiện quyền dân sự theo ý chí của mình, không được trái với điều cấm của luật, không trái đạo đức xã hội. Việc thực hiện quyền dân sự không được xâm phạm đến lợi ích quốc gia, dân tộc, quyền và lợi ích hợp pháp của người khác.'
```
</details>


## 🟡 Medium (1)

**🔧 Maintainability** · lines 16-18

The chapters are not ordered by their position in the Civil Code structure. The current order is: Chương I (Điều 2-6), Chương VII (Điều 116-131), Chương XVI (Điều 385-422), Chương XX (Điều 584-597), Chương XXI (Điều 275-352), Chương XXIII (Điều 365), Chương XXVII (Điều 74-87), Chương XXIX (Điều 158-175). The correct order by the Civil Code's Part/Chapter structure would start with Chương I → Chương XXVII (Pháp nhân) → Chương VII (Giao dịch) → Chương XXIX (Sở hữu) → Chương XXI (Nghĩa vụ) → Chương XXIII → Chương XVI (Hợp đồng) → Chương XX. This makes the file difficult to navigate and maintain, especially as more articles are added.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    // Chapters should be ordered by their position in the Civil Code structure:
    // Part 1: General (Chương I–XII, Điều 1–157)
    // Part 2: Ownership (Chương XIII–XV, Điều 158–273)
    // Part 3: Obligations & Contracts (Chương XVI–XXIII, Điều 274–608)
    {
      title: 'Chương I — Những quy định chung',
      articles: [
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    {
      title: 'Chương I — Những quy định chung',
      articles: [
```
</details>


