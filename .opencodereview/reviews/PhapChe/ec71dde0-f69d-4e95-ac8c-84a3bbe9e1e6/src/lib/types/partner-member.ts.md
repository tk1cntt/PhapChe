# Review: `src/lib/types/partner-member.ts`

**Project:** PhapChe | **Review:** `ec71dde0-f69d-4e95-ac8c-84a3bbe9e1e6`

**Comments:** 3

---

## 🟡 Medium (2)

**🔧 Maintainability** · lines 11-32

Ambiguous `isActive` flags: Both `PartnerMember.isActive` (line 13) and the nested `user.isActive` (line 29) exist. Downstream code checking membership status must decide which flag to use — the member-level flag could mean "this membership is active" while the user-level flag could mean "this user account is active." These can diverge (e.g., a user is deactivated platform-wide but their membership record still shows active), leading to subtle bugs. Consider renaming one or both (e.g., `isMembershipActive` / `isUserAccountActive`) or adding JSDoc to clarify the semantic difference.

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export interface PartnerMember {
  id: string;
  partnerId: string;
  userId: string;
  role: PartnerMemberRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * PartnerMember with user details for listing
 */
export interface PartnerMemberWithUser extends PartnerMember {
  user: {
    id: string;
    email: string;
    name: string;
    avatar?: string;
    isActive: boolean;
  };
}
```
</details>

---

**🔧 Maintainability** · lines 37-40

`AddPartnerMemberInput.role` is optional with no documented default. When `role` is omitted, what value is assigned — `'member'`? Without a comment or default in the type-defining layer, API consumers and UI code may make inconsistent assumptions, leading to members being created with unintended roles.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
export interface AddPartnerMemberInput {
  userId: string;
  /** Defaults to 'member' if not specified. */
  role?: PartnerMemberRole;
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export interface AddPartnerMemberInput {
  userId: string;
  role?: PartnerMemberRole;
}
```
</details>


## 🔵 Low (1)

**🔧 Maintainability** · lines 24-32

`PartnerMemberWithUser` exposes `user.email` and `user.name` — PII fields. While this is a type-only file and harmless on its own, the type is named for "listing" (as the JSDoc says), which implies it may be used in API responses or UI data. Ensure that any code consuming this type for client-facing views applies proper authorization checks and avoids leaking PII to unauthorized parties.

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export interface PartnerMemberWithUser extends PartnerMember {
  user: {
    id: string;
    email: string;
    name: string;
    avatar?: string;
    isActive: boolean;
  };
}
```
</details>


