Dưới đây là thiết kế khuyến nghị nếu bạn muốn đi trước theo mô hình:

```txt id="qr96uz"
Shared Customer + Partner Collaboration
```

Triết lý cốt lõi:

```txt id="bdxa6t"
Khách hàng là chủ dữ liệu.
Partner là bên được cấp quyền xử lý nghiệp vụ.
Platform của bạn là bên điều phối, kiểm soát, audit và vận hành.
```

Không được thiết kế theo kiểu:

```txt id="sm65jd"
Partner sở hữu toàn bộ khách hàng
```

Mà phải thiết kế theo kiểu:

```txt id="z2w0gw"
Partner được cấp quyền theo:
  - khách hàng nào
  - nghiệp vụ nào
  - request nào
  - file nào
  - thời hạn nào
  - quyền gì
```

---

# 1. Mô hình tổng thể

## 1.1. Các actor chính

```txt id="os5wmb"
Platform Owner
  Bạn, người vận hành hệ thống.

Customer Organization
  Khách hàng SME, chủ sở hữu dữ liệu.

Partner
  Đối tác xử lý nghiệp vụ: pháp lý, thuế, IP, hợp đồng, compliance...

User
  Người dùng thuộc platform, partner hoặc customer organization.

Legal Request
  Một yêu cầu nghiệp vụ cụ thể.

Engagement
  Quan hệ/phạm vi hợp tác giữa Partner và Customer Organization.
```

---

## 1.2. Sơ đồ tổng quan

```txt id="qbsbzg"
Platform Shared Tenant
│
├── Customer Organization A
│   ├── Users
│   ├── Legal Vault
│   ├── Legal Requests
│   └── Generated Documents
│
├── Customer Organization B
│   ├── Users
│   ├── Legal Vault
│   ├── Legal Requests
│   └── Generated Documents
│
├── Partner X
│   ├── Partner Admins
│   ├── Partner Legal Staff
│   └── Service Scopes
│
├── Partner Y
│   ├── Partner Admins
│   ├── Partner Legal Staff
│   └── Service Scopes
│
└── Engagements
    ├── Partner X xử lý trademark cho Organization A
    ├── Partner Y xử lý employment contract cho Organization A
    └── Partner X xử lý IP consulting cho Organization B
```

---

# 2. Nguyên tắc sở hữu dữ liệu

Đây là phần quan trọng nhất.

## 2.1. Organization là chủ dữ liệu

Tất cả dữ liệu nghiệp vụ phải thuộc về `organization`.

Ví dụ:

```txt id="l7c18e"
legal_requests.organization_id
files.organization_id
generated_documents.organization_id
vault_files.organization_id
workflow_instances.organization_id
```

Không nên để partner là chủ dữ liệu chính.

Sai:

```txt id="sn18js"
file.partner_id = Partner X
```

Đúng:

```txt id="gsc735"
file.organization_id = Organization A
file.accessed_by_partner_id = Partner X nếu được cấp quyền
```

---

## 2.2. Partner chỉ có quyền theo engagement

Partner không tự động thấy toàn bộ dữ liệu của khách hàng.

Partner chỉ thấy dữ liệu nếu tồn tại:

```txt id="1lrjet"
active engagement
+
service scope phù hợp
+
request assignment hoặc resource access grant
```

---

# 3. Domain model tổng thể

```txt id="ct4jul"
tenants
  └── shared platform tenant

partners
  └── đối tác cung cấp dịch vụ

organizations
  └── khách hàng SME

users
  └── người dùng

organization_members
  └── user thuộc customer organization

partner_members
  └── user thuộc partner

partner_organization_engagements
  └── partner được xử lý nghiệp vụ nào cho organization nào

service_types
  └── danh mục nghiệp vụ pháp lý

legal_requests
  └── yêu cầu xử lý cụ thể

request_assignments
  └── request được assign cho partner/user/team nào

workflow_definitions
  └── định nghĩa workflow theo inheritance

workflow_instances
  └── workflow thực tế của từng request

document_templates
  └── template hợp đồng/tài liệu theo inheritance

files
  └── file metadata

file_access_grants
  └── cấp quyền đặc biệt cho file/resource

audit_logs
  └── log mọi hành động
```

---

# 4. ERD dạng text

```txt id="4zv9le"
tenants
  1 ─── n partners
  1 ─── n organizations
  1 ─── n service_types
  1 ─── n workflow_definitions
  1 ─── n document_templates

users
  n ─── n organizations through organization_members
  n ─── n partners through partner_members

partners
  n ─── n organizations through partner_organization_engagements

organizations
  1 ─── n legal_requests
  1 ─── n files
  1 ─── n form_submissions

partner_organization_engagements
  1 ─── n legal_requests
  1 ─── n request_assignments

legal_requests
  1 ─── 1 workflow_instance
  1 ─── n files
  1 ─── n generated_documents
  1 ─── n request_assignments

workflow_definitions
  1 ─── n workflow_steps
  1 ─── n workflow_transitions

document_templates
  1 ─── n template_variables
  1 ─── n generated_documents

files
  1 ─── n file_versions
  1 ─── n file_access_logs
```

---

# 5. Database design chi tiết

Tôi đề xuất dùng PostgreSQL.

Nên dùng:

```txt id="r3h0y7"
UUID primary keys
snake_case column names
JSONB cho dynamic metadata/form/config
soft delete cho dữ liệu quan trọng
audit log bắt buộc
```

---

## 5.1. `tenants`

Dù ban đầu chỉ có shared tenant, vẫn nên có bảng này để sau này mở rộng dedicated tenant.

```sql id="5wqhwt"
CREATE TABLE tenants (
  id UUID PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,

  mode TEXT NOT NULL,
  -- platform_shared | partner_dedicated | customer_dedicated

  status TEXT NOT NULL DEFAULT 'active',
  -- active | suspended | archived

  settings_json JSONB NOT NULL DEFAULT '{}',

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

Ban đầu chỉ cần:

```txt id="5ye93a"
tenant_shared_platform
```

---

## 5.2. `partners`

```sql id="wyhf2n"
CREATE TABLE partners (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),

  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,

  type TEXT NOT NULL DEFAULT 'service_provider',
  -- service_provider | reseller | white_label

  status TEXT NOT NULL DEFAULT 'active',
  -- active | suspended | archived

  contact_email TEXT,
  contact_phone TEXT,

  settings_json JSONB NOT NULL DEFAULT '{}',
  metadata_json JSONB NOT NULL DEFAULT '{}',

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);
```

Index:

```sql id="9q4cbe"
CREATE INDEX idx_partners_tenant_id ON partners(tenant_id);
CREATE INDEX idx_partners_status ON partners(status);
```

---

## 5.3. `organizations`

Đại diện cho khách hàng SME.

```sql id="ocxmuy"
CREATE TABLE organizations (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),

  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,

  tax_code TEXT,
  legal_representative TEXT,
  address TEXT,

  status TEXT NOT NULL DEFAULT 'active',
  -- active | suspended | archived

  settings_json JSONB NOT NULL DEFAULT '{}',
  metadata_json JSONB NOT NULL DEFAULT '{}',

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);
```

Index:

```sql id="hoevsc"
CREATE INDEX idx_organizations_tenant_id ON organizations(tenant_id);
CREATE INDEX idx_organizations_status ON organizations(status);
CREATE INDEX idx_organizations_tax_code ON organizations(tax_code);
```

---

## 5.4. `users`

```sql id="on51bn"
CREATE TABLE users (
  id UUID PRIMARY KEY,

  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,

  full_name TEXT NOT NULL,
  phone TEXT,

  status TEXT NOT NULL DEFAULT 'active',
  -- active | invited | suspended | disabled

  mfa_enabled BOOLEAN NOT NULL DEFAULT false,

  last_login_at TIMESTAMPTZ,

  metadata_json JSONB NOT NULL DEFAULT '{}',

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);
```

---

## 5.5. `organization_members`

User thuộc khách hàng nào.

```sql id="n35s8t"
CREATE TABLE organization_members (
  id UUID PRIMARY KEY,

  tenant_id UUID NOT NULL REFERENCES tenants(id),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  user_id UUID NOT NULL REFERENCES users(id),

  role TEXT NOT NULL,
  -- owner | admin | member | viewer

  status TEXT NOT NULL DEFAULT 'active',
  -- active | invited | suspended | removed

  permissions_json JSONB NOT NULL DEFAULT '{}',

  invited_by_user_id UUID REFERENCES users(id),
  joined_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (organization_id, user_id)
);
```

Index:

```sql id="9hkjsr"
CREATE INDEX idx_org_members_user_id ON organization_members(user_id);
CREATE INDEX idx_org_members_org_id ON organization_members(organization_id);
CREATE INDEX idx_org_members_tenant_id ON organization_members(tenant_id);
```

---

## 5.6. `partner_members`

User thuộc partner nào.

```sql id="f0yab1"
CREATE TABLE partner_members (
  id UUID PRIMARY KEY,

  tenant_id UUID NOT NULL REFERENCES tenants(id),
  partner_id UUID NOT NULL REFERENCES partners(id),
  user_id UUID NOT NULL REFERENCES users(id),

  role TEXT NOT NULL,
  -- owner | admin | legal_staff | accountant | viewer

  status TEXT NOT NULL DEFAULT 'active',
  -- active | invited | suspended | removed

  permissions_json JSONB NOT NULL DEFAULT '{}',

  invited_by_user_id UUID REFERENCES users(id),
  joined_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (partner_id, user_id)
);
```

Index:

```sql id="6o22t2"
CREATE INDEX idx_partner_members_user_id ON partner_members(user_id);
CREATE INDEX idx_partner_members_partner_id ON partner_members(partner_id);
CREATE INDEX idx_partner_members_tenant_id ON partner_members(tenant_id);
```

---

## 5.7. `service_types`

Danh mục nghiệp vụ có thể cung cấp.

Ví dụ:

```txt id="98ht0r"
employment_contract
trademark_registration
agency_contract
business_license_renewal
compliance_calendar
```

```sql id="02ch1y"
CREATE TABLE service_types (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),

  code TEXT NOT NULL,
  name_i18n_key TEXT NOT NULL,
  description_i18n_key TEXT,

  category TEXT NOT NULL,
  -- contract | ip | compliance | corporate | labor | tax | other

  status TEXT NOT NULL DEFAULT 'active',
  -- active | inactive | archived

  config_json JSONB NOT NULL DEFAULT '{}',

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (tenant_id, code)
);
```

---

## 5.8. `partner_service_types`

Partner nào cung cấp nghiệp vụ nào.

```sql id="eqw2t0"
CREATE TABLE partner_service_types (
  id UUID PRIMARY KEY,

  tenant_id UUID NOT NULL REFERENCES tenants(id),
  partner_id UUID NOT NULL REFERENCES partners(id),
  service_type_id UUID NOT NULL REFERENCES service_types(id),

  status TEXT NOT NULL DEFAULT 'active',
  -- active | paused | disabled

  settings_json JSONB NOT NULL DEFAULT '{}',

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (partner_id, service_type_id)
);
```

---

# 6. Engagement model

Đây là phần lõi của mô hình Shared Customer + Partner Collaboration.

## 6.1. `partner_organization_engagements`

Bảng này định nghĩa partner nào được xử lý nghiệp vụ cho organization nào.

```sql id="hwcw7a"
CREATE TABLE partner_organization_engagements (
  id UUID PRIMARY KEY,

  tenant_id UUID NOT NULL REFERENCES tenants(id),
  partner_id UUID NOT NULL REFERENCES partners(id),
  organization_id UUID NOT NULL REFERENCES organizations(id),

  status TEXT NOT NULL DEFAULT 'active',
  -- active | paused | revoked | expired

  engagement_type TEXT NOT NULL DEFAULT 'service_scope',
  -- service_scope | project_based | full_managed

  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,

  created_by_user_id UUID REFERENCES users(id),

  settings_json JSONB NOT NULL DEFAULT '{}',
  metadata_json JSONB NOT NULL DEFAULT '{}',

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (partner_id, organization_id, engagement_type)
);
```

---

## 6.2. `engagement_service_scopes`

Một engagement có thể cho phép nhiều service type.

```sql id="4mhapb"
CREATE TABLE engagement_service_scopes (
  id UUID PRIMARY KEY,

  tenant_id UUID NOT NULL REFERENCES tenants(id),
  engagement_id UUID NOT NULL REFERENCES partner_organization_engagements(id),

  service_type_id UUID NOT NULL REFERENCES service_types(id),

  permission_level TEXT NOT NULL DEFAULT 'case_assigned',
  -- case_assigned: chỉ thấy request được assign
  -- service_wide: thấy toàn bộ request thuộc service type đó của organization
  -- full_access: rất hạn chế, chỉ dùng khi hợp đồng rõ ràng

  permissions_json JSONB NOT NULL DEFAULT '{}',

  status TEXT NOT NULL DEFAULT 'active',
  -- active | paused | revoked

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (engagement_id, service_type_id)
);
```

Ví dụ:

```json id="s3cjzm"
{
  "engagementId": "eng_001",
  "serviceType": "trademark_registration",
  "permissionLevel": "case_assigned"
}
```

Nghĩa là partner chỉ thấy những trademark request được assign.

---

# 7. Legal request model

## 7.1. `legal_requests`

```sql id="2tvle7"
CREATE TABLE legal_requests (
  id UUID PRIMARY KEY,

  tenant_id UUID NOT NULL REFERENCES tenants(id),
  organization_id UUID NOT NULL REFERENCES organizations(id),

  service_type_id UUID NOT NULL REFERENCES service_types(id),

  engagement_id UUID REFERENCES partner_organization_engagements(id),
  assigned_partner_id UUID REFERENCES partners(id),

  title TEXT NOT NULL,
  description TEXT,

  status TEXT NOT NULL DEFAULT 'draft',
  -- draft | submitted | assigned | in_review | waiting_customer | completed | cancelled

  priority TEXT NOT NULL DEFAULT 'normal',
  -- low | normal | high | urgent

  created_by_user_id UUID NOT NULL REFERENCES users(id),

  workflow_definition_id UUID,
  workflow_instance_id UUID,

  due_date DATE,

  metadata_json JSONB NOT NULL DEFAULT '{}',

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);
```

Index bắt buộc:

```sql id="4whdzu"
CREATE INDEX idx_legal_requests_tenant_id ON legal_requests(tenant_id);
CREATE INDEX idx_legal_requests_org_id ON legal_requests(organization_id);
CREATE INDEX idx_legal_requests_partner_id ON legal_requests(assigned_partner_id);
CREATE INDEX idx_legal_requests_service_type ON legal_requests(service_type_id);
CREATE INDEX idx_legal_requests_status ON legal_requests(status);
CREATE INDEX idx_legal_requests_created_at ON legal_requests(created_at);
```

---

## 7.2. `request_assignments`

Một request có thể assign cho partner, team hoặc user cụ thể.

```sql id="bjuc8e"
CREATE TABLE request_assignments (
  id UUID PRIMARY KEY,

  tenant_id UUID NOT NULL REFERENCES tenants(id),
  legal_request_id UUID NOT NULL REFERENCES legal_requests(id),

  partner_id UUID REFERENCES partners(id),
  assigned_user_id UUID REFERENCES users(id),

  assignment_type TEXT NOT NULL,
  -- partner | partner_user | platform_user

  role TEXT NOT NULL,
  -- owner | handler | reviewer | approver | viewer

  status TEXT NOT NULL DEFAULT 'active',
  -- active | completed | revoked

  assigned_by_user_id UUID REFERENCES users(id),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  revoked_at TIMESTAMPTZ,

  metadata_json JSONB NOT NULL DEFAULT '{}'
);
```

Index:

```sql id="hcmjqr"
CREATE INDEX idx_request_assignments_request ON request_assignments(legal_request_id);
CREATE INDEX idx_request_assignments_partner ON request_assignments(partner_id);
CREATE INDEX idx_request_assignments_user ON request_assignments(assigned_user_id);
```

---

# 8. Dynamic form model

Để thay đổi field linh hoạt, không nên hardcode field nghiệp vụ.

## 8.1. `form_definitions`

```sql id="55nka3"
CREATE TABLE form_definitions (
  id UUID PRIMARY KEY,

  tenant_id UUID NOT NULL REFERENCES tenants(id),
  service_type_id UUID NOT NULL REFERENCES service_types(id),

  owner_type TEXT NOT NULL,
  -- platform | partner | organization

  owner_id UUID,

  parent_form_definition_id UUID REFERENCES form_definitions(id),

  code TEXT NOT NULL,
  name_i18n_key TEXT NOT NULL,

  version INTEGER NOT NULL DEFAULT 1,

  status TEXT NOT NULL DEFAULT 'draft',
  -- draft | active | archived

  fields_json JSONB NOT NULL DEFAULT '[]',
  validation_json JSONB NOT NULL DEFAULT '{}',
  ui_schema_json JSONB NOT NULL DEFAULT '{}',

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## 8.2. `form_submissions`

```sql id="4vihg3"
CREATE TABLE form_submissions (
  id UUID PRIMARY KEY,

  tenant_id UUID NOT NULL REFERENCES tenants(id),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  legal_request_id UUID REFERENCES legal_requests(id),

  form_definition_id UUID NOT NULL REFERENCES form_definitions(id),

  submitted_by_user_id UUID REFERENCES users(id),

  status TEXT NOT NULL DEFAULT 'draft',
  -- draft | submitted | validated | rejected

  data_json JSONB NOT NULL DEFAULT '{}',

  submitted_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

Nên dùng JSONB cho `data_json` để linh hoạt thêm field sau này.

Ví dụ:

```json id="dle6wf"
{
  "company_name": "ABC Co., Ltd",
  "tax_code": "010xxxxxxx",
  "representative_name": "Nguyen Van A",
  "contract_duration": "12 months"
}
```

---

# 9. Workflow/template inheritance

## 9.1. Nguyên tắc inheritance

Workflow nên có 3 tầng:

```txt id="6x17t7"
Platform Base Workflow
  ↓
Partner Override Workflow
  ↓
Organization Override Workflow
```

Thứ tự resolve:

```txt id="d8h7lo"
1. Organization workflow nếu có
2. Partner workflow nếu có
3. Platform base workflow
```

Ví dụ:

```txt id="1yasq3"
Platform:
  trademark_registration_v1

Partner X override:
  trademark_registration_partner_x_v2

Organization A override:
  trademark_registration_org_a_v1
```

Khi tạo request, hệ thống phải snapshot workflow version đang dùng.

Không để request cũ bị ảnh hưởng khi workflow mới thay đổi.

---

## 9.2. `workflow_definitions`

```sql id="zq0l4p"
CREATE TABLE workflow_definitions (
  id UUID PRIMARY KEY,

  tenant_id UUID NOT NULL REFERENCES tenants(id),
  service_type_id UUID NOT NULL REFERENCES service_types(id),

  owner_type TEXT NOT NULL,
  -- platform | partner | organization

  owner_id UUID,

  parent_workflow_definition_id UUID REFERENCES workflow_definitions(id),

  code TEXT NOT NULL,
  name_i18n_key TEXT NOT NULL,

  inheritance_mode TEXT NOT NULL DEFAULT 'extend',
  -- extend | override | compose

  version INTEGER NOT NULL DEFAULT 1,

  status TEXT NOT NULL DEFAULT 'draft',
  -- draft | active | archived

  config_json JSONB NOT NULL DEFAULT '{}',

  created_by_user_id UUID REFERENCES users(id),

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (tenant_id, service_type_id, owner_type, owner_id, version)
);
```

---

## 9.3. `workflow_steps`

```sql id="qu1s30"
CREATE TABLE workflow_steps (
  id UUID PRIMARY KEY,

  workflow_definition_id UUID NOT NULL REFERENCES workflow_definitions(id),

  step_key TEXT NOT NULL,
  name_i18n_key TEXT NOT NULL,

  step_type TEXT NOT NULL,
  -- input | review | approval | document_generation | customer_action | partner_action | system_action

  actor_type TEXT NOT NULL,
  -- customer | partner | platform | system

  sort_order INTEGER NOT NULL,

  required BOOLEAN NOT NULL DEFAULT true,

  config_json JSONB NOT NULL DEFAULT '{}',
  condition_json JSONB NOT NULL DEFAULT '{}',

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (workflow_definition_id, step_key)
);
```

---

## 9.4. `workflow_transitions`

```sql id="wywf6d"
CREATE TABLE workflow_transitions (
  id UUID PRIMARY KEY,

  workflow_definition_id UUID NOT NULL REFERENCES workflow_definitions(id),

  from_step_key TEXT NOT NULL,
  to_step_key TEXT NOT NULL,

  action_key TEXT NOT NULL,
  action_i18n_key TEXT NOT NULL,

  actor_type TEXT NOT NULL,
  -- customer | partner | platform | system

  permission_required TEXT,

  condition_json JSONB NOT NULL DEFAULT '{}',

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## 9.5. `workflow_instances`

```sql id="g7qjr1"
CREATE TABLE workflow_instances (
  id UUID PRIMARY KEY,

  tenant_id UUID NOT NULL REFERENCES tenants(id),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  legal_request_id UUID NOT NULL REFERENCES legal_requests(id),

  workflow_definition_id UUID NOT NULL REFERENCES workflow_definitions(id),
  workflow_version INTEGER NOT NULL,

  current_step_key TEXT,

  status TEXT NOT NULL DEFAULT 'running',
  -- running | completed | cancelled | failed

  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,

  state_json JSONB NOT NULL DEFAULT '{}'
);
```

---

## 9.6. `workflow_instance_steps`

```sql id="e7s6yr"
CREATE TABLE workflow_instance_steps (
  id UUID PRIMARY KEY,

  workflow_instance_id UUID NOT NULL REFERENCES workflow_instances(id),

  step_key TEXT NOT NULL,

  status TEXT NOT NULL DEFAULT 'pending',
  -- pending | active | completed | skipped | failed

  assigned_actor_type TEXT,
  assigned_user_id UUID REFERENCES users(id),
  assigned_partner_id UUID REFERENCES partners(id),

  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  data_json JSONB NOT NULL DEFAULT '{}',

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

# 10. Document template inheritance

## 10.1. Nguyên tắc

Template cũng theo inheritance:

```txt id="j179vt"
Platform base template
  ↓
Partner template override
  ↓
Organization template override
```

Ví dụ:

```txt id="7v2fm2"
Platform:
  employment_contract_base.docx

Partner Y:
  employment_contract_partner_y.docx

Organization A:
  employment_contract_org_a_custom.docx
```

---

## 10.2. `document_templates`

```sql id="pflszf"
CREATE TABLE document_templates (
  id UUID PRIMARY KEY,

  tenant_id UUID NOT NULL REFERENCES tenants(id),
  service_type_id UUID NOT NULL REFERENCES service_types(id),

  owner_type TEXT NOT NULL,
  -- platform | partner | organization

  owner_id UUID,

  parent_template_id UUID REFERENCES document_templates(id),

  code TEXT NOT NULL,
  name_i18n_key TEXT NOT NULL,

  template_type TEXT NOT NULL,
  -- docx | pdf | html | markdown

  inheritance_mode TEXT NOT NULL DEFAULT 'extend',
  -- extend | override

  version INTEGER NOT NULL DEFAULT 1,

  status TEXT NOT NULL DEFAULT 'draft',
  -- draft | active | archived

  file_id UUID,

  config_json JSONB NOT NULL DEFAULT '{}',

  created_by_user_id UUID REFERENCES users(id),

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## 10.3. `template_variables`

```sql id="cy1k6t"
CREATE TABLE template_variables (
  id UUID PRIMARY KEY,

  template_id UUID NOT NULL REFERENCES document_templates(id),

  variable_key TEXT NOT NULL,

  label_i18n_key TEXT,

  data_type TEXT NOT NULL,
  -- text | number | date | boolean | currency | enum

  required BOOLEAN NOT NULL DEFAULT false,

  source_path TEXT,
  -- ví dụ: form.company_name, organization.tax_code

  default_value TEXT,

  validation_json JSONB NOT NULL DEFAULT '{}',

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (template_id, variable_key)
);
```

---

## 10.4. `generated_documents`

```sql id="s8w1nm"
CREATE TABLE generated_documents (
  id UUID PRIMARY KEY,

  tenant_id UUID NOT NULL REFERENCES tenants(id),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  legal_request_id UUID REFERENCES legal_requests(id),

  template_id UUID REFERENCES document_templates(id),
  template_version INTEGER,

  generated_by_user_id UUID REFERENCES users(id),

  status TEXT NOT NULL DEFAULT 'generated',
  -- generated | reviewed | approved | signed | archived

  output_file_id UUID,

  input_data_json JSONB NOT NULL DEFAULT '{}',

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

# 11. Storage objectKey thiết kế lại

Vì bạn chọn Shared Customer + Partner Collaboration, objectKey không nên bắt đầu bằng `partners/{partnerId}`.

Vì khách hàng có thể làm việc với nhiều partner.

Nên dùng:

```txt id="qvqz87"
tenants/{tenantId}/organizations/{organizationId}/...
```

---

## 11.1. Request upload

```txt id="rv1ntj"
tenants/{tenantId}/organizations/{organizationId}/requests/{requestId}/uploads/{fileId}/{safeFileName}
```

Ví dụ:

```txt id="8xye96"
tenants/tenant_shared/organizations/org_001/requests/req_001/uploads/file_001/license.pdf
```

---

## 11.2. Partner-generated document

Nếu partner generate document cho request:

```txt id="g2kk78"
tenants/{tenantId}/organizations/{organizationId}/requests/{requestId}/partners/{partnerId}/generated-documents/{documentId}/v{version}/{fileName}
```

Ví dụ:

```txt id="d4ai9m"
tenants/tenant_shared/organizations/org_001/requests/req_001/partners/partner_x/generated-documents/doc_001/v1/contract.pdf
```

---

## 11.3. Legal vault

```txt id="no7g2t"
tenants/{tenantId}/organizations/{organizationId}/vault/{category}/{fileId}/v{version}/{fileName}
```

Ví dụ:

```txt id="gklp1c"
tenants/tenant_shared/organizations/org_001/vault/licenses/file_001/v1/business-license.pdf
```

---

## 11.4. OCR output

```txt id="4fn2ph"
tenants/{tenantId}/organizations/{organizationId}/requests/{requestId}/ocr/{fileId}/result.json
```

---

## 11.5. Templates

```txt id="1n0zmn"
tenants/{tenantId}/templates/{ownerType}/{ownerId}/{serviceTypeCode}/{templateId}/v{version}/{fileName}
```

Ví dụ platform template:

```txt id="f31j20"
tenants/tenant_shared/templates/platform/global/employment_contract/tpl_001/v1/template.docx
```

Partner template:

```txt id="i4eo9b"
tenants/tenant_shared/templates/partner/partner_x/employment_contract/tpl_002/v1/template.docx
```

---

# 12. File model

## 12.1. `files`

```sql id="1isv8q"
CREATE TABLE files (
  id UUID PRIMARY KEY,

  tenant_id UUID NOT NULL REFERENCES tenants(id),
  organization_id UUID REFERENCES organizations(id),

  legal_request_id UUID REFERENCES legal_requests(id),
  partner_id UUID REFERENCES partners(id),

  storage_driver TEXT NOT NULL,
  -- local | s3

  bucket TEXT,
  object_key TEXT NOT NULL,

  original_name TEXT NOT NULL,
  safe_name TEXT NOT NULL,

  mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,

  checksum TEXT,

  category TEXT NOT NULL,
  -- request_upload | vault_file | generated_document | template | ocr_output | audit_export

  visibility TEXT NOT NULL DEFAULT 'organization_private',
  -- organization_private | partner_visible | platform_internal | restricted

  status TEXT NOT NULL DEFAULT 'ready',
  -- pending | ready | processing | failed | deleted

  created_by_user_id UUID REFERENCES users(id),

  metadata_json JSONB NOT NULL DEFAULT '{}',

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);
```

---

## 12.2. `file_versions`

```sql id="xry4kv"
CREATE TABLE file_versions (
  id UUID PRIMARY KEY,

  file_id UUID NOT NULL REFERENCES files(id),

  version_number INTEGER NOT NULL,

  storage_driver TEXT NOT NULL,
  bucket TEXT,
  object_key TEXT NOT NULL,

  size_bytes BIGINT NOT NULL,
  checksum TEXT,

  created_by_user_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (file_id, version_number)
);
```

---

## 12.3. `file_access_grants`

Dùng khi cần cấp quyền đặc biệt cho file.

```sql id="0b56j3"
CREATE TABLE file_access_grants (
  id UUID PRIMARY KEY,

  tenant_id UUID NOT NULL REFERENCES tenants(id),
  file_id UUID NOT NULL REFERENCES files(id),

  grantee_type TEXT NOT NULL,
  -- user | partner | organization

  grantee_id UUID NOT NULL,

  permissions_json JSONB NOT NULL DEFAULT '{}',
  -- read | download | comment | review

  engagement_id UUID REFERENCES partner_organization_engagements(id),

  expires_at TIMESTAMPTZ,

  granted_by_user_id UUID REFERENCES users(id),

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ
);
```

---

## 12.4. `file_access_logs`

```sql id="mcv12x"
CREATE TABLE file_access_logs (
  id UUID PRIMARY KEY,

  tenant_id UUID NOT NULL REFERENCES tenants(id),
  file_id UUID NOT NULL REFERENCES files(id),

  actor_type TEXT NOT NULL,
  -- user | api_client | system

  actor_id UUID NOT NULL,

  action TEXT NOT NULL,
  -- view | download | upload | delete | restore | share

  ip_address TEXT,
  user_agent TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

# 13. Quy tắc phân quyền

## 13.1. Request context

Mọi request API phải tạo được context:

```ts id="0fbn8u"
type RequestContext = {
  tenantId: string;
  userId?: string;

  platformRoles: string[];

  organizationMemberships: {
    organizationId: string;
    role: string;
    permissions: string[];
  }[];

  partnerMemberships: {
    partnerId: string;
    role: string;
    permissions: string[];
  }[];

  apiClientId?: string;
  scopes?: string[];
};
```

---

## 13.2. Quy tắc chung

```txt id="xdlitb"
1. Deny by default.
2. Platform Admin có thể xem theo quyền hệ thống.
3. Organization user chỉ xem dữ liệu organization của họ.
4. Partner user chỉ xem dữ liệu được cấp qua engagement/request assignment/access grant.
5. Partner không được xem toàn bộ vault của organization.
6. File restricted cần quyền riêng.
7. API client bị giới hạn bởi scopes.
8. Mọi access file/request phải ghi audit.
```

---

## 13.3. Quy tắc xem legal request

Partner được xem request khi thỏa một trong các điều kiện:

```txt id="810irs"
- Partner được assign trực tiếp vào request.
- Partner có active engagement với organization.
- Engagement có service_type phù hợp.
- Engagement permission_level cho phép xem request đó.
```

Pseudo-code:

```ts id="hijq9s"
async function canReadLegalRequest(ctx, request) {
  if (ctx.platformRoles.includes("platform_admin")) {
    return true;
  }

  if (ctx.organizationMemberships.some(m =>
    m.organizationId === request.organizationId &&
    m.permissions.includes("requests:read")
  )) {
    return true;
  }

  const partnerMembership = ctx.partnerMemberships.find(m =>
    m.partnerId === request.assignedPartnerId
  );

  if (!partnerMembership) {
    return false;
  }

  const engagement = await engagementService.findActive({
    partnerId: request.assignedPartnerId,
    organizationId: request.organizationId,
    serviceTypeId: request.serviceTypeId
  });

  if (!engagement) {
    return false;
  }

  return partnerMembership.permissions.includes("partner_requests:read");
}
```

---

## 13.4. Quy tắc xem file

File access phải dựa trên file category.

```txt id="tmbp0s"
request_upload:
  Partner xem được nếu xem được request.

generated_document:
  Partner xem được nếu là partner generate hoặc được grant.

vault_file:
  Partner không xem mặc định.
  Phải có file_access_grant hoặc engagement cho phép.

template:
  Partner chỉ xem template của platform hoặc template của chính partner đó.

restricted:
  Chỉ user có permission đặc biệt mới xem được.
```

---

## 13.5. Quy tắc assign partner

Chỉ các actor sau được assign partner vào request:

```txt id="6n5q47"
- Platform Admin
- Organization Owner/Admin
- User có permission requests:assign_partner
```

Partner không được tự assign mình vào request nếu chưa có engagement.

---

# 14. API design

## 14.1. API context

Dùng chung API, phân quyền bằng context.

Không nên tách API thành 2 hệ khác nhau.

```txt id="kser7y"
/api/v1/organizations/...
/api/v1/partners/...
/api/v1/legal-requests/...
/api/v1/files/...
```

---

## 14.2. Response format

Success:

```json id="44cx5e"
{
  "success": true,
  "data": {},
  "meta": {
    "requestId": "req_xxx"
  }
}
```

Error:

```json id="dcvzv2"
{
  "success": false,
  "error": {
    "code": "FORBIDDEN_RESOURCE_ACCESS",
    "message": "You do not have permission to access this resource.",
    "details": {}
  }
}
```

---

## 14.3. Organization APIs

```txt id="2hhxdz"
GET    /api/v1/organizations
POST   /api/v1/organizations
GET    /api/v1/organizations/:organizationId
PATCH  /api/v1/organizations/:organizationId

GET    /api/v1/organizations/:organizationId/members
POST   /api/v1/organizations/:organizationId/members/invite
PATCH  /api/v1/organizations/:organizationId/members/:memberId
```

---

## 14.4. Partner APIs

```txt id="dm97z2"
GET    /api/v1/partners
POST   /api/v1/partners
GET    /api/v1/partners/:partnerId
PATCH  /api/v1/partners/:partnerId

GET    /api/v1/partners/:partnerId/members
POST   /api/v1/partners/:partnerId/members/invite

GET    /api/v1/partners/:partnerId/organizations
GET    /api/v1/partners/:partnerId/engagements
GET    /api/v1/partners/:partnerId/legal-requests
```

---

## 14.5. Engagement APIs

```txt id="96fzy1"
POST   /api/v1/engagements
GET    /api/v1/engagements
GET    /api/v1/engagements/:engagementId
PATCH  /api/v1/engagements/:engagementId
POST   /api/v1/engagements/:engagementId/revoke

POST   /api/v1/engagements/:engagementId/service-scopes
PATCH  /api/v1/engagements/:engagementId/service-scopes/:scopeId
DELETE /api/v1/engagements/:engagementId/service-scopes/:scopeId
```

---

## 14.6. Legal Request APIs

```txt id="rpyh7b"
POST   /api/v1/organizations/:organizationId/legal-requests
GET    /api/v1/legal-requests
GET    /api/v1/legal-requests/:requestId
PATCH  /api/v1/legal-requests/:requestId

POST   /api/v1/legal-requests/:requestId/assign-partner
POST   /api/v1/legal-requests/:requestId/assign-user
POST   /api/v1/legal-requests/:requestId/transition

GET    /api/v1/legal-requests/:requestId/files
POST   /api/v1/legal-requests/:requestId/files
```

---

## 14.7. File APIs

```txt id="7l1vlz"
POST   /api/v1/files
POST   /api/v1/files/upload-url
POST   /api/v1/files/:fileId/confirm-upload

GET    /api/v1/files/:fileId
GET    /api/v1/files/:fileId/download

POST   /api/v1/files/:fileId/grants
DELETE /api/v1/files/:fileId/grants/:grantId

GET    /api/v1/files/:fileId/access-logs
DELETE /api/v1/files/:fileId
```

---

## 14.8. Workflow APIs

```txt id="8mnkie"
GET    /api/v1/service-types
POST   /api/v1/workflow-definitions
GET    /api/v1/workflow-definitions
GET    /api/v1/workflow-definitions/:workflowId
PATCH  /api/v1/workflow-definitions/:workflowId
POST   /api/v1/workflow-definitions/:workflowId/publish

GET    /api/v1/legal-requests/:requestId/workflow
POST   /api/v1/legal-requests/:requestId/workflow/transition
```

---

## 14.9. Template APIs

```txt id="ynqzgp"
POST   /api/v1/document-templates
GET    /api/v1/document-templates
GET    /api/v1/document-templates/:templateId
PATCH  /api/v1/document-templates/:templateId
POST   /api/v1/document-templates/:templateId/publish

POST   /api/v1/legal-requests/:requestId/generated-documents
GET    /api/v1/legal-requests/:requestId/generated-documents
```

---

# 15. Repository rule

Không cho service gọi Prisma/DB trực tiếp tùy tiện.

Nên có tenant-aware repository.

Ví dụ:

```ts id="bs0iaa"
class LegalRequestRepository {
  findByIdForContext(ctx: RequestContext, requestId: string) {
    return prisma.legalRequest.findFirst({
      where: {
        id: requestId,
        tenantId: ctx.tenantId
      }
    });
  }
}
```

Sau đó policy service kiểm tra quyền.

Không viết:

```ts id="l7k9fj"
prisma.legalRequest.findUnique({
  where: { id }
});
```

trong business service.

---

# 16. Audit log

## 16.1. `audit_logs`

```sql id="mj01xs"
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,

  tenant_id UUID NOT NULL REFERENCES tenants(id),

  organization_id UUID REFERENCES organizations(id),
  partner_id UUID REFERENCES partners(id),

  actor_type TEXT NOT NULL,
  -- user | api_client | system

  actor_id UUID,

  action TEXT NOT NULL,

  resource_type TEXT NOT NULL,
  resource_id UUID,

  ip_address TEXT,
  user_agent TEXT,

  request_id TEXT,

  metadata_json JSONB NOT NULL DEFAULT '{}',

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

Index:

```sql id="mnmxo5"
CREATE INDEX idx_audit_tenant ON audit_logs(tenant_id);
CREATE INDEX idx_audit_org ON audit_logs(organization_id);
CREATE INDEX idx_audit_partner ON audit_logs(partner_id);
CREATE INDEX idx_audit_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_created_at ON audit_logs(created_at);
```

---

# 17. Quy tắc audit bắt buộc

Phải log:

```txt id="5549hl"
- login success / failed
- create organization
- create partner
- create engagement
- revoke engagement
- create legal request
- assign partner
- transition workflow
- upload file
- download file
- grant file access
- generate document
- publish workflow
- publish template
```

---

# 18. API client cho partner

Dù chưa làm ngay, nên chuẩn bị schema.

## 18.1. `api_clients`

```sql id="j3x1xv"
CREATE TABLE api_clients (
  id UUID PRIMARY KEY,

  tenant_id UUID NOT NULL REFERENCES tenants(id),
  partner_id UUID NOT NULL REFERENCES partners(id),

  name TEXT NOT NULL,

  client_id TEXT UNIQUE NOT NULL,
  client_secret_hash TEXT NOT NULL,

  environment TEXT NOT NULL DEFAULT 'sandbox',
  -- sandbox | production

  status TEXT NOT NULL DEFAULT 'active',
  -- active | revoked | expired

  scopes_json JSONB NOT NULL DEFAULT '[]',

  expires_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,

  created_by_user_id UUID REFERENCES users(id),

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## 18.2. `api_usage_logs`

```sql id="iv3gq4"
CREATE TABLE api_usage_logs (
  id UUID PRIMARY KEY,

  tenant_id UUID NOT NULL REFERENCES tenants(id),
  partner_id UUID NOT NULL REFERENCES partners(id),
  api_client_id UUID REFERENCES api_clients(id),

  method TEXT NOT NULL,
  path TEXT NOT NULL,
  status_code INTEGER,

  ip_address TEXT,

  duration_ms INTEGER,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

# 19. Webhook model

## 19.1. `webhook_endpoints`

```sql id="9m5h17"
CREATE TABLE webhook_endpoints (
  id UUID PRIMARY KEY,

  tenant_id UUID NOT NULL REFERENCES tenants(id),
  partner_id UUID NOT NULL REFERENCES partners(id),

  url TEXT NOT NULL,
  secret_hash TEXT NOT NULL,

  events_json JSONB NOT NULL DEFAULT '[]',

  status TEXT NOT NULL DEFAULT 'active',
  -- active | disabled

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## 19.2. `webhook_deliveries`

```sql id="8h78jw"
CREATE TABLE webhook_deliveries (
  id UUID PRIMARY KEY,

  tenant_id UUID NOT NULL REFERENCES tenants(id),
  partner_id UUID NOT NULL REFERENCES partners(id),
  webhook_endpoint_id UUID NOT NULL REFERENCES webhook_endpoints(id),

  event_type TEXT NOT NULL,

  payload_json JSONB NOT NULL,

  status TEXT NOT NULL DEFAULT 'pending',
  -- pending | success | failed

  response_status INTEGER,
  response_body TEXT,

  attempt_count INTEGER NOT NULL DEFAULT 0,

  next_retry_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  delivered_at TIMESTAMPTZ
);
```

---

# 20. Service layer nên chia module thế nào?

```txt id="qjr87v"
modules
  /tenancy
    tenant.service.ts
    request-context.service.ts

  /partners
    partner.service.ts
    partner-member.service.ts

  /organizations
    organization.service.ts
    organization-member.service.ts

  /engagements
    engagement.service.ts
    engagement-policy.service.ts

  /access-control
    policy.service.ts
    permission.service.ts

  /legal-requests
    legal-request.service.ts
    legal-request.repository.ts

  /workflows
    workflow-definition.service.ts
    workflow-instance.service.ts
    workflow-resolver.service.ts

  /templates
    document-template.service.ts
    template-resolver.service.ts

  /files
    file.service.ts
    file-policy.service.ts

  /storage
    storage.service.ts
    local-storage.provider.ts
    s3-storage.provider.ts

  /audit
    audit.service.ts

  /api-clients
    api-client.service.ts

  /webhooks
    webhook.service.ts
```

---

# 21. Workflow resolver

Khi tạo legal request, hệ thống resolve workflow theo thứ tự:

```txt id="ed4wlv"
1. Organization override workflow
2. Partner override workflow
3. Platform base workflow
```

Pseudo-code:

```ts id="b1fwgp"
async function resolveWorkflow({
  tenantId,
  organizationId,
  partnerId,
  serviceTypeId
}) {
  const orgWorkflow = await findActiveWorkflow({
    tenantId,
    ownerType: "organization",
    ownerId: organizationId,
    serviceTypeId
  });

  if (orgWorkflow) return orgWorkflow;

  if (partnerId) {
    const partnerWorkflow = await findActiveWorkflow({
      tenantId,
      ownerType: "partner",
      ownerId: partnerId,
      serviceTypeId
    });

    if (partnerWorkflow) return partnerWorkflow;
  }

  return findActiveWorkflow({
    tenantId,
    ownerType: "platform",
    ownerId: null,
    serviceTypeId
  });
}
```

---

# 22. Template resolver

Tương tự workflow.

```txt id="zp8jir"
1. Organization template
2. Partner template
3. Platform template
```

Request phải lưu lại:

```txt id="g7xrfd"
template_id
template_version
```

để sau này template thay đổi không làm sai document cũ.

---

# 23. Minimum schema cần làm trước

Để không quá nặng ở MVP, làm trước nhóm bảng sau:

```txt id="wl3cdc"
tenants
partners
organizations
users
organization_members
partner_members
service_types
partner_service_types
partner_organization_engagements
engagement_service_scopes
legal_requests
request_assignments
files
file_versions
file_access_logs
audit_logs
workflow_definitions
workflow_steps
workflow_transitions
workflow_instances
document_templates
template_variables
generated_documents
form_definitions
form_submissions
```

Có thể để API clients/webhooks làm phase sau.

---

# 24. Decision tổng kết

Mô hình nên phát triển:

```txt id="jpsde0"
Shared Customer + Partner Collaboration
```

Với nguyên tắc:

```txt id="8704gg"
Tenant:
  shared platform boundary

Organization:
  chủ dữ liệu

Partner:
  bên xử lý nghiệp vụ

Engagement:
  quan hệ/phạm vi partner được xử lý cho organization

Legal Request:
  case cụ thể được assign cho partner

Workflow/Template:
  platform base → partner override → organization override

Storage:
  objectKey bắt đầu bằng tenantId + organizationId

Authorization:
  deny by default
  organization owner controls data
  partner access qua engagement/request assignment/access grant

Audit:
  mọi hành động quan trọng phải log
```

Thiết kế này cho phép bạn bắt đầu bằng shared platform tiết kiệm, nhưng vẫn mở đường cho:

```txt id="7h6gft"
- Partner marketplace
- Partner collaboration
- Partner-specific workflow
- Organization-specific customization
- Dedicated partner tenant sau này
- API integration cho partner
- S3 storage migration
```

mà không phải viết lại kiến trúc lõi.
