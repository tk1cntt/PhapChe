# Review: `src/lib/types/user.ts`

**Project:** PhapChe | **Review:** `d142b51d-e8c0-4364-af77-2335c5770baa`

**Comments:** 4

---

## 🟡 Medium (3)

**🔧 Maintainability** · lines 49-57

Field inconsistency: `User.language` is optional (`language?: string`), but `UserProfile.language` is required (`language: string`). When mapping from `User` to `UserProfile`, you must provide a fallback/default for `language` or risk a type error. Consider either making `UserProfile.language` optional (if the UI can handle missing language) or ensuring `User.language` is always populated during data fetching.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  phone?: string;
  title?: string;
  language: string; // Ensure a default (e.g., 'en') is provided when mapping from User
  notifications: NotificationSettings;
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  phone?: string;
  title?: string;
  language: string;
  notifications: NotificationSettings;
}
```
</details>

---

**🔧 Maintainability** · lines 49-57

Field inconsistency: `User.notifications` is optional (`notifications?: NotificationSettings`), but `UserProfile.notifications` is required (`notifications: NotificationSettings`). When mapping from `User` to `UserProfile`, the notifications field may be `undefined`, causing a type mismatch. Either make `UserProfile.notifications` optional or ensure defaults are applied during the mapping.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  phone?: string;
  title?: string;
  language: string;
  notifications: NotificationSettings; // Consider making optional or ensure defaults when mapping from User
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  phone?: string;
  title?: string;
  language: string;
  notifications: NotificationSettings;
}
```
</details>

---

**🐛 Bug** · lines 95-101

`Session.expiresAt` is typed as `Date`, but session data commonly arrives from JSON APIs as an ISO-8601 string or a numeric timestamp. If the consuming code does not explicitly convert the raw value to a `Date` object, calling `Date` methods on it will fail at runtime. Consider typing it as `string | Date` or `number`, and add a comment documenting the expected format.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
export interface Session {
  userId: string;
  email: string;
  role: Role;
  workspaceId?: string;
  /** ISO-8601 timestamp string; convert to Date before use if needed */
  expiresAt: string;
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export interface Session {
  userId: string;
  email: string;
  role: Role;
  workspaceId?: string;
  expiresAt: Date;
}
```
</details>


## 🔵 Low (1)

**🔧 Maintainability** · lines 84-90

`CreateUserInput` and `UpdateUserInput` do not expose `notifications` (NotificationSettings). If an admin is expected to configure notification preferences when creating/updating users, this field should be added. If notification management is handled via a separate endpoint, consider adding a comment to clarify the intentional omission.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
export interface UpdateUserInput {
  name?: string;
  phone?: string;
  title?: string;
  role?: Role;
  isActive?: boolean;
  // notifications?: NotificationSettings; // If needed: notification management handled separately
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export interface UpdateUserInput {
  name?: string;
  phone?: string;
  title?: string;
  role?: Role;
  isActive?: boolean;
}
```
</details>


