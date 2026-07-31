# Review: `src/lib/ai/legal-knowledge/luat-doanh-nghiep-2020.ts`

**Project:** PhapChe | **Review:** `ec71dde0-f69d-4e95-ac8c-84a3bbe9e1e6`

**Comments:** 3

---

## 🔴 Critical (1)

**🐛 Bug** · lines 146-162

Chapter numbering is incorrect and swapped. In Luật Doanh nghiệp 2020, 'Nhóm công ty' is Chương VIII (Điều 195-200) and 'Tổ chức lại, giải thể và phá sản doanh nghiệp' is Chương IX (Điều 201-...). The file currently labels 'Giải thể doanh nghiệp' as Chương VIII and 'Nhóm công ty' as Chương IX, which is the reverse of the actual law. This will cause incorrect chapter attribution in downstream AI responses.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    {
      title: 'Chương VIII — Nhóm công ty',
      articles: [
        {
          number: 'Điều 195',
          title: 'Công ty mẹ — công ty con',
          content: 'Một công ty được coi là công ty mẹ của công ty khác nếu thuộc một trong các trường hợp: sở hữu trên 50% vốn điều lệ hoặc tổng số cổ phần phổ thông; có quyền trực tiếp hoặc gián tiếp bổ nhiệm đa số hoặc tất cả thành viên HĐQT, Giám đốc; có quyền quyết định việc sửa đổi, bổ sung Điều lệ.',
        },
      ],
    },
    {
      title: 'Chương IX — Tổ chức lại, giải thể và phá sản doanh nghiệp',
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    {
      title: 'Chương VIII — Giải thể doanh nghiệp',
      articles: [
        {
          number: 'Điều 207',
          title: 'Các trường hợp giải thể doanh nghiệp',
          content: '1. Kết thúc thời hạn hoạt động đã ghi trong Điều lệ công ty. 2. Theo quyết định của chủ doanh nghiệp. 3. Công ty không còn đủ số lượng thành viên tối thiểu trong 06 tháng liên tục. 4. Bị thu hồi Giấy chứng nhận đăng ký doanh nghiệp.',
        },
        {
          number: 'Điều 208',
          title: 'Thủ tục giải thể doanh nghiệp',
          content: '1. Thông qua quyết định giải thể. 2. Thanh lý tài sản và thanh toán các khoản nợ. 3. Thông báo cho Cơ quan đăng ký kinh doanh trong 07 ngày làm việc. 4. Nộp hồ sơ giải thể trong 05 ngày làm việc sau khi thanh toán hết nợ. Thời gian giải thể không quá 180 ngày.',
        },
      ],
    },
    {
      title: 'Chương IX — Nhóm công ty',
```
</details>


## 🟠 High (1)

**🐛 Bug**

Incorrect article number for board member eligibility conditions. In the actual Luật Doanh nghiệp 2020, the conditions for becoming a board member ('điều kiện trở thành thành viên HĐQT') are specified in Điều 155 ('Tiêu chuẩn và điều kiện của thành viên Hội đồng quản trị'), not Điều 148. Điều 148 actually covers 'Miễn nhiệm, bãi nhiệm thành viên Hội đồng quản trị' (removal/dismissal of board members). This misattribution could cause the AI to cite the wrong legal article when advising on board member qualifications.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
        {
          number: 'Điều 155',
          title: 'Tiêu chuẩn và điều kiện của thành viên HĐQT',
          content: 'Thành viên Hội đồng quản trị phải có đủ năng lực hành vi dân sự, không thuộc đối tượng bị cấm quản lý doanh nghiệp, có trình độ chuyên môn và kinh nghiệm trong quản trị kinh doanh. Thành viên độc lập phải đáp ứng thêm các điều kiện riêng.',
        }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
        {
          number: 'Điều 148',
          title: 'Điều kiện trở thành thành viên HĐQT',
          content: 'Thành viên Hội đồng quản trị phải có đủ năng lực hành vi dân sự, không thuộc đối tượng bị cấm quản lý doanh nghiệp, có trình độ chuyên môn và kinh nghiệm trong quản trị kinh doanh. Thành viên độc lập phải đáp ứng thêm các điều kiện riêng.',
        }
```
</details>


## 🔵 Low (1)

**🔧 Maintainability** · line 147

Chương title for dissolution is incomplete. The actual law chapter is titled 'Tổ chức lại, giải thể và phá sản doanh nghiệp' (Reorganization, Dissolution, and Bankruptcy of Enterprises). The current title only mentions dissolution, omitting reorganization and bankruptcy — which may mislead the AI into thinking the chapter covers only dissolution.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
      title: 'Chương IX — Tổ chức lại, giải thể và phá sản doanh nghiệp',
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
      title: 'Chương VIII — Giải thể doanh nghiệp',
```
</details>


