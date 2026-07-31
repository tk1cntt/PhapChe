# Review: `src/lib/types/partner.ts`

**Project:** PhapChe | **Review:** `19097c59-5574-418b-86a9-7db933cc9685`

**Comments:** 2

---

## 🟠 High (1)

**🐛 Bug** · lines 12-23

The `createdAt` and `updatedAt` fields are typed as `Date`, but API responses serialize dates as ISO strings (e.g., `"2025-01-01T00:00:00.000Z"`). After `JSON.parse()` or `fetch().json()`, these fields will be `string` at runtime, not `Date`. This mismatch can cause runtime errors when calling Date methods (e.g., `.toLocaleDateString()`) on what is actually a string. Consider using `string` for the serialized form, or create a separate `PartnerResponse` interface with `string` timestamps and a transform layer.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
export interface Partner {
  id: string;
  name: string;
  slug: string;
  type: PartnerType;
  contactEmail?: string;
  phone?: string;
  address?: string;
  status: PartnerStatus;
  createdAt: string; // ISO 8601 date string from API
  updatedAt: string; // ISO 8601 date string from API
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export interface Partner {
  id: string;
  name: string;
  slug: string;
  type: PartnerType;
  contactEmail?: string;
  phone?: string;
  address?: string;
  status: PartnerStatus;
  createdAt: Date;
  updatedAt: Date;
}
```
</details>


## 🟡 Medium (1)

**🐛 Bug** · lines 28-35

The `type` field is optional in `CreatePartnerInput` but required (non-optional) in the `Partner` interface. If a partner is created without specifying `type`, the resulting entity would have an `undefined` type, which violates the `Partner` contract. Either make `type` required in `CreatePartnerInput` or make it optional in `Partner` with a sensible default at the API/data layer.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
export interface CreatePartnerInput {
  name: string;
  slug: string;
  type: PartnerType; // Required to match Partner interface
  contactEmail?: string;
  phone?: string;
  address?: string;
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export interface CreatePartnerInput {
  name: string;
  slug: string;
  type?: PartnerType;
  contactEmail?: string;
  phone?: string;
  address?: string;
}
```
</details>


