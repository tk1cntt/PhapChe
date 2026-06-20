---
status: issues_found
files_reviewed: 42
critical: 3
warning: 8
info: 6
total: 17
---

# Phase 73 Code Review Report

## Summary

Reviewed 42 files from Phase 73 (shared-foundation) including seed data, API client, React Query setup, hooks, shared components, and comprehensive test suites. Found **3 critical issues**, **8 warnings**, and **6 info-level suggestions**.

**Main concerns:**
- Hardcoded credentials in seed files pose security risks
- API client retry logic has edge cases that could cause issues
- Permission system is client-side only without backend validation
- Some components lack proper error boundaries

---

## Critical Findings (CR)

### CR-01: Hardcoded Passwords in Seed Data
**File:** `prisma/seed/foundation.ts:6-15`  
**Severity:** Critical  
**Category:** Security

**Issue:**
Seed data contains hardcoded plain-text passwords (`Admin@123456`, `Customer@123456`) that are visible in source code. While they are hashed before storage, the plain text passwords remain in the codebase and could be:
- Exposed in version control history
- Accidentally used in production environments
- Discovered by developers/testers who might reuse them

**Code:**
```typescript
const seedUsers = [
  { email: 'superadmin@phapche.test', password: 'Admin@123456', ... },
  { email: 'admin@phapche.test', password: 'Admin@123456', ... },
  // ... more users with same password
];
```

**Impact:**
- Security risk if seed script is accidentally run in production
- Password reuse across multiple users weakens security
- Violates security best practices for credential management

**Recommendation:**
1. Move passwords to environment variables:
```typescript
const seedUsers = [
  { 
    email: 'superadmin@phapche.test', 
    password: process.env.SEED_ADMIN_PASSWORD || 'TempPassword123!', 
    ... 
  },
];
```

2. Add validation to prevent seed script from running in production:
```typescript
if (process.env.NODE_ENV === 'production') {
  throw new Error('Seed script cannot run in production');
}
```

3. Generate random passwords for non-development environments

---

### CR-02: API Client 401 Redirect Loop Risk
**File:** `src/lib/api/client.ts:35-36`  
**Severity:** Critical  
**Category:** Security / UX

**Issue:**
The API client automatically redirects to `/login` on 401 responses without checking if the user is already on the login page. This can cause an infinite redirect loop.

**Code:**
```typescript
function handleError(status: number, error: Error): never {
  if (status === 401 && typeof window !== 'undefined') {
    window.location.href = '/login';  // No check if already on /login
  }
  // ...
}
```

**Impact:**
- Infinite redirect loop if user is on `/login` page and gets 401
- Poor user experience with browser warning about too many redirects
- Could mask underlying authentication issues

**Recommendation:**
```typescript
function handleError(status: number, error: Error): never {
  if (status === 401 && typeof window !== 'undefined') {
    // Avoid redirect loop
    if (!window.location.pathname.startsWith('/login')) {
      // Save current path for redirect after login
      const returnPath = window.location.pathname + window.location.search;
      window.location.href = `/login?returnUrl=${encodeURIComponent(returnPath)}`;
    }
  } else if (status === 403) {
    toastError('Không có quyền truy cập');
  }
  // ...
}
```

---

### CR-03: Client-Side Permission System Without Backend Validation
**File:** `src/hooks/usePermissions.ts:23-45`  
**Severity:** Critical  
**Category:** Security

**Issue:**
The permission system is entirely client-side with hardcoded permission matrix. This can be bypassed by:
- Modifying client-side code
- Direct API calls bypassing the hook
- Browser developer tools

**Code:**
```typescript
const permissions: Record<string, string[]> = {
  super_admin: ['*'],
  coordinator_admin: ['read:requests', 'write:requests', ...],
  // ... hardcoded permissions
};

const can = (action: string, resource?: string): boolean => {
  // Client-side check only
  const rolePermissions = permissions[role] || [];
  if (rolePermissions.includes('*')) return true;
  // ...
};
```

**Impact:**
- Security vulnerability if backend doesn't validate permissions
- False sense of security for developers
- Potential unauthorized data access if API endpoints aren't protected

**Recommendation:**
1. **Backend must validate all permissions** - this hook should only control UI visibility
2. Fetch permissions from backend API:
```typescript
export function usePermissions() {
  const { user } = useAuth();
  const { data: permissions } = useQuery({
    queryKey: ['permissions', user?.id],
    queryFn: () => apiClient.get(`/api/users/${user?.id}/permissions`),
    enabled: !!user?.id,
  });

  const can = (action: string, resource?: string): boolean => {
    if (!permissions) return false;
    return permissions.includes(`${action}:${resource}`) || permissions.includes('*');
  };
  
  return { can, cannot: (action, resource) => !can(action, resource) };
}
```

3. Add documentation warning that this is UI-only:
```typescript
/**
 * WARNING: This hook is for UI visibility only.
 * Backend MUST validate all permissions on API endpoints.
 */
export function usePermissions() { ... }
```

---

## Warning Findings (WR)

### WR-01: API Client Retry Logic Not True Exponential Backoff
**File:** `src/lib/api/client.ts:72`  
**Severity:** Warning  
**Category:** Code Quality

**Issue:**
The retry delays are fixed (500ms, 1000ms, 2000ms) rather than true exponential backoff. True exponential backoff should multiply the delay (e.g., 500ms, 1000ms, 2000ms, 4000ms).

**Code:**
```typescript
const retryDelays = [500, 1000, 2000]; // Linear, not exponential
```

**Impact:**
- Less effective at handling server overload
- Doesn't follow industry best practices for retry logic
- Could contribute to server load during outages

**Recommendation:**
```typescript
const baseDelay = 500;
const retryDelays = [0, 1, 2, 3].map(i => baseDelay * Math.pow(2, i));
// Results in: [500, 1000, 2000, 4000]

// Add jitter to prevent thundering herd
const getRetryDelay = (attempt: number) => {
  const delay = baseDelay * Math.pow(2, attempt);
  const jitter = Math.random() * 0.3 * delay; // 0-30% jitter
  return delay + jitter;
};
```

---

### WR-02: Seed Data Creates Invalid SLA Deadlines
**File:** `prisma/seed/operations.ts:165`  
**Severity:** Warning  
**Category:** Data Integrity

**Issue:**
Some seed requests have SLA deadlines set to -5 days in the past, which may not be valid for the application logic.

**Code:**
```typescript
const slaDays = i % 5 === 0 ? -5 : (i % 10) + 5; // Some overdue
const slaDeadline = new Date();
slaDeadline.setDate(slaDeadline.getDate() + slaDays);
```

**Impact:**
- May cause unexpected behavior in SLA calculation logic
- Could trigger false alerts in monitoring systems
- Doesn't represent realistic test data

**Recommendation:**
```typescript
// Use realistic SLA ranges
const slaDays = [3, 5, 7, 10, 14][i % 5]; // All positive, realistic SLAs
const slaDeadline = new Date();
slaDeadline.setDate(slaDeadline.getDate() + slaDays);

// If you need overdue items for testing, create them explicitly:
if (i < 5) {
  // Mark as overdue via status, not negative SLA
  status = 'overdue';
}
```

---

### WR-03: Query Key Factory Allows Object Mutation
**File:** `src/lib/query-keys.ts:16-17`  
**Severity:** Warning  
**Category:** Code Quality

**Issue:**
The query key factory passes filter objects by reference, which could lead to cache invalidation issues if the object is mutated.

**Code:**
```typescript
list: (filters?: Record<string, unknown>) =>
  filters ? [entity, 'list', filters] as const : [entity, 'list'] as const,
```

**Test confirms this behavior:**
```typescript
it('filters objects are passed by reference (not cloned)', () => {
  const filters = { page: 1 };
  const key = queryKeys.users.list(filters);
  expect(key[2]).toBe(filters); // Same reference
});
```

**Impact:**
- If filter object is mutated after query key creation, cache may not invalidate correctly
- Could lead to stale data being displayed
- Hard to debug cache issues

**Recommendation:**
```typescript
list: (filters?: Record<string, unknown>) =>
  filters ? [entity, 'list', { ...filters }] as const : [entity, 'list'] as const,
// Clone the filters object

// Or use a stable serialization:
list: (filters?: Record<string, unknown>) =>
  filters ? [entity, 'list', JSON.stringify(filters)] as const : [entity, 'list'] as const,
```

---

### WR-04: Missing Error Boundary in Layout
**File:** `src/app/layout.tsx`  
**Severity:** Warning  
**Category:** Code Quality

**Issue:**
The root layout doesn't wrap the application with an ErrorBoundary component, which could lead to unhandled render errors crashing the entire app.

**Code:**
```typescript
export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body>
        <AntdRegistry>
          <QueryProvider>
            {children}  // No ErrorBoundary wrapper
            <Toaster position="top-right" />
          </QueryProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
```

**Impact:**
- Unhandled render errors will crash the entire application
- Poor user experience with white screen of death
- No way to recover from errors gracefully

**Recommendation:**
```typescript
import { ErrorBoundaryWrapper } from '@/components/shared/ui';

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body>
        <ErrorBoundaryWrapper>
          <AntdRegistry>
            <QueryProvider>
              {children}
              <Toaster position="top-right" />
            </QueryProvider>
          </AntdRegistry>
        </ErrorBoundaryWrapper>
      </body>
    </html>
  );
}
```

---

### WR-05: useMessages Hook Passes Undefined requestId
**File:** `src/hooks/useMessages.ts:17-21`  
**Severity:** Warning  
**Category:** Code Quality

**Issue:**
The hook always passes `{ requestId }` to the API, even when `requestId` is undefined. This could cause issues with API validation or query optimization.

**Code:**
```typescript
export function useMessages(requestId?: string) {
  return useQuery({
    queryKey: queryKeys.messages.list({ requestId }), // { requestId: undefined }
    queryFn: () => messagesApi.getThreads({ requestId }),
  });
}
```

**Test confirms:**
```typescript
expect(messagesApi.getThreads).toHaveBeenCalledWith({ requestId: undefined });
```

**Impact:**
- API receives `{ requestId: undefined }` instead of no parameter
- Could cause validation errors or unexpected filtering behavior
- Query key includes undefined value

**Recommendation:**
```typescript
export function useMessages(requestId?: string) {
  return useQuery({
    queryKey: requestId 
      ? queryKeys.messages.list({ requestId }) 
      : queryKeys.messages.list(),
    queryFn: () => messagesApi.getThreads(
      requestId ? { requestId } : {}
    ),
  });
}
```

---

### WR-06: LoadingSkeleton Missing Unique Keys
**File:** `src/components/shared/ui/LoadingSkeleton.tsx:67-69`  
**Severity:** Warning  
**Category:** Code Quality

**Issue:**
When rendering multiple skeleton items, the component uses array index as key, which can cause React reconciliation issues if the list is reordered or filtered.

**Code:**
```typescript
{Array.from({ length: count }, (_, i) => (
  <SkeletonComponent key={i} className={className} />
))}
```

**Impact:**
- React may not properly track skeleton items during updates
- Could cause visual glitches during loading state transitions
- Minor performance impact

**Recommendation:**
```typescript
{Array.from({ length: count }, (_, i) => (
  <SkeletonComponent key={`${variant}-${i}`} className={className} />
))}
```

---

### WR-07: EmptyState Button Missing Type Attribute
**File:** `src/components/shared/ui/EmptyState.tsx:45-50`  
**Severity:** Warning  
**Category:** Accessibility

**Issue:**
The action button doesn't specify `type="button"`, which defaults to `type="submit"` in forms. This could trigger unintended form submissions.

**Code:**
```typescript
<button
  onClick={action.onClick}
  className="mt-6 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
>
  {displayActionLabel}
</button>
```

**Impact:**
- If EmptyState is used inside a form, clicking the button will submit the form
- Unexpected behavior that's hard to debug
- Accessibility issue

**Recommendation:**
```typescript
<button
  type="button"
  onClick={action.onClick}
  className="mt-6 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
>
  {displayActionLabel}
</button>
```

---

### WR-08: ErrorBoundary Same Issue with Button Type
**File:** `src/components/shared/ui/ErrorBoundary.tsx:80-85`  
**Severity:** Warning  
**Category:** Accessibility

**Issue:**
Same as WR-07 - the retry button doesn't specify `type="button"`.

**Code:**
```typescript
<button
  onClick={this.handleReset}
  className="mt-6 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
>
  {translations.retry}
</button>
```

**Recommendation:**
Add `type="button"` to prevent accidental form submissions.

---

## Info Findings (IN)

### IN-01: Seed Data Uses Realistic Vietnamese Names
**File:** `prisma/seed/foundation.ts:4-15`  
**Severity:** Info  
**Category:** Best Practice

**Positive:**
Seed data uses realistic Vietnamese names (Nguyễn Văn An, Trần Thị Bình, etc.) which is excellent for:
- Localization testing
- Realistic demo data
- Cultural appropriateness

**Suggestion:**
Document this in README or seed file comments to help developers understand the data is intentional.

---

### IN-02: API Client Could Benefit from Request/Response Logging
**File:** `src/lib/api/client.ts`  
**Severity:** Info  
**Category:** Enhancement

**Current:**
API client has retry logic and error handling but no logging.

**Suggestion:**
Add optional debug logging for development:
```typescript
private async request<T>(...) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[API] ${method} ${endpoint}`, { params, body });
  }
  
  // ... existing logic
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`[API] Response ${response.status}`, data);
  }
}
```

---

### IN-03: QueryClient Configuration is Reasonable
**File:** `src/lib/react-query.tsx:16-25`  
**Severity:** Info  
**Category:** Best Practice

**Positive:**
The QueryClient configuration follows React Query best practices:
- 5-minute staleTime prevents excessive refetching
- 30-minute gcTime balances memory usage with cache retention
- 3 retries handle transient failures
- refetchOnWindowFocus disabled prevents unnecessary requests

**Note:**
Consider making these configurable via environment variables for different environments (dev vs prod).

---

### IN-04: Comprehensive Test Coverage
**Files:** All test files  
**Severity:** Info  
**Category:** Best Practice

**Positive:**
Excellent test coverage including:
- API client retry logic with timing verification
- Hook behavior with mocked APIs
- Component rendering and interaction
- Edge cases (empty IDs, network errors, etc.)

**Test highlights:**
- `client.test.ts`: Tests exponential backoff timing
- `useRequests.test.tsx`: Tests loading, success, and error states
- `ErrorBoundary.test.tsx`: Tests error catching and recovery

---

### IN-05: i18n Implementation is Consistent
**Files:** `src/messages/*.json`, components  
**Severity:** Info  
**Category:** Best Practice

**Positive:**
Consistent use of next-intl for internationalization:
- All user-facing strings are translatable
- Support for 4 languages (vi, en, zh, ja)
- Fallback to default translations
- Proper namespace organization

**Suggestion:**
Consider adding translation keys for error messages in API client.

---

### IN-06: Component Props Are Well-Documented
**Files:** Component files  
**Severity:** Info  
**Category:** Best Practice

**Positive:**
Components have clear TypeScript interfaces with:
- Descriptive prop names
- Optional properties marked correctly
- JSDoc comments where helpful

**Example:**
```typescript
export interface LoadingSkeletonProps {
  variant: 'card' | 'table-row' | 'list-item' | 'text-line';
  count?: number;
  className?: string;
}
```

---

## Recommendations Summary

### Immediate Actions (Critical)
1. **Remove hardcoded passwords** from seed files and use environment variables
2. **Fix 401 redirect loop** by checking current path before redirecting
3. **Add backend permission validation** - client-side checks are UI-only

### Short-term Improvements (Warning)
1. Implement true exponential backoff with jitter
2. Fix SLA deadline generation to use realistic values
3. Clone filter objects in query key factory
4. Add ErrorBoundary to root layout
5. Fix undefined parameter passing in hooks
6. Add `type="button"` to all buttons

### Long-term Enhancements (Info)
1. Add debug logging to API client
2. Make QueryClient configuration environment-aware
3. Add translation keys for API error messages
4. Document seed data design decisions

---

## Test Coverage Analysis

**Strengths:**
- ✅ API client retry logic thoroughly tested
- ✅ Hook tests cover success, error, and loading states
- ✅ Component tests verify rendering and accessibility
- ✅ Edge cases tested (empty IDs, network errors)

**Gaps:**
- ⚠️ No tests for permission hook with different roles
- ⚠️ No integration tests for seed scripts
- ⚠️ No tests for 401 redirect behavior
- ⚠️ No tests for ErrorBoundary in actual app context

**Recommendation:**
Add integration tests for critical paths (authentication flow, permission checks, error boundaries).

---

## Security Review

### Positive Security Practices
✅ Passwords are hashed before storage  
✅ API client uses credentials: 'include' for cookies  
✅ Client-side guards prevent SSRF (window checks)  
✅ Error messages don't expose sensitive details  

### Security Concerns
❌ Hardcoded passwords in source code  
❌ Client-side permission system without backend validation  
❌ No CSRF token handling visible in API client  
⚠️ 401 redirect could be exploited for phishing  

**Priority:** Address CR-01 and CR-03 immediately before production deployment.

---

## Conclusion

Phase 73 establishes a solid foundation with good architecture, comprehensive testing, and proper use of modern React patterns. However, **3 critical security issues** must be addressed before production deployment:

1. Remove hardcoded credentials
2. Fix authentication redirect logic
3. Implement backend permission validation

The warning-level issues are code quality improvements that should be addressed in the next iteration to prevent technical debt accumulation.

**Overall Assessment:** Good foundation with security gaps that need immediate attention.
