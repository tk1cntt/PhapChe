# Review: `src/lib/workflow/inheritance-resolver.ts`

**Project:** PhapChe | **Review:** `a5e1ec0d-5ea1-415f-a92e-75934d9a2c3f`

**Comments:** 5

---

## 🔴 Critical (1)

**🐛 Bug** · lines 52-61

serviceTypeId is never passed to getWorkflowFn, so the resolver cannot distinguish between different workflows for the same organization/partner. This means all service types under the same org/partner will resolve to whichever workflow is returned first, returning incorrect results.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  async resolveWorkflow(
    serviceTypeId: string,
    organizationId: string,
    partnerId: string | null,
    getWorkflowFn: (ownerType: InheritanceOwnerType, ownerId: string | null, serviceTypeId: string) => Promise<ResolvableEntity | null>,
  ): Promise<InheritanceResolutionResult | null> {
    const chain: Array<{ level: InheritanceOwnerType; entityId: string }> = [];

    // 1. Organization override
    const orgWorkflow = await getWorkflowFn('organization', organizationId, serviceTypeId);
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  async resolveWorkflow(
    serviceTypeId: string,
    organizationId: string,
    partnerId: string | null,
    getWorkflowFn: (ownerType: InheritanceOwnerType, ownerId: string | null) => Promise<ResolvableEntity | null>,
  ): Promise<InheritanceResolutionResult | null> {
    const chain: Array<{ level: InheritanceOwnerType; entityId: string }> = [];

    // 1. Organization override
    const orgWorkflow = await getWorkflowFn('organization', organizationId);
```
</details>


## 🟠 High (2)

**🐛 Bug** · lines 60-62

All three getWorkflowFn calls lack try/catch. A DB error will propagate as an unhandled promise rejection, potentially crashing the process. Wrap each call or the entire resolution block in try/catch with appropriate error handling.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    try {
      // 1. Organization override
      const orgWorkflow = await getWorkflowFn('organization', organizationId, serviceTypeId);
      if (orgWorkflow && orgWorkflow.status === 'active') {
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    // 1. Organization override
    const orgWorkflow = await getWorkflowFn('organization', organizationId);
    if (orgWorkflow && orgWorkflow.status === 'active') {
```
</details>

---

**🐛 Bug** · lines 52-61

No null check on getWorkflowFn before calling it. If the caller accidentally passes null/undefined, the await will throw a TypeError that is indistinguishable from a DB failure. Add a guard clause or TypeScript assertion at the start of resolveWorkflow.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  async resolveWorkflow(
    serviceTypeId: string,
    organizationId: string,
    partnerId: string | null,
    getWorkflowFn: (ownerType: InheritanceOwnerType, ownerId: string | null) => Promise<ResolvableEntity | null>,
  ): Promise<InheritanceResolutionResult | null> {
    if (!getWorkflowFn) {
      throw new Error('getWorkflowFn is required for resolution');
    }
    const chain: Array<{ level: InheritanceOwnerType; entityId: string }> = [];

    // 1. Organization override
    const orgWorkflow = await getWorkflowFn('organization', organizationId);
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  async resolveWorkflow(
    serviceTypeId: string,
    organizationId: string,
    partnerId: string | null,
    getWorkflowFn: (ownerType: InheritanceOwnerType, ownerId: string | null) => Promise<ResolvableEntity | null>,
  ): Promise<InheritanceResolutionResult | null> {
    const chain: Array<{ level: InheritanceOwnerType; entityId: string }> = [];

    // 1. Organization override
    const orgWorkflow = await getWorkflowFn('organization', organizationId);
```
</details>


## 🟡 Medium (2)

**🐛 Bug** · lines 62-68

The chain in the organization override path only includes the organization entry, unlike the partner and platform branches which include 'none' entries for skipped levels. This inconsistency means consumers cannot reliably determine the full resolution path — the absence of partner/platform entries could mean 'not checked' rather than 'not found'.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    if (orgWorkflow && orgWorkflow.status === 'active') {
      return {
        resolved: orgWorkflow,
        chain: [
          { level: 'organization', entityId: orgWorkflow.id },
          { level: 'partner', entityId: 'none' },
          { level: 'platform', entityId: 'none' },
        ],
        mode: orgWorkflow.inheritanceMode,
      };
    }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    if (orgWorkflow && orgWorkflow.status === 'active') {
      return {
        resolved: orgWorkflow,
        chain: [...chain, { level: 'organization', entityId: orgWorkflow.id }],
        mode: orgWorkflow.inheritanceMode,
      };
    }
```
</details>

---

**🐛 Bug** · lines 106-113

resolveTemplate delegates to resolveWorkflow but passes serviceTypeId which is never used by the underlying method. The same critical bug applies: templates cannot be resolved per-service-type. If templates are meant to be resolved differently, they need their own implementation; otherwise the serviceTypeId parameter should be forwarded to getTemplateFn.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  async resolveTemplate(
    serviceTypeId: string,
    organizationId: string,
    partnerId: string | null,
    getTemplateFn: (ownerType: InheritanceOwnerType, ownerId: string | null, serviceTypeId: string) => Promise<ResolvableEntity | null>,
  ): Promise<InheritanceResolutionResult | null> {
    return this.resolveWorkflow(serviceTypeId, organizationId, partnerId, getTemplateFn);
  }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  async resolveTemplate(
    serviceTypeId: string,
    organizationId: string,
    partnerId: string | null,
    getTemplateFn: (ownerType: InheritanceOwnerType, ownerId: string | null) => Promise<ResolvableEntity | null>,
  ): Promise<InheritanceResolutionResult | null> {
    return this.resolveWorkflow(serviceTypeId, organizationId, partnerId, getTemplateFn);
  }
```
</details>


