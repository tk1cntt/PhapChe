# Phase 57: Shared Tenant Architecture — Context

**Phase:** 57
**Created:** 2026-06-14
**Mode:** discuss-phase
**Source:** `docs/shared_customer_partner_collaboration.md`

## Domain

**Shared Customer + Partner Collaboration** — Multi-tenant architecture where customers own data, partners are authorized processors, and the platform orchestrates, controls, audits, and operates.

## Core Philosophy

```
Customer = Data Owner
Partner = Authorized Business Processor
Platform = Orchestrator, Controller, Auditor, Operator
```

**Not** designed as: "Partner owns all customers"

**Designed as:** Partner gets permissions per:
- Which customer
- Which business service
- Which request
- Which file
- Which timeframe
- Which permission level

---

## Key Decisions to Discuss

### 1. Data Ownership Model

**Question:** Should `organization_id` be the primary owner of all business data?

**Options:**
- **A. Organization owns all data** — All business entities (requests, files, documents) belong to organization
- **B. Hybrid ownership** — Some data owned by partner, some by organization

**Recommendation:** Option A — Organization is data owner

### 2. Partner Access Model

**Question:** How should partners access customer data?

**Options:**
- **A. Engagement-based** — Partner sees data only via active engagement + service scope
- **B. Direct assignment** — Partner assigned directly to requests/files
- **C. Both** — Engagement for service scope, direct assignment for specific requests

**Recommendation:** Option C — Hybrid model

### 3. Database Technology

**Question:** Should we migrate from SQLite to PostgreSQL?

**Options:**
- **A. Keep SQLite** — MVP scope, simpler operations
- **B. Migrate to PostgreSQL** — Full JSONB support, better for multi-tenant

**Recommendation:** Option B — PostgreSQL for JSONB and multi-tenant isolation

### 4. API Versioning

**Question:** How to version APIs for multi-tenant/multi-partner?

**Options:**
- **A. /api/v1/...** — Simple, consistent
- **B. /api/partners/... and /api/organizations/...** — Separate namespaces
- **C. /api/v1/partners/... and /api/v1/organizations/...** — Versioned with separation

**Recommendation:** Option C — Versioned with context-based access

---

## Architecture Decisions Already Made

### Data Ownership
```
legal_requests.organization_id
files.organization_id
generated_documents.organization_id
vault_files.organization_id
workflow_instances.organization_id
```

**NOT:** `file.partner_id = Partner X`

**YES:** `file.organization_id = Organization A` + `file.accessed_by_partner_id = Partner X if granted`

### Tenant-Aware Repository Pattern
```typescript
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

### RequestContext Structure
```typescript
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

## New Tables to Add

Based on the architecture document:

| Table | Purpose |
|-------|---------|
| `tenants` | Shared platform tenant (future: dedicated tenants) |
| `partners` | Service providers |
| `partner_members` | Users belonging to partners |
| `partner_organization_engagements` | Partner-organization relationships |
| `engagement_service_scopes` | Service types per engagement |
| `service_types` | Catalog of business services |
| `partner_service_types` | Partner service offerings |
| `api_clients` | Partner API credentials |
| `api_usage_logs` | Partner API usage tracking |
| `webhook_endpoints` | Partner webhook subscriptions |
| `webhook_deliveries` | Webhook delivery tracking |

---

## Existing Tables to Modify

| Table | Changes |
|-------|---------|
| `organizations` | Add `tenant_id`, `code` |
| `users` | Add `partner_members` relation |
| `legal_requests` | Add `engagement_id`, `assigned_partner_id` |
| `files` | Add `tenant_id`, `partner_id` for access tracking |

---

## Scope Questions

### Q1: API Clients for Partners
Implement now or defer to future phase?

### Q2: Webhooks for Partners
Implement now or defer to future phase?

### Q3: Partner Self-Service Portal
Create partner dashboard UI or defer?

### Q4: Inheritance for Workflows/Templates
Implement 3-tier inheritance (Platform → Partner → Organization) now or simplified version?

---

## Next Steps

1. Confirm data ownership model
2. Confirm access control approach
3. Decide database migration strategy
4. Plan schema changes
5. Create implementation plan

---

*Context created: 2026-06-14*
*Source: docs/shared_customer_partner_collaboration.md*
