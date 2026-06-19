# Phase 73: Shared Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-19
**Phase:** 73-shared-foundation
**Areas discussed:** Seed Data Organization, API Client + Hooks Conventions, Shared Component Standards, Integration với Existing Code, Auth Access Pattern, Cache Strategy Details, Seed Data Relationships, Migration Safety

---

## 1. Seed Data Organization

| Option | Description | Selected |
|--------|-------------|----------|
| By entity type | users.ts, organizations.ts, workspaces.ts, requests.ts. Mỗi file tự chứa. | |
| By domain cluster | users-and-auth.ts, orgs-and-workspaces.ts, requests-and-docs.ts, partners.ts. Group entities có quan hệ. | |
| By business layer | foundation.ts (users, orgs, workspaces), operations.ts (requests, vault, messages), partners.ts. Group theo business flow. | ✓ |

**User's choice:** By business layer
**Notes:** Clear separation between foundational entities, operational data, and partner relationships. Easier to understand data flow.

---

## 2. Seed Execution Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Sequential with transaction | Chạy theo thứ tự. Nếu 1 file fail, stop và rollback. Đảm bảo data integrity. | ✓ |
| Sequential without transaction | Chạy theo thứ tự. Nếu 1 file fail, log error và continue. Nhanh hơn nhưng có partial data. | |
| Parallel execution | Chạy tất cả files parallel. Nhanh nhất nhưng khó kiểm soát dependencies. | |

**User's choice:** Sequential with transaction
**Notes:** Data integrity là priority. Seed data phải all-or-nothing để tránh inconsistent state.

---

## 3. Wipe Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Wipe all tables | Xóa tất cả data trước khi seed. Clean slate. | ✓ |
| Upsert | Insert mới, update existing. Giữ data cũ. | |
| Selective wipe | Chỉ wipe tables sẽ seed. Phức tạp hơn. | |

**User's choice:** Wipe all tables
**Notes:** Đơn giản nhất. Dev environment không cần giữ data cũ. Mỗi lần seed là fresh start.

---

## 4. Seed Export Pattern

| Option | Description | Selected |
|--------|-------------|----------|
| Default export | Mỗi file export default async function. index.ts import và gọi. Đơn giản. | ✓ |
| Named exports | Mỗi file export named functions. index.ts import specific functions. Linh hoạt hơn. | |
| Object with metadata | Mỗi file export { name, seed }. index.ts iterate array. Có metadata nhưng verbose. | |

**User's choice:** Default export
**Notes:** Đơn giản, rõ ràng. index.ts chỉ cần import và await.

---

## 5. API Client Enhancement

| Option | Description | Selected |
|--------|-------------|----------|
| Enhance existing client | Thêm retry, toast, 401 redirect vào existing client.ts. Non-breaking. | ✓ |
| Create new client-v2 | Tạo client mới với full features. Old client giữ nguyên. Clean separation nhưng duplicate. | |
| Wrapper layer | Tạo wrapper xung quanh existing client. Thêm features ở layer trên. | |

**User's choice:** Enhance existing client
**Notes:** Giữ backward compat. Existing code tiếp tục work. Thêm features incrementally.

---

## 6. Hook Migration Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Migrate to ApiClient | Refactor useRequests, useUsers để dùng ApiClient thay vì direct fetch. | ✓ |
| Keep both | Giữ old hooks, tạo new hooks dùng ApiClient. An toàn nhưng duplicate. | |
| Deprecate old | Deprecate old hooks, khuyến khích dùng new. Gradual migration. | |

**User's choice:** Migrate to ApiClient
**Notes:** Consistency là quan trọng. Tất cả hooks nên dùng same pattern.

---

## 7. Query StaleTime

| Option | Description | Selected |
|--------|-------------|----------|
| 5 minutes global | Tất cả queries dùng 5 minutes. Đơn giản. | |
| 30 seconds (existing) | Giữ nguyên 30s như current hooks. Fast refresh. | |
| Per-entity defaults | Requests 10min, users 2min, audit 1min. Theo data freshness needs. | ✓ |

**User's choice:** Per-entity defaults
**Notes:** Different entities có different update frequencies. Requests thay đổi nhiều hơn users.

---

## 8. Query Key Pattern

| Option | Description | Selected |
|--------|-------------|----------|
| Array with filter object | ['requests', { status: 'pending' }]. Filter options là object trong array. Dễ invalidation. | ✓ |
| Flat string with filter | 'requests-pending'. Concatenate filter vào string. Đơn giản nhưng khó invalidation. | |

**User's choice:** Array with filter object
**Notes:** React Query recommended pattern. Dễ cache invalidation khi filter thay đổi.

---

## 9. Shared Component Styling

| Option | Description | Selected |
|--------|-------------|----------|
| Pure Tailwind CSS | Chỉ dùng Tailwind classes. Consistent với Ant Design removal decision. | ✓ |
| Tailwind + shadcn/ui | Dùng shadcn/ui patterns (Radix primitives + Tailwind). Modern nhưng thêm dependency. | |
| Custom CSS | Viết CSS riêng. Full control nhưng không leverage Tailwind. | |

**User's choice:** Pure Tailwind CSS
**Notes:** Align với project goal: remove Ant Design. Keep dependencies minimal.

---

## 10. Toast Component

| Option | Description | Selected |
|--------|-------------|----------|
| Custom Tailwind toast | Tự viết toast component với Tailwind. Full control nhưng nhiều code. | |
| react-hot-toast | Lightweight library (4KB), production-tested, Tailwind-stylable. | ✓ |

**User's choice:** react-hot-toast
**Notes:** Utility library, không phải UI framework. Lightweight và well-maintained. Vẫn có thể style với Tailwind.

---

## 11. LoadingSkeleton Variants

| Option | Description | Selected |
|--------|-------------|----------|
| Single component + variants | 1 component với variants prop (card, table-row, list-item, text-line). Reusable. | ✓ |
| Multiple components | LoadingSkeletonCard, LoadingSkeletonTable, etc. Separate files. | |

**User's choice:** Single component + variants
**Notes:** DRY principle. Dễ maintain. Variants chỉ là styling differences.

---

## 12. i18n Keys for Shared Components

| Option | Description | Selected |
|--------|-------------|----------|
| common.* namespace | common.error.title, common.loading.text, common.empty.message. Centralized. | |
| Per-component namespace | ErrorBoundary.title, LoadingSkeleton.text, EmptyState.message. Clear source. | ✓ |

**User's choice:** Per-component namespace
**Notes:** Dễ track keys về component. Tránh namespace collision. Self-documenting.

---

## 13. Shared Components Location

| Option | Description | Selected |
|--------|-------------|----------|
| shared/ui/ folder | src/components/shared/ui/. Cùng folder với StatCard.tsx hiện tại. | ✓ |
| ui/ folder riêng | src/components/ui/. Tách biệt khỏi shared/. | |

**User's choice:** shared/ui/ folder
**Notes:** Consistent với existing structure. StatCard đã ở đó.

---

## 14. QueryClient Setup

| Option | Description | Selected |
|--------|-------------|----------|
| Centralized at root | 1 QueryClient instance tại root layout. Tất cả screens share. | ✓ |
| Per-screen QueryClient | Mỗi screen có QueryClient riêng. Isolated nhưng duplicate. | |

**User's choice:** Centralized at root
**Notes:** Single source of truth. Easier cache management. React Query recommended pattern.

---

## 15. Hook Pattern

| Option | Description | Selected |
|--------|-------------|----------|
| Hook wraps API module | useRequests calls requestsApi.list(). Reuse API logic. | ✓ |
| Hook dùng ApiClient directly | useRequests calls apiClient.get('/api/requests'). Independent nhưng duplicate. | |

**User's choice:** Hook wraps API module
**Notes:** Reuse existing API modules. Single responsibility: hooks handle React Query, API modules handle HTTP.

---

## 16. Hook Error Handling

| Option | Description | Selected |
|--------|-------------|----------|
| Hook throws, component catches | Hooks throw errors. Components decide: show toast, render error UI, retry. | ✓ |
| Hook tự động show toast | Hooks catch errors và auto show toast. Simple nhưng ít linh hoạt. | |
| Hook returns error object | Hooks return { data, error, isLoading }. Explicit nhưng verbose. | |

**User's choice:** Hook throws, component catches
**Notes:** Flexibility. Different components có different error handling needs.

---

## 17. Existing Hooks Migration

| Option | Description | Selected |
|--------|-------------|----------|
| Refactor in place | Giữ tên hooks, thay đổi implementation. Non-breaking. | ✓ |
| Tạo hooks mới | Tạo useRequestsV2, useUsersV2. Old hooks deprecated. | |
| Giữ cả hai | useRequests (old) và useRequestsQuery (new). Confusing. | |

**User's choice:** Refactor in place
**Notes:** Clean migration. No duplicate code. Existing components continue work.

---

## 18. Auth Hook Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Wrap useSession | useAuth wraps next-auth useSession(). Leverage existing auth system. | ✓ |
| Custom hook riêng | Tự viết useAuth từ scratch. Full control nhưng duplicate effort. | |

**User's choice:** Wrap useSession
**Notes:** next-auth đã handle session management. Không cần reinvent.

---

## 19. Auth Hook Return Type

| Option | Description | Selected |
|--------|-------------|----------|
| Basic | { user, isLoading, isAuthenticated }. Đơn giản. | ✓ |
| Extended | + permissions, workspace. Convenient nhưng tightly coupled. | |
| Full featured | + logout, login actions. Complex. | |

**User's choice:** Basic
**Notes:** Single responsibility. Permissions ở hook riêng.

---

## 20. Permission Checks

| Option | Description | Selected |
|--------|-------------|----------|
| Separate hook | usePermissions hook nhận user từ useAuth. Separation of concerns. | ✓ |
| Gộp vào useAuth | useAuth return cả permissions. Convenient nhưng violate SRP. | |

**User's choice:** Separate hook
**Notes:** Clean separation. Auth vs authorization là 2 concerns khác nhau.

---

## 21. Cache Strategy: staleTime

| Option | Description | Selected |
|--------|-------------|----------|
| Per-entity | Requests 2min, Users 5min, Audit 1min, Messages 1min, Vault 5min. | ✓ |
| Global 5min | Tất cả entities dùng 5 minutes. | |
| Global 2min | Tất cả entities dùng 2 minutes. | |

**User's choice:** Per-entity
**Notes:** Optimize theo data freshness needs. Audit/messages cần fresh hơn users/vault.

---

## 22. Retry Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| 3 lần exponential | Retry 3 lần: 1s, 2s, 4s. Như SPEC yêu cầu. | ✓ |
| Adaptive retry | 2 lần cho performance, 5 lần cho critical data. | |
| No retry | Không retry, fail fast. User retry manually. | |

**User's choice:** 3 lần exponential
**Notes:** Balance giữa resilience và performance. Align với SPEC.

---

## 23. Prefetch Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, common queries | Prefetch requests list, user profile khi login. Giảm latency. | ✓ |
| No prefetch | Chỉ fetch on-demand. Đơn giản hơn. | |

**User's choice:** Yes, common queries
**Notes:** Improve UX ở first load. Predictable queries.

---

## 24. Foreign Key Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Cascade delete | Delete parent auto deletes children. Database-level protection. | ✓ |
| Restrict delete | Phải delete children trước. Explicit nhưng complex. | |
| No constraints | Chỉ reference bằng ID, không FK constraints. Flexible nhưng risky. | |

**User's choice:** Cascade delete
**Notes:** Tự động cleanup. No orphaned records. Standard pattern.

---

## 25. Seeding Order

| Option | Description | Selected |
|--------|-------------|----------|
| Topological sort | Tự động sort dựa trên FK dependencies. Self-documenting. | ✓ |
| Manual order | Hardcode order trong index.ts. Full control nhưng hard to maintain. | |
| Parallel/Sequential hybrid | Parallel independent entities, sequential dependent. Optimized nhưng complex. | |

**User's choice:** Topological sort
**Notes:** Self-documenting. Tự động adapt khi schema thay đổi.

---

## 26. Seed Error Handling

| Option | Description | Selected |
|--------|-------------|----------|
| Full rollback | Rollback toàn bộ transaction nếu 1 entity fail. All-or-nothing. | ✓ |
| Skip and continue | Skip failed entities, continue seeding. Partial success. | |
| Stop and log | Stop immediately, log error. User investigate manually. | |

**User's choice:** Full rollback
**Notes:** Không có partial data state. Clean hoặc nothing.

---

## 27. Migration Breaking Changes

| Option | Description | Selected |
|--------|-------------|----------|
| Non-breaking | Giữ nguyên API signature, chỉ thay đổi implementation. | ✓ |
| Breaking allowed | Có thể thay đổi API, components update theo. | |
| Parallel implementation | New hooks với new API, deprecate old hooks. | |

**User's choice:** Non-breaking
**Notes:** Production safety. Existing components không cần changes.

---

## Claude's Discretion

None - user provided clear decisions for all areas.

---

## Deferred Ideas

None - all discussions stayed within Phase 73 scope.
