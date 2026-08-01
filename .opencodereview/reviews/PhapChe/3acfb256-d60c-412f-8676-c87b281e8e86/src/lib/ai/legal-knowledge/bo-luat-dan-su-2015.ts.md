# Review: `src/lib/ai/legal-knowledge/bo-luat-dan-su-2015.ts`

**Project:** PhapChe | **Review:** `3acfb256-d60c-412f-8676-c87b281e8e86`

**Comments:** 7

---

## 🟠 High (1)

**🐛 Bug** · lines 35-37

Data Integrity: Điều 5 content incorrectly merges general statute-of-limitations principles (from the actual Article 5) with specific limitation periods for contract claims (03 năm) and non-contractual tort claims (03 năm), which in the actual Bộ luật Dân sự 2015 are located in separate articles (Article 4(2)(b) for contractual claims via Luật Thương mại context, and Article 588 for non-contractual torts). This blending of provisions under a single article number could cause the AI to misattribute legal rules and provide inaccurate citations. The content should either be split into separate articles or clearly indicate it is a consolidated summary.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
          number: 'Điều 5',
          title: 'Thời hiệu',
          content: 'Thời hiệu là thời hạn do luật quy định mà khi kết thúc thời hạn đó thì phát sinh hậu quả pháp lý đối với chủ thể theo điều kiện do luật quy định. Tòa án chỉ áp dụng quy định về thời hiệu đối với yêu cầu áp dụng thời hiệu của một bên hoặc các bên với điều kiện yêu cầu này phải được đưa ra trước khi Tòa án cấp sơ thẩm ra bản án, quyết định giải quyết vụ việc.',
        },
        {
          number: 'Điều 5 (tóm tắt mở rộng)',
          title: 'Các thời hiệu khởi kiện quan trong',
          content: 'Thời hiệu hưởng quyền dân sự: 30 năm đối với bất động sản, 10 năm đối với động sản (Điều 236, 237). Thời hiệu khởi kiện hợp đồng: 03 năm (Điều 4 - Luật Thương mại 2005 áp dụng bổ sung). Thời hiệu khởi kiện bồi thường thiệt hại ngoài hợp đồng: 03 năm (Điều 588).',
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
          number: 'Điều 5',
          title: 'Thời hiệu',
          content: 'Thời hiệu là thời hạn do luật quy định mà khi kết thúc thời hạn đó thì phát sinh hậu quả pháp lý đối với chủ thể theo điều kiện do luật quy định. Thời hiệu hưởng quyền dân sự: 30 năm đối với bất động sản, 10 năm đối với động sản. Thời hiệu khởi kiện hợp đồng: 03 năm. Thời hiệu khởi kiện bồi thường thiệt hại ngoài hợp đồng: 03 năm.',
```
</details>


## 🟡 Medium (5)

**🔧 Maintainability** · lines 10-14

Missing temporal metadata: The document lacks `effectiveDate`, `lastUpdated`, or `deprecated` fields. In a legal knowledge base, provisions may be amended or repealed over time. Without temporal validity metadata, there is no mechanism to detect stale/outdated provisions. The `LegalKnowledgeDoc` type does not currently include these fields, but the data should at minimum carry a comment indicating the document reflects the law as originally enacted in 2015 without subsequent amendments.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
export const boLuatDanSu2015: LegalKnowledgeDoc = {
  id: 'bo-luat-dan-su-2015',
  source: 'Bộ luật Dân sự 2015 (Số 91/2015/QH13)',
  /**
   * NOTE: This document reflects selected provisions as enacted in 2015.
   * No amendments are incorporated. Verify against current law before
   * relying on specific provisions in legal advice.
   */
  domainTags: ['commercial-legal', 'corporate-legal', 'litigation-legal'],
  version: '2015',
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export const boLuatDanSu2015: LegalKnowledgeDoc = {
  id: 'bo-luat-dan-su-2015',
  source: 'Bộ luật Dân sự 2015 (Số 91/2015/QH13)',
  domainTags: ['commercial-legal', 'corporate-legal', 'litigation-legal'],
  version: '2015',
```
</details>

---

**🐛 Bug** · lines 115-117

Data Integrity: Điều 418 (Phạt vi phạm) omits the 8% penalty cap applicable to commercial contracts under Article 301 of Luật Thương mại 2005. Since this document is tagged with 'commercial-legal' and is expected to be used for commercial contract analysis, the absence of this critical limitation could lead the AI to incorrectly advise that parties have unlimited freedom to set penalty amounts in commercial contexts.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
          number: 'Điều 418',
          title: 'Phạt vi phạm',
          content: 'Phạt vi phạm là sự thỏa thuận giữa các bên trong hợp đồng, theo đó bên vi phạm nghĩa vụ phải nộp một khoản tiền cho bên bị vi phạm. Mức phạt vi phạm do các bên thỏa thuận, trừ trường hợp luật liên quan có quy định khác. Lưu ý: Đối với hợp đồng thương mại, Điều 301 Luật Thương mại 2005 giới hạn mức phạt không quá 8% giá trị phần nghĩa vụ hợp đồng bị vi phạm.',
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
          number: 'Điều 418',
          title: 'Phạt vi phạm',
          content: 'Phạt vi phạm là sự thỏa thuận giữa các bên trong hợp đồng, theo đó bên vi phạm nghĩa vụ phải nộp một khoản tiền cho bên bị vi phạm. Mức phạt vi phạm do các bên thỏa thuận, trừ trường hợp luật liên quan có quy định khác.',
```
</details>

---

**🐛 Bug** · lines 19-22

Data Integrity: Điều 2 title and content appear to be misattributed. In the actual Bộ luật Dân sự 2015, the article titled 'Đối tượng điều chỉnh' is Article 1, not Article 2. Article 2 is titled 'Công nhận, tôn trọng, bảo vệ và bảo đảm quyền dân sự'. This misnumbering could cause AI-generated citations to reference the wrong article number, undermining the credibility of legal analysis.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
        {
          number: 'Điều 1',
          title: 'Phạm vi điều chỉnh',
          content: 'Bộ luật Dân sự quy định địa vị pháp lý, chuẩn mực pháp lý về cách ứng xử của cá nhân, pháp nhân; quyền, nghĩa vụ về nhân thân và tài sản của cá nhân, pháp nhân trong các quan hệ được hình thành trên cơ sở bình đẳng, tự do ý chí, độc lập về tài sản và tự chịu trách nhiệm.',
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
        {
          number: 'Điều 2',
          title: 'Đối tượng điều chỉnh',
          content: 'Bộ luật Dân sự quy định địa vị pháp lý, chuẩn mực pháp lý về cách ứng xử của cá nhân, pháp nhân; quyền, nghĩa vụ về nhân thân và tài sản của cá nhân, pháp nhân trong các quan hệ được hình thành trên cơ sở bình đẳng, tự do ý chí, độc lập về tài sản và tự chịu trách nhiệm.',
```
</details>

---

**🐛 Bug** · lines 25-27

Data Integrity: Điều 3 content is an amalgamation. The actual Article 3 of BLDS 2015 lists 5 principles separately across 5 clauses (Khoản 1-5). The content here compresses them into a single string with numeric prefixes, which is a reasonable summarization, but the original Article 3 does not literally use the phrase 'Bình đẳng, tự do, tự nguyện cam kết, thỏa thuận' as a single clause — the actual text is more detailed. While this is a minor fidelity issue compared to the Điều 2/Điều 5 problems, it's worth noting that the content is a paraphrase, not the verbatim article text.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
          number: 'Điều 3',
          title: 'Nguyên tắc cơ bản của pháp luật dân sự',
          content: '1. Cá nhân, pháp nhân đều bình đẳng, không được lấy bất kỳ lý do nào để phân biệt đối xử. 2. Cá nhân, pháp nhân tự do, tự nguyện cam kết, thỏa thuận. 3. Cá nhân, pháp nhân phải tự chịu trách nhiệm về việc không thực hiện hoặc thực hiện không đúng nghĩa vụ dân sự. 4. Thiện chí, trung thực. 5. Tôn trọng lợi ích quốc gia, dân tộc, lợi ích công cộng, quyền và lợi ích hợp pháp của người khác. 6. Tôn trọng, bảo vệ quyền dân sự.',
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
          number: 'Điều 3',
          title: 'Nguyên tắc cơ bản của pháp luật dân sự',
          content: '1. Bình đẳng, tự do, tự nguyện cam kết, thỏa thuận. 2. Cá nhân, pháp nhân phải tự chịu trách nhiệm về việc không thực hiện hoặc thực hiện không đúng nghĩa vụ dân sự. 3. Thiện chí, trung thực. 4. Tôn trọng lợi ích quốc gia, dân tộc, lợi ích công cộng, quyền và lợi ích hợp pháp của người khác. 5. Tôn trọng, bảo vệ quyền dân sự.',
```
</details>

---

**🔧 Maintainability** · lines 171-180

Thin chapter: 'Chương XXIII — Chuyển giao quyền yêu cầu và chuyển giao nghĩa vụ' contains only one article (Điều 365 — Chuyển giao quyền yêu cầu). The chapter title mentions both assignment of rights AND assignment of obligations, but the companion article for assignment of obligations (Điều 370 — Chuyển giao nghĩa vụ) is missing. This asymmetry could cause the AI to lack knowledge about assignment-of-obligation rules, which are important for corporate transactions and M&A scenarios (a core use case for the 'corporate-legal' domain tag).

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    {
      title: 'Chương XXIII — Chuyển giao quyền yêu cầu và chuyển giao nghĩa vụ',
      articles: [
        {
          number: 'Điều 365',
          title: 'Chuyển giao quyền yêu cầu',
          content: 'Bên có quyền yêu cầu thực hiện nghĩa vụ có thể chuyển giao quyền yêu cầu đó cho người thế quyền, trừ trường hợp quyền yêu cầu gắn liền với nhân thân hoặc các bên có thỏa thuận không được chuyển giao. Việc chuyển giao quyền yêu cầu không cần có sự đồng ý của bên có nghĩa vụ.',
        },
        {
          number: 'Điều 370',
          title: 'Chuyển giao nghĩa vụ',
          content: 'Bên có nghĩa vụ có thể chuyển giao nghĩa vụ cho người thế nghĩa vụ nếu được bên có quyền đồng ý, trừ trường hợp nghĩa vụ gắn liền với nhân thân hoặc pháp luật có quy định không được chuyển giao nghĩa vụ.',
        },
      ],
    },
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    {
      title: 'Chương XXIII — Chuyển giao quyền yêu cầu và chuyển giao nghĩa vụ',
      articles: [
        {
          number: 'Điều 365',
          title: 'Chuyển giao quyền yêu cầu',
          content: 'Bên có quyền yêu cầu thực hiện nghĩa vụ có thể chuyển giao quyền yêu cầu đó cho người thế quyền, trừ trường hợp quyền yêu cầu gắn liền với nhân thân hoặc các bên có thỏa thuận không được chuyển giao. Việc chuyển giao quyền yêu cầu không cần có sự đồng ý của bên có nghĩa vụ.',
        },
      ],
    },
```
</details>


## 🔵 Low (1)

**🔧 Maintainability** · lines 16-17

Chapter ordering inconsistency: Chapter numbering jumps non-sequentially (I → VII → XVI → XX → XXI → XXIII → XXVII → XXIX). While this is acceptable for a curated excerpt, the gaps are large and unexplained. Adding a brief comment explaining that only selected core chapters are included would help future maintainers understand that omissions are intentional rather than accidental.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    // NOTE: Only key civil/commercial chapters are included below.
    // Gaps between chapter numbers represent omitted chapters.
    {
      title: 'Chương I — Những quy định chung',
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    {
      title: 'Chương I — Những quy định chung',
```
</details>


