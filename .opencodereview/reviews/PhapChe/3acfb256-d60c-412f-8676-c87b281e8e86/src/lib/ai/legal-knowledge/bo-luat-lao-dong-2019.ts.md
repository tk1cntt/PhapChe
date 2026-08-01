# Review: `src/lib/ai/legal-knowledge/bo-luat-lao-dong-2019.ts`

**Project:** PhapChe | **Review:** `3acfb256-d60c-412f-8676-c87b281e8e86`

**Comments:** 8

---

## 🟠 High (3)

**🐛 Bug** · lines 85-87

**Incomplete employer termination notice periods**: Article 34 (employee unilateral termination) includes notice periods (45/30/3 days), but Article 36 (employer unilateral termination) omits required notice periods entirely. Under Vietnamese labor law, employers must also provide advance notice (e.g., 45 days for indefinite-term contracts, 30 days for fixed-term 12-36 months, 3 working days for under 12 months per Article 38 of the actual code). This omission could lead the AI to incorrectly advise that employers can terminate without notice.

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
          number: 'Điều 36',
          title: 'Quyền đơn phương chấm dứt hợp đồng của người sử dụng lao động',
          content: 'Người sử dụng lao động có quyền đơn phương chấm dứt hợp đồng lao động trong các trường hợp: a) Người lao động thường xuyên không hoàn thành công việc; b) Người lao động bị ốm đau, tai nạn đã điều trị 12 tháng liên tục đối với hợp đồng không xác định thời hạn, 06 tháng đối với hợp đồng xác định thời hạn mà khả năng lao động chưa hồi phục; c) Do thiên tai, hỏa hoạn, dịch bệnh nguy hiểm, địch họa; d) Người lao động không có mặt tại nơi làm việc sau thời hạn quy định.',
```
</details>

---

****

Employer's grounds for unilateral termination miss a critical case from Article 36: when the employer "changes structure or technology," or "merges, consolidates, splits, or separates" the enterprise leading to redundancy. This is one of the most common grounds for employer-initiated termination. Additionally, the grounds listed omit required notice periods under Article 36 ('ít nhất 45 ngày' for indefinite-term, 'ít nhất 30 ngày' for 12-36 month fixed-term, 'ít nhất 03 ngày làm việc' for under 12 months). These omissions may cause the AI to give dangerously incomplete legal advice.

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
          number: 'Điều 36',
          title: 'Quyền đơn phương chấm dứt hợp đồng của người sử dụng lao động',
          content: 'Người sử dụng lao động có quyền đơn phương chấm dứt hợp đồng lao động trong các trường hợp: a) Người lao động thường xuyên không hoàn thành công việc; b) Người lao động bị ốm đau, tai nạn đã điều trị 12 tháng liên tục đối với hợp đồng không xác định thời hạn, 06 tháng đối với hợp đồng xác định thời hạn mà khả năng lao động chưa hồi phục; c) Do thiên tai, hỏa hoạn, dịch bệnh nguy hiểm, địch họa; d) Người lao động không có mặt tại nơi làm việc sau thời hạn quy định.'
```
</details>

---

**🐛 Bug**

Article 115 text says 'hưởng nguyên lưng' which appears to be a typo for 'hưởng nguyên lương' (receiving full salary). This could confuse the AI's understanding of the provision or cause incorrect output when the text is quoted verbatim.

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
          content: 'Người lao động được nghỉ làm việc, hưởng nguyên lưng trong những ngày lễ, tết: Tết Dương lịch (01 ngày); Tết Âm lịch (05 ngày); Ngày Chiến thắng 30/4 (01 ngày); Ngày Quốc tế lao động 01/5 (01 ngày); Quốc khánh 02/9 (02 ngày); Ngày Giỗ Tổ Hùng Vương 10/3 âm lịch (01 ngày).'
```
</details>


## 🟡 Medium (4)

**🔧 Maintainability**

Hardcoded social insurance contribution rates (employer 21.5%, employee 10.5%) may be outdated. As of 2022, Vietnam adjusted contribution rates with Decision 595/QĐ-BHXH: employer 21.5% is technically correct (BHXH 17.5%, BHYT 3%, BHTN 1%), but employee rate is 10.5% (BHXH 8%, BHYT 1.5%, BHTN 1%). While these rates may still be current, the static nature of this data means any future regulatory change will not be reflected. Consider adding a `effectiveDate` field or annotation indicating when these rates were last verified.

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
          content: 'Người sử dụng lao động, người lao động phải tham gia bảo hiểm xã hội bắt buộc, bảo hiểm y tế, bảo hiểm thất nghiệp. Mức đóng: Người sử dụng lao động đóng 21.5% (BHXH 17.5%, BHYT 3%, BHTN 1%); Người lao động đóng 10.5% (BHXH 8%, BHYT 1.5%, BHTN 1%).'
```
</details>

---

**🔧 Maintainability**

Version field is '2019' but Article 168 social insurance contributions lists BHYT employer rate as 3%, when Decision 595/QD-BHXH (effective from 2017, revised) sets BHYT at 1.5% for employers. This employer BHYT rate appears incorrect -- the 3% rate was from the pre-2018 regime. If the AI relies on this breakdown, it will provide wrong financial guidance.

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
          content: 'Người sử dụng lao động, người lao động phải tham gia bảo hiểm xã hội bắt buộc, bảo hiểm y tế, bảo hiểm thất nghiệp. Mức đóng: Người sử dụng lao động đóng 21.5% (BHXH 17.5%, BHYT 3%, BHTN 1%); Người lao động đóng 10.5% (BHXH 8%, BHYT 1.5%, BHTN 1%).'
```
</details>

---

**🐛 Bug**

Article 25 on probation periods has a loophole: for 'công việc khác' (other work), it states 'không quá 06 ngày làm việc' which is correct per the actual law. However, the law also includes a category 'công việc có chức danh nghề nghiệp cần trình độ đại học trở lên' (not exceeding 60 days) and 'công việc có chức danh nghề nghiệp cần trình độ từ cao đẳng trở lên' is actually the 60-day group. The distinction between 'đại học' and 'cao đẳng' categories matters for accurate advice on probation periods. The content here is ambiguous -- 'từ cao đẳng trở lên' (college and above) would include university graduates, but the law separates these into different tiers.

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
          content: 'Thời gian thử việc do hai bên thỏa thuận căn cứ vào tính chất và mức độ phức tạp của công việc nhưng chỉ được thử việc một lần đối với một công việc và bảo đảm: không quá 180 ngày đối với công việc của người quản lý doanh nghiệp; không quá 60 ngày đối với công việc có chức danh nghề cần trình độ từ cao đẳng trở lên; không quá 30 ngày đối với công việc có chức danh nghề cần trình độ trung cấp, công nhân kỹ thuật, nhân viên nghiệp vụ; không quá 06 ngày làm việc đối với công việc khác.'
```
</details>

---

**🐛 Bug**

Article 125 describes 'Các hình thức xử lý kỷ luật lao động' (forms of labor discipline sanctions). The content states 'Kéo dài thời hạn nâng lương không quá 06 tháng hoặc cách chức.' However, per Article 125(2) of the actual law, 'Kéo dài thời hạn nâng lương không quá 06 tháng' applies specifically to those with salary steps; for those without salary grades, the alternative is 'giáng chức' or 'cách chức' (demotion or dismissal from position). The current text conflates these alternatives with 'hoặc' which could lead to incorrect AI advice about when each applies.

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
          content: '1. Khiển trách. 2. Kéo dài thời hạn nâng lương không quá 06 tháng hoặc cách chức. 3. Sa thải. Khi xử lý kỷ luật lao động phải có sự tham gia của tổ chức đại diện người lao động.'
```
</details>


## 🔵 Low (1)

**🐛 Bug**

Article 115 lists 'Tết Âm lịch (05 ngày)' but the BLLĐ 2019 Article 112(1)(b) itself does not fix Tết holiday at exactly 5 days; it delegates the specific number of days to the Prime Minister's annual decision. The law states '05 ngày' as default, but this can vary by year. Consider adding a note that the actual number may be subject to annual government announcement.

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
          number: 'Điều 115',
          title: 'Nghỉ lễ, tết',
          content: 'Người lao động được nghỉ làm việc, hưởng nguyên lưng trong những ngày lễ, tết: Tết Dương lịch (01 ngày); Tết Âm lịch (05 ngày); Ngày Chiến thắng 30/4 (01 ngày); Ngày Quốc tế lao động 01/5 (01 ngày); Quốc khánh 02/9 (02 ngày); Ngày Giỗ Tổ Hùng Vương 10/3 âm lịch (01 ngày).'
```
</details>


