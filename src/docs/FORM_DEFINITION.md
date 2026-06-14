# Form Definition Pattern

**Purpose:** Document dynamic form schema pattern with database storage

**Last Updated:** 2026-06-14

---

## Overview

Forms are defined as schemas in the database, allowing administrators to create and modify forms without code changes. This enables:
- Dynamic form creation for different request types
- Version control for form definitions
- Runtime form validation

## Schema

### FormDefinition

```typescript
interface FormDefinition {
  id: string;
  code: string;           // "employment_contract", "nda_standard"
  name: string;           // "Hợp đồng lao động"
  description?: string;
  fields: FormField[];
  version: number;
  status: 'draft' | 'published' | 'deprecated';
  createdAt: Date;
  updatedAt: Date;
}
```

### FormField

```typescript
interface FormField {
  key: string;            // "company_name", "employee_email"
  type: FieldType;
  label: string;         // Display label
  labelKey?: string;      // i18n key (e.g., "FormField.company_name")
  placeholder?: string;
  placeholderKey?: string;
  required?: boolean;
  helpText?: string;
  helpTextKey?: string;
  options?: FieldOption[];  // For select, radio, checkbox
  validation?: ValidationRule[];
  dependsOn?: FieldDependency;
  defaultValue?: unknown;
  order: number;         // Display order
}

type FieldType = 
  | 'text'
  | 'number'
  | 'email'
  | 'phone'
  | 'date'
  | 'datetime'
  | 'select'
  | 'multiselect'
  | 'radio'
  | 'checkbox'
  | 'textarea'
  | 'file'
  | 'signature';

interface FieldOption {
  value: string;
  label: string;
  labelKey?: string;
}

interface ValidationRule {
  type: 'required' | 'min' | 'max' | 'pattern' | 'email' | 'phone' | 'custom';
  value?: string | number;
  message: string;
  messageKey?: string;
}

interface FieldDependency {
  field: string;          // Key of the field this depends on
  operator: 'equals' | 'not_equals' | 'contains' | 'not_empty';
  value?: string | string[];
}
```

## Example: Employment Contract Form

```typescript
const employmentContractForm: FormDefinition = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  code: 'employment_contract',
  name: 'Yêu cầu hợp đồng lao động',
  description: 'Form for requesting employment contract services',
  fields: [
    {
      key: 'company_name',
      type: 'text',
      label: 'Tên công ty',
      required: true,
      order: 1,
      validation: [
        { type: 'required', message: 'Vui lòng nhập tên công ty' }
      ]
    },
    {
      key: 'tax_code',
      type: 'text',
      label: 'Mã số thuế',
      required: true,
      order: 2,
      validation: [
        { type: 'required', message: 'Vui lòng nhập mã số thuế' },
        { type: 'pattern', value: '^[0-9]{10}$', message: 'Mã số thuế gồm 10 chữ số' }
      ]
    },
    {
      key: 'employee_count',
      type: 'select',
      label: 'Số lượng nhân viên',
      required: true,
      order: 3,
      options: [
        { value: '1-10', label: '1-10 người' },
        { value: '11-50', label: '11-50 người' },
        { value: '51-200', label: '51-200 người' },
        { value: '200+', label: 'Hơn 200 người' }
      ]
    },
    {
      key: 'contract_type',
      type: 'radio',
      label: 'Loại hợp đồng',
      required: true,
      order: 4,
      options: [
        { value: 'full_time', label: 'Toàn thời gian' },
        { value: 'part_time', label: 'Bán thời gian' },
        { value: 'seasonal', label: 'Theo mùa vụ' }
      ]
    },
    {
      key: 'signing_date',
      type: 'date',
      label: 'Ngày ký dự kiến',
      required: false,
      order: 5
    },
    {
      key: 'additional_notes',
      type: 'textarea',
      label: 'Ghi chú thêm',
      required: false,
      order: 6
    },
    {
      key: 'attachments',
      type: 'file',
      label: 'Tài liệu đính kèm',
      required: false,
      order: 7,
      validation: [
        { type: 'max', value: 10, message: 'Tối đa 10 tệp' }
      ]
    }
  ],
  version: 1,
  status: 'published'
};
```

## Form Renderer

The FormRenderer component dynamically renders forms based on FormDefinition:

```typescript
interface FormRendererProps {
  definition: FormDefinition;
  initialValues?: Record<string, unknown>;
  onSubmit: (values: Record<string, unknown>) => Promise<void>;
  onCancel?: () => void;
  disabled?: boolean;
  showValidation?: boolean;
}
```

## Form State Management

```typescript
interface FormState {
  values: Record<string, unknown>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  isDirty: boolean;
}
```

## Validation Flow

1. Client-side validation runs on field blur and form submit
2. Server-side validation runs before persisting data
3. Validation rules are defined in FormField.validation
4. Custom validators can be registered via the validation engine

## Versioning

Forms support versioning:

```typescript
// Creating a new version
const newVersion: FormDefinition = {
  ...existingForm,
  version: existingForm.version + 1,
  status: 'draft'
};

// Publishing a new version
await updateFormDefinition(id, {
  status: 'published',
  publishedAt: new Date()
});
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/forms | List all form definitions |
| GET | /api/forms/:code | Get form by code |
| POST | /api/forms | Create new form definition |
| PUT | /api/forms/:id | Update form definition |
| DELETE | /api/forms/:id | Soft delete form |

---

*Document: FORM_DEFINITION.md*
*Part of: Phase 55 - Architecture Standards*
