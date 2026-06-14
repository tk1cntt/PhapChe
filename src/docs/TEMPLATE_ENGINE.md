# Template Engine Pattern

**Purpose:** Document template rendering with variable substitution

**Last Updated:** 2026-06-14

---

## Overview

Templates use a simple `{{variable}}` syntax for dynamic content. The engine merges data at render time, producing final documents.

## Syntax

### Variable Substitution

```txt
{{variable_name}}
```

### Nested Variables

```txt
{{company.name}}
{{contact.email}}
{{request.priority}}
```

### Conditional Blocks

```txt
{{#if urgent}}
CÓ KHẨN CẤP
{{/if}}
```

### List Iteration

```txt
{{#each employees}}
- {{name}} ({{position}})
{{/each}}
```

### Filters/Transforms

```txt
{{name uppercase}}
{{date format="DD/MM/YYYY"}}
{{amount currency="VND"}}
```

## Example Templates

### Employment Contract

```txt
CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
Độc lập - Tự do - Hạnh phúc

HỢP ĐỒNG LAO ĐỘNG
Số: {{contract_number}}

BÊN A: {{company_name}}
Mã số thuế: {{tax_code}}
Địa chỉ: {{company_address}}
Đại diện: {{company_representative}}
Chức vụ: {{company_representative_title}}

BÊN B: {{employee_name}}
Ngày sinh: {{employee_dob}}
CMND/CCCD: {{employee_id_number}}
Địa chỉ: {{employee_address}}
Số điện thoại: {{employee_phone}}
Email: {{employee_email}}

Điều 1: Nội dung công việc
Bên A thuê Bên B làm việc với chức danh: {{job_title}}
Bộ phận: {{department}}
Địa điểm làm việc: {{work_location}}

Điều 2: Thời hạn hợp đồng
Hợp đồng có hiệu lực từ ngày: {{start_date}}
Đến ngày: {{end_date}}
Loại hợp đồng: {{contract_type}}

Điều 3: Chế độ làm việc
Thời gian làm việc: {{work_schedule}}
Ngày nghỉ: {{working_days}}

Điều 4: Mức lương và phương thức thanh toán
Lương cơ bản: {{base_salary}} VNĐ
Phụ cấp: {{allowances}} VNĐ
Thưởng: {{bonus}} VNĐ
Tổng thu nhập: {{total_salary}} VNĐ
```

### NDA (Non-Disclosure Agreement)

```txt
THỎA THUẬN BẢO MẬT
Số: {{agreement_number}}

BÊN TIẾT LỘ: {{disclosing_party}}
Địa chỉ: {{disclosing_address}}

BÊN NHẬN THÔNG TIN: {{receiving_party}}
Địa chỉ: {{receiving_address}}

Điều 1: Mục đích
Thông tin được tiết lộ chỉ nhằm mục đích: {{purpose}}

Điều 2: Thông tin bí mật
{{#if confidential_data}}
- Thông tin tài chính: {{financial_info}}
- Thông tin kỹ thuật: {{technical_info}}
- Thông tin kinh doanh: {{business_info}}
{{/if}}

Điều 3: Nghĩa vụ bảo mật
Thời hạn bảo mật: {{confidentiality_period}}
{{#if penalties}}
Tiền phạt vi phạm: {{penalty_amount}}
{{/if}}

Ngày ký: {{signing_date}}
```

## Template Engine API

```typescript
interface TemplateEngine {
  // Render a template with data
  render(
    template: string,
    data: Record<string, unknown>
  ): Promise<string>;

  // Validate template syntax
  validate(template: string): ValidationResult;

  // Get available variables from template
  getVariables(template: string): string[];
}

interface TemplateDefinition {
  id: string;
  code: string;           // "employment_contract", "nda_standard"
  name: string;
  content: string;
  variables: VariableDefinition[];
  version: number;
  status: TemplateStatus;
  createdAt: Date;
  updatedAt: Date;
}

interface VariableDefinition {
  key: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'array' | 'object';
  required: boolean;
  defaultValue?: unknown;
  validation?: ValidationRule[];
}
```

## Usage Example

```typescript
import { renderTemplate } from '@/lib/templates/engine';

const template = `Kính gửi {{recipient_name}},
Chúng tôi xin thông báo về yêu cầu {{request_code}}.
Trạng thái: {{status_name}}.
{{#if deadline}}
Hạn xử lý: {{deadline}}
{{/if}}`;

const data = {
  recipient_name: 'Nguyễn Văn A',
  request_code: 'LR-2024-001',
  status_name: 'Đang xử lý',
  deadline: '2024-12-31'
};

const result = await renderTemplate(template, data);
// Output:
// Kính gửi Nguyễn Văn A,
// Chúng tôi xin thông báo về yêu cầu LR-2024-001.
// Trạng thái: Đang xử lý.
// Hạn xử lý: 2024-12-31
```

## Variable Types

| Type | Example | Description |
|------|---------|-------------|
| string | `{{name}}` | Plain text |
| number | `{{amount}}` | Numeric value |
| date | `{{date format="DD/MM/YYYY"}}` | Date with format |
| boolean | `{{#if urgent}}...{{/if}}` | Conditional |
| array | `{{#each items}}...{{/each}}` | List iteration |
| object | `{{company.name}}` | Nested property |

## Common Filters

| Filter | Example | Output |
|--------|---------|--------|
| uppercase | `{{name uppercase}}` | NAME IN CAPS |
| lowercase | `{{email lowercase}}` | email@lowercase.com |
| capitalize | `{{name capitalize}}` | Name Capitalized |
| date | `{{created_at date="DD/MM/YYYY"}}` | 31/12/2024 |
| currency | `{{amount currency="VND"}}` | 10.000.000 VND |
| truncate | `{{description truncate=50}}` | First 50 chars... |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/templates | List all templates |
| GET | /api/templates/:code | Get template by code |
| POST | /api/templates | Create new template |
| PUT | /api/templates/:id | Update template |
| POST | /api/templates/:id/render | Render template with data |
| GET | /api/templates/:id/preview | Preview rendered template |

---

*Document: TEMPLATE_ENGINE.md*
*Part of: Phase 55 - Architecture Standards*
