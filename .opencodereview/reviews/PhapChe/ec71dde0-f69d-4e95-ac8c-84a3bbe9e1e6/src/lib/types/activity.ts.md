# Review: `src/lib/types/activity.ts`

**Project:** PhapChe | **Review:** `ec71dde0-f69d-4e95-ac8c-84a3bbe9e1e6`

**Comments:** 4

---

## 🟠 High (1)

**🐛 Bug** · lines 11-20

If the server sends an activity type not in the `ActivityType` union (e.g., a newly added backend type), lookups in `ACTIVITY_COLORS` and `ACTIVITY_ICON_NAMES` will return `undefined`. This can cause runtime errors when the color/icon is used in UI components (e.g., passing `undefined` to a CSS class or icon renderer). Consider adding a fallback type like `'unknown'` to the union and providing default values in both lookup maps, or adding runtime guards at the point of consumption.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
export type ActivityType =
  | 'user'
  | 'workspace'
  | 'request'
  | 'document'
  | 'review'
  | 'message'
  | 'vault'
  | 'partner'
  | 'system'
  | 'unknown';  // Fallback for unrecognized activity types from the server
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export type ActivityType =
  | 'user'           // Hoạt động liên quan đến user (login, logout, profile update)
  | 'workspace'      // Hoạt động workspace (create, update, invite member)
  | 'request'        // Hoạt động request (created, assigned, transitioned)
  | 'document'       // Hoạt động document (upload, download, viewed)
  | 'review'         // Hoạt động review (started, approved, rejected)
  | 'message'        // Hoạt động message (sent, received)
  | 'vault'          // Hoạt động vault (file stored, folder created)
  | 'partner'        // Hoạt động partner (invited, status changed)
  | 'system';        // Hoạt động hệ thống (backup, maintenance)
```
</details>


## 🟡 Medium (3)

**🐛 Bug** · line 6

The `LucideIcon` type is imported but never used anywhere in this file. This is dead code that should be removed to keep imports clean and avoid confusion.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
// (remove this line — LucideIcon is unused)
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
import type { LucideIcon } from 'lucide-react';
```
</details>

---

**🔧 Maintainability** · line 58

The `action` field is typed as a plain `string`, but the comment suggests a structured dot-notation pattern like `'request.created'`, `'user.login'`. Using a string literal union type (or at minimum a template literal type) would catch typos at compile time, improve autocomplete in editors, and serve as the single source of truth for valid action keys.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  // Consider using a string literal union:
  // action: `${ActivityType}.${string}` | 'request.created' | 'user.login' | ...;
  action: string;              // Action key: 'request.created', 'user.login', etc.
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  action: string;              // Action key: 'request.created', 'user.login', etc.
```
</details>

---

**🐛 Bug** · line 66

The `relativeTime` field stores a pre-computed localized string (e.g., '5 phút trước') that will become stale immediately after the data is fetched. Displaying this value later will show incorrect relative time. It is better to derive `relativeTime` from the `timestamp` field on the client side at render time, or remove this field entirely and compute it in the UI layer.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  // Consider removing relativeTime and computing it from timestamp at render time:
  // relativeTime: string;  // REMOVE — compute from `timestamp` on the client
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  relativeTime: string;        // Thời gian tương đối: "5 phút trước", "2 giờ trước"
```
</details>


