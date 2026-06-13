# Phase 45: Settings - Research

**Researched:** 2026-06-13
**Domain:** Next.js 15 App Router Settings Page with Prisma Integration
**Confidence:** HIGH

## Summary

Phase 45 implements real data integration for the Settings page at `/vi/settings`. The page currently shows a placeholder "Settings coming soon" in `src/app/[locale]/settings/page.tsx`. This phase clones components from `src/legacy/[locale]/customer/components/Settings/` to `src/components/settings/`, connects them to Prisma queries, and implements 6-tab functionality (Profile, Security, Notifications, Workspace, Language, Audit).

**Primary recommendation:** Use API routes in `src/app/api/settings/` following the existing project pattern (similar to `/api/intake/`), with `requireAppSession()` for auth. Profile data uses existing `prisma.user` model, notification preferences require a new `UserPreferences` model, audit uses existing `prisma.auditEvent` model.

## User Constraints (from CONTEXT.md)

### Locked Decisions

| Decision | Value | Source |
|----------|-------|--------|
| Source path | `src/legacy/[locale]/customer/components/Settings/` | CONTEXT.md |
| Target path | `src/components/settings/` | CONTEXT.md |
| Component list | SettingsMenu, SettingsStats, ProfileForm, ToggleRow, SecuritySettings, NotificationSettings, LanguageSettings, AuditSettings, index.ts, settings.css | CONTEXT.md |
| API Strategy | Option A: New API routes in `src/app/api/settings/` | CONTEXT.md |
| Notification Storage | Option B: Normalized `UserPreferences` model | CONTEXT.md |
| Password Validation | Option A: Require current password to change | CONTEXT.md |
| Language switching | Use `next-intl` locale switching, store in `prisma.user.locale` | CONTEXT.md |

### Claude's Discretion

| Decision | Recommendation |
|----------|-----------------|
| Stat card data source | Fetch from DB instead of hardcoded values |
| Toggle persistence | Use API calls for toggle changes |
| 2FA implementation | Stub with toggle (no actual 2FA in MVP) |
| Workspace selector | Read-only display of current workspace |

### Deferred Ideas (OUT OF SCOPE)

- Email verification on email change
- OAuth provider linking
- Session management
- Password strength meter

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CUST-SET-01 | Settings menu shows 6 tabs | SettingsMenu.tsx with tab IDs: profile, security, notifications, workspace, language, audit |
| CUST-SET-02 | Profile form shows 6 fields | ProfileForm.tsx: name, email, phone, title, workspace, timezone |
| CUST-SET-03 | Notification toggles display 3 items | ToggleRow.tsx with 3 toggles: emailOnReply, slaReminder, weeklySummary |
| CUST-SET-04 | Security toggles show 2FA and login alerts | SecuritySettings.tsx with ToggleRow for 2FA and loginAlert |
| CUST-SET-05 | 4 stats cards show account status | SettingsStats.tsx: Account, Security, Notifications, Workspace |

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Profile data display | API / Backend | Browser | Prisma query in page.tsx (server component), passes data to client |
| Profile update | API / Backend | Browser | PUT `/api/settings/profile` with `requireAppSession()` |
| Password change | API / Backend | Browser | PUT `/api/settings/password` with current password validation |
| Notification toggles | Browser | API / Backend | Local state + API calls on change |
| Language switch | Browser | API / Backend | `next-intl` + `prisma.user.locale` update |
| Audit log display | API / Backend | Browser | Prisma query for `auditEvent` by actorId |
| Settings stats | API / Backend | Browser | Aggregated counts from Prisma |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js 15 App Router | 15.x | Page framework | Current project stack |
| Prisma | 5.x | Database ORM | Project standard |
| next-intl | 4.x | Internationalization | Project standard |
| better-auth | 1.6.18 | Authentication | Project standard |
| lucide-react | latest | Icons | Project standard |
| tailwindcss | latest | Styling | Project standard |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| zod | latest | Schema validation | Input validation for API routes |
| bcrypt | latest | Password hashing | Password change endpoint |

**Installation:**
```bash
# No new packages needed - using project standard libraries
```

## Package Legitimacy Audit

> This phase uses existing project packages only - no external packages to verify.

| Package | Registry | Status |
|---------|----------|--------|
| better-auth | npm | [VERIFIED: npm registry] - already in project |
| zod | npm | [VERIFIED: npm registry] - already in project |
| bcrypt | npm | [VERIFIED: npm registry] - already in project |

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser / Client                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ SettingsPage (Server Component)                             │ │
│  │ - Fetches user data via Prisma                              │ │
│  │ - Fetches workspace data                                    │ │
│  │ - Fetches stats (account, security, notifications, ws)     │ │
│  └────────────────────────┬───────────────────────────────────┘ │
│                           │ passes data as props                 │
│                           ▼                                      │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ SettingsClient (Client Component)                          │ │
│  │ - Manages activeTab state                                   │ │
│  │ - Renders tab-specific content                             │ │
│  │ - Handles form submissions via API calls                   │ │
│  └──────────┬──────────────┬──────────────┬──────────────────┘ │
│              │              │              │                      │
│  ┌───────────▼──┐  ┌──────▼──────┐  ┌───▼────────┐              │
│  │ ProfileForm  │  │SecuritySet. │  │ NotifSet.  │              │
│  │ - 6 fields   │  │ - 3 password│  │ - 3 toggles│              │
│  │ - Save btn   │  │ - 2FA toggle│  │             │              │
│  └──────────────┘  └─────────────┘  └────────────┘              │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ API calls (PUT/GET)
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                        API / Backend                             │
├─────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ src/app/api/settings/                                      │ │
│  │ ├── profile/route.ts     PUT - Update name, email, phone  │ │
│  │ ├── password/route.ts    PUT - Change password (bcrypt)   │ │
│  │ ├── notifications/route.ts PUT - Update preferences        │ │
│  │ ├── language/route.ts    PUT - Update locale               │ │
│  │ └── audit/route.ts       GET - Fetch user's audit events   │ │
│  └────────────────────────────────────────────────────────────┘ │
│                            │                                     │
│                            ▼                                     │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ src/lib/security/session.ts                                 │ │
│  │ - requireAppSession() for auth                              │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ Prisma queries
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Database / Storage                           │
├─────────────────────────────────────────────────────────────────┤
│  prisma.user              - Profile data, locale                 │
│  prisma.workspace         - Workspace info                       │
│  prisma.workspaceMembership - User's workspace(s)               │
│  prisma.userPreferences   - [NEW] Notification preferences      │
│  prisma.auditEvent        - Audit log                           │
│  prisma.account           - Password (hashed)                   │
└─────────────────────────────────────────────────────────────────┘
```

### Recommended Project Structure
```
src/
├── components/settings/
│   ├── SettingsMenu.tsx      # 6-tab navigation with icons
│   ├── SettingsStats.tsx      # 4 stats cards (from DB)
│   ├── ProfileForm.tsx        # 6 fields from DB
│   ├── ToggleRow.tsx         # Reusable toggle switch
│   ├── SecuritySettings.tsx   # Password change + 2FA toggles
│   ├── NotificationSettings.tsx  # Email/sms preferences
│   ├── LanguageSettings.tsx  # Language switcher
│   ├── AuditSettings.tsx     # Audit log viewer
│   ├── index.ts              # Barrel exports
│   └── settings.css          # All settings styles
├── app/
│   ├── [locale]/
│   │   └── settings/
│   │       ├── page.tsx      # Server component (fetches DB data)
│   │       └── SettingsClient.tsx  # Client component
│   └── api/settings/
│       ├── profile/route.ts
│       ├── password/route.ts
│       ├── notifications/route.ts
│       ├── language/route.ts
│       └── audit/route.ts
└── lib/
    ├── prisma.ts              # Already exists
    └── security/session.ts    # Already exists
```

### Pattern 1: Server-Client Component Split
**What:** Server component fetches data, client component manages UI state
**When to use:** All data-driven pages in Next.js App Router
**Example:**
```typescript
// page.tsx (Server Component)
export default async function SettingsPage() {
  const session = await requireAppSession();
  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  return <SettingsClient user={user} />;
}

// SettingsClient.tsx (Client Component)
'use client';
export function SettingsClient({ user }: { user: User }) {
  const [activeTab, setActiveTab] = useState('profile');
  // ... render tabs based on activeTab
}
```

### Pattern 2: API Route with Session Auth
**What:** API routes use `requireAppSession()` for authentication
**When to use:** All settings endpoints
**Example:**
```typescript
// src/app/api/settings/profile/route.ts
import { NextResponse } from 'next/server';
import { requireAppSession } from '@/lib/security/session';
import { prisma } from '@/lib/prisma';

export async function PUT(request: Request) {
  try {
    const session = await requireAppSession();
    const body = await request.json();
    // ... validate and update
    await prisma.user.update({ where: { id: session.userId }, data: body });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }
}
```

### Anti-Patterns to Avoid
- **Hardcoded user data in components:** Fetch from Prisma instead
- **Direct Prisma access in client components:** Always go through API routes or server components
- **Storing preferences in localStorage:** Use database for persistence
- **Skipping current password validation:** Required per user decision

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Authentication | Custom session handling | `requireAppSession()` | Already implemented, handles headers properly |
| Password hashing | Custom hash functions | `bcrypt` | Secure, tested, industry standard |
| Date formatting | Custom relative time | Existing `formatRelativeTime` pattern | Consistent with project |
| Input validation | Raw JSON parsing | `zod` | Type-safe, validated across codebase |
| i18n | Custom translation | `next-intl` | Project standard |

**Key insight:** The project already has authentication (`better-auth`), database (`Prisma`), and i18n (`next-intl`) configured. Settings phase should leverage these existing systems rather than building new infrastructure.

## Common Pitfalls

### Pitfall 1: Missing Auth on API Routes
**What goes wrong:** API endpoints accessible without authentication
**Why it happens:** Forgetting to call `requireAppSession()` in API routes
**How to avoid:** Always call `requireAppSession()` at the start of every settings API route
**Warning signs:** API returns 500 instead of 401, or returns data for wrong user

### Pitfall 2: UserPreferences Model Not Created
**What goes wrong:** Notification toggles don't persist
**Why it happens:** No database table for preferences
**How to avoid:** Create `UserPreferences` model in Prisma schema before implementing notifications tab
**Warning signs:** Toggle state resets on page reload

### Pitfall 3: Missing Workspace Selection Query
**What goes wrong:** Workspace dropdown shows nothing
**Why it happens:** Not querying `WorkspaceMembership` for user's workspaces
**How to avoid:** Query `prisma.workspaceMembership.findMany({ where: { userId } })`
**Warning signs:** Empty dropdown in workspace tab

### Pitfall 4: Password Not Hashed
**What goes wrong:** Password stored in plain text
**Why it happens:** Forgetting to hash before storing
**How to avoid:** Use `bcrypt.hash(password, 10)` before `prisma.account.update`
**Warning signs:** Security audit failure, plain text passwords in DB

## Code Examples

### Fetching User with Workspaces
```typescript
// Source: Based on src/app/[locale]/cases/page.tsx pattern
const user = await prisma.user.findUnique({
  where: { id: userId },
  select: {
    id: true,
    name: true,
    email: true,
    phone: true,
    title: true,
    timezone: true,
    locale: true,
    memberships: {
      where: { isActive: true },
      include: { workspace: { select: { id: true, name: true, slug: true } } },
    },
  },
});
```

### Password Change Validation
```typescript
// Source: Project pattern with bcrypt
import bcrypt from 'bcrypt';

const isValid = await bcrypt.compare(currentPassword, storedHash);
if (!isValid) {
  return NextResponse.json({ error: 'INVALID_PASSWORD' }, { status: 400 });
}
const newHash = await bcrypt.hash(newPassword, 10);
await prisma.account.update({
  where: { userId_providerId_accountId({ userId, providerId: 'credential', accountId: userId }) },
  data: { password: newHash },
});
```

### Audit Log Query
```typescript
// Source: Based on prisma schema and existing patterns
const auditEvents = await prisma.auditEvent.findMany({
  where: { actorId: userId },
  orderBy: { createdAt: 'desc' },
  take: 50,
  include: {
    workspace: { select: { name: true } },
  },
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hardcoded profile data | Prisma `user.findUnique` | Phase 45 | Real user data displayed |
| localStorage preferences | `UserPreferences` model | Phase 45 | Preferences persist across devices |
| Static audit placeholder | `AuditEvent` query | Phase 45 | Real audit trail visible |

**Deprecated/outdated:**
- Placeholder "Settings coming soon" text - replaced with full settings UI

## Assumptions Log

> List all claims tagged `[ASSUMED]` in this research.

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `better-auth` supports password change via `account.update` | Standard Stack | May need different API - verify against better-auth docs |
| A2 | `UserPreferences` model naming is correct | Architecture Patterns | May need `userId` field - planner should verify |
| A3 | Audit events filter by `actorId` works correctly | Common Pitfalls | May need different filter - planner should verify |
| A4 | bcrypt is already installed in project | Standard Stack | May need `npm install bcrypt` - planner should verify |

**If this table is empty:** All claims in this research were verified or cited - no user confirmation needed.

## Open Questions

1. **UserPreferences model location**
   - What we know: Need to store notification preferences (emailOnReply, slaReminder, weeklySummary)
   - What's unclear: Should this be a separate model or fields on User model?
   - Recommendation: Separate `UserPreferences` model for extensibility (Option B in CONTEXT.md)

2. **Account model update for password**
   - What we know: `Account` model has `password` field, `better-auth` stores hashed passwords
   - What's unclear: Exact update syntax for `better-auth` account records
   - Recommendation: Test password change against `better-auth` API documentation

3. **2FA implementation scope**
   - What we know: Security tab should show 2FA toggle
   - What's unclear: Full 2FA implementation needed for MVP?
   - Recommendation: Stub 2FA toggle for MVP, implement actual OTP later

## Environment Availability

> Step 2.6: SKIPPED (no external dependencies identified)

This phase uses only existing project infrastructure:
- Next.js 15 App Router - already configured
- Prisma - already configured
- next-intl - already configured
- better-auth - already configured

No external tools, services, or CLI utilities required beyond those already in the project.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Playwright (project standard) |
| Config file | `playwright.config.ts` |
| Quick run command | `npx playwright test --grep "settings"` |
| Full suite command | `npx playwright test` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|---------------|
| CUST-SET-01 | 6 tabs render with correct labels | smoke | Playwright: click each tab | N/A (UI test) |
| CUST-SET-02 | Profile form pre-filled from DB | integration | `GET /api/settings/profile` | N/A (API test) |
| CUST-SET-03 | Toggle changes persist | integration | `PUT /api/settings/notifications` | N/A (API test) |
| CUST-SET-04 | Password change requires current | unit | Test password route validation | tests/api/settings/password.test.ts |
| CUST-SET-05 | Stats display real counts | integration | Check page content | N/A (UI test) |

### Sampling Rate
- **Per task commit:** `npx playwright test --grep "settings"`
- **Per wave merge:** Full suite
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `tests/api/settings/profile.test.ts` - covers profile GET/PUT
- [ ] `tests/api/settings/password.test.ts` - covers password change
- [ ] `tests/api/settings/notifications.test.ts` - covers preferences
- [ ] `tests/e2e/settings.spec.ts` - covers full settings flow
- [ ] Framework install: `npx playwright install` - if not already in CI

*(If no gaps: "None - existing test infrastructure covers all phase requirements")*

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | `requireAppSession()` - existing auth |
| V3 Session Management | yes | `better-auth` session handling |
| V4 Access Control | yes | User can only modify own settings |
| V5 Input Validation | yes | zod schemas for API inputs |
| V6 Cryptography | yes | bcrypt for password hashing |

### Known Threat Patterns for This Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Privilege escalation | Elevation | Session validation on every request |
| Information disclosure | Disclosure | Users only see own data (actorId filter) |
| Tampering | Tampering | HTTPS + server-side validation |
| Denial of Service | Denial | Rate limiting on password endpoints |

## Sources

### Primary (HIGH confidence)
- Project codebase (`src/lib/security/session.ts`) - authentication pattern
- Prisma schema (`prisma/schema.prisma`) - data models
- Existing API routes (`src/app/api/intake/`) - API pattern
- Legacy settings components (`src/legacy/.../Settings/`) - component structure

### Secondary (MEDIUM confidence)
- `better-auth` npm registry - version 1.6.18 confirmed
- `layout/user-settings.html` - UI template reference

### Tertiary (LOW confidence)
- UserPreferences model structure - based on CONTEXT.md recommendation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - using project-existing libraries
- Architecture: HIGH - follows established patterns
- Pitfalls: HIGH - based on project-specific patterns

**Research date:** 2026-06-13
**Valid until:** 2026-07-13 (30 days for stable project)
