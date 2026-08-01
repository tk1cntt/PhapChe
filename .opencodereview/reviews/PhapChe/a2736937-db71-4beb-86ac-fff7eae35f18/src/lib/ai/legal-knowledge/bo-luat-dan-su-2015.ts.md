# Review: `src/lib/ai/legal-knowledge/bo-luat-dan-su-2015.ts`

**Project:** PhapChe | **Review:** `a2736937-db71-4beb-86ac-fff7eae35f18`

**Comments:** 2

---

## 🔴 Critical (1)

**🐛 Bug** · lines 34-38

**Điều 5 is misattributed — wrong article number for thời hiệu (statute of limitations).**

The actual Điều 5 of the Bộ luật Dân sự 2015 is "Tôn trọng lợi ích quốc gia, dân tộc, lợi ích công cộng, quyền và lợi ích hợp pháp của người khác" (Respecting national/ethnic interests, public interests, and legal rights of others). The statute of limitations provisions are governed by Điều 149–Điều 157, not Điều 5. Furthermore, the 30-year/10-year prescriptive periods for immovable/movable property are from Điều 236 (acquisitive prescription/usucapion), not the general thời hiệu section. The 3-year limitation periods for contract disputes and non-contractual damages are correct but belong to Điều 429 and Điều 588 respectively.

This misattribution can cause the RAG system to cite the wrong legal article, leading to incorrect legal advice.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
        {
          number: 'Điều 5',
          title: 'Tôn trọng lợi ích quốc gia, dân tộc, lợi ích công cộng, quyền và lợi ích hợp pháp của người khác',
          content: 'Cá nhân, pháp nhân khi xác lập, thực hiện, chấm dứt quyền, nghĩa vụ dân sự của mình phải tôn trọng lợi ích quốc gia, dân tộc, lợi ích công cộng, quyền và lợi ích hợp pháp của người khác.',
        },
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
        {
          number: 'Điều 5',
          title: 'Thời hiệu',
          content: 'Thời hiệu là thời hạn do luật quy định mà khi kết thúc thời hạn đó thì phát sinh hậu quả pháp lý đối với chủ thể theo điều kiện do luật quy định. Thời hiệu hưởng quyền dân sự: 30 năm đối với bất động sản, 10 năm đối với động sản. Thời hiệu khởi kiện hợp đồng: 03 năm. Thời hiệu khởi kiện bồi thường thiệt hại ngoài hợp đồng: 03 năm.',
        },
```
</details>


## 🟡 Medium (1)

**🐛 Bug** · lines 16-20

**Missing thời hiệu articles in the knowledge base.**

The current file lacks any articles from the thời hiệu section (Điều 149–Điều 157), which is critical for the litigation-legal domain. For example, Điều 149 defines thời hiệu, Điều 150 lists types of thời hiệu, and Điều 154–157 cover commencement, interruption, and restart. Consider adding a dedicated chapter for thời hiệu provisions, or at minimum include Điều 149 (definition) and Điều 429 (contract limitation period: 3 years) and Điều 588 (non-contractual damages: 3 years) in the appropriate chapters.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    {
      title: 'Chương I — Những quy định chung',
      articles: [
        {
          number: 'Điều 2',
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    {
      title: 'Chương I — Những quy định chung',
      articles: [
        {
          number: 'Điều 2',
```
</details>


