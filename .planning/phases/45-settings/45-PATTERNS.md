# Phase 45: Settings - Pattern Map

**Mapped:** 2026-06-13
**Files analyzed:** 16
**Analogs found:** 12 / 16

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/components/settings/SettingsMenu.tsx` | component | request-response | `src/legacy/[locale]/customer/components/Settings/SettingsMenu.tsx` | exact |
| `src/components/settings/SettingsStats.tsx` | component | request-response | `src/legacy/[locale]/customer/components/Settings/SettingsStats.tsx` | exact |
| `src/components/settings/ProfileForm.tsx` | component | request-response | `src/legacy/[locale]/customer/components/Settings/ProfileForm.tsx` | exact |
| `src/components/settings/ToggleRow.tsx` | component | request-response | `src/legacy/[locale]/customer/components/Settings/ToggleRow.tsx` | exact |
| `src/components/settings/SecuritySettings.tsx` | component | request-response | `src/components/auth/SignInForm.tsx` | role-match |
| `src/components/settings/NotificationSettings.tsx` | component | request-response | `src/components/settings/ToggleRow.tsx` | role-match |
| `src/components/settings/LanguageSettings.tsx` | component | request-response | `src/components/LanguageSwitcher.tsx` | role-match |
| `src/components/settings/AuditSettings.tsx` | component | request-response | `src/hooks/useAuditEvents.ts` | role-match |
| `src/components/settings/index.ts` | config | export | `src/components/my-cases/index.ts` | exact |
| `src/app/[locale]/settings/page.tsx` | controller | request-response | `src/app/[locale]/cases/page.tsx` | exact |
| `src/app/[locale]/settings/SettingsClient.tsx` | component | request-response | `src/components/my-cases/MyCasesClient.tsx` | exact |
| `src/app/api/settings/profile/route.ts` | route | CRUD | `src/app/api/messages/send/route.ts` | exact |
| `src/app/api/settings/password/route.ts` | route | CRUD | `src/app/api/intake/submit/route.ts` | role-match |
| `src/app/api/settings/notifications/route.ts` | route | CRUD | `src/app/api/messages/send/route.ts` | exact |
| `src/app/api/settings/language/route.ts` | route | CRUD | `src/app/api/messages/send/route.ts` | exact |
| `src/app/api/settings/audit/route.ts` | route | CRUD | `src/app/api/messages/send/route.ts` | exact |
| `prisma/schema.prisma` | model | CRUD | `prisma/schema.prisma` (User, AuditEvent) | exact |

## Pattern Assignments

### `src/components/settings/SettingsMenu.tsx` (component, request-response)

**Analog:** `src/legacy/[locale]/customer/components/Settings/SettingsMenu.tsx`

**Imports pattern** (lines 1-5):
```typescript
'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
```

**Core tab navigation pattern** (lines 6-26):
```typescript
export type SettingsTab = 'profile' | 'security' | 'notifications' | 'workspace' | 'language' | 'audit';

export interface SettingsTabConfig {
  id: SettingsTab;
  labelKey: string;
  icon: string;
}

const tabs: SettingsTabConfig[] = [
  { id: 'profile', labelKey: 'tabProfile', icon: 'User' },
  { id: 'security', labelKey: 'tabSecurity', icon: 'Shield' },
  { id: 'notifications', labelKey: 'tabNotifications', icon: 'Bell' },
  { id: 'workspace', labelKey: 'tabWorkspace', icon: 'Building2' },
  { id: 'language', labelKey: 'tabLanguage', icon: 'Globe' },
  { id: 'audit', labelKey: 'tabAudit', icon: 'FileText' },
];
```

**Component props pattern** (lines 28-44):
```typescript
export interface SettingsMenuProps {
  activeTab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
}

export function SettingsMenu({ activeTab, onTabChange }: SettingsMenuProps): React.ReactElement {
  const t = useTranslations('UserSettings');
  return (
    <div className="settings-menu">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          <span className="tab-icon"><Icon name={tab.icon} /></span>
          <span className="tab-label">{t(tab.labelKey)}</span>
        </button>
      ))}
    </div>
  );
}
```

---

### `src/components/settings/SettingsStats.tsx` (component, request-response)

**Analog:** `src/legacy/[locale]/customer/components/Settings/SettingsStats.tsx`

**Props and stats pattern** (lines 7-20):
```typescript
interface StatItem {
  titleKey: string;
  value: string;
  descKey: string;
  icon: React.ReactNode;
  variant: 'green' | 'blue' | 'orange' | 'purple';
}

export interface SettingsStatsProps {
  accountStatus: string;
  securityStatus: string;
  notificationCount: number;
  workspaceCount: number;
}
```

---

### `src/components/settings/ProfileForm.tsx` (component, request-response)

**Analog:** `src/legacy/[locale]/customer/components/Settings/ProfileForm.tsx`

**Props interface pattern**:
```typescript
export interface ProfileFormProps {
  user: {
    name: string;
    email: string;
    phone: string | null;
    title: string | null;
    timezone: string;
  };
  workspaces: { id: string; name: string }[];
  onSave: (data: ProfileFormData) => Promise<void>;
}
```

---

### `src/components/settings/ToggleRow.tsx` (component, request-response)

**Analog:** `src/legacy/[locale]/customer/components/Settings/ToggleRow.tsx`

**Toggle component pattern** (lines 5-28):
```typescript
export interface ToggleRowProps {
  label: string;
  description: string;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
}

export function ToggleRow({ label, description, defaultChecked = false, onChange }: ToggleRowProps): React.ReactElement {
  const [checked, setChecked] = React.useState(defaultChecked);

  return (
    <div className="toggle-row">
      <div className="toggle-content">
        <div className="toggle-label">{label}</div>
        <div className="toggle-description">{description}</div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        className={`toggle ${checked ? '' : 'off'}`}
        onClick={() => {
          setChecked(!checked);
          onChange?.(!checked);
        }}
      />
    </div>
  );
}
```

---

### `src/components/settings/index.ts` (config, export)

**Analog:** `src/components/my-cases/index.ts`

**Barrel export pattern**:
```typescript
export { SettingsMenu } from './SettingsMenu';
export { SettingsStats } from './SettingsStats';
export { ProfileForm } from './ProfileForm';
export { ToggleRow } from './ToggleRow';
export { SecuritySettings } from './SecuritySettings';
export { NotificationSettings } from './NotificationSettings';
export { LanguageSettings } from './LanguageSettings';
export { AuditSettings } from './AuditSettings';
```

---

### `src/app/[locale]/settings/page.tsx` (controller, request-response)

**Analog:** `src/app/[locale]/cases/page.tsx`

**Server component pattern with Prisma** (lines 1-7, 12-35):
```typescript
import { prisma } from '@/lib/prisma';
import { requireAppSession } from '@/lib/security/session';
import { getTranslations } from 'next-intl/server';
import UserLayout from '@/components/layout/UserLayout';
import { SettingsClient } from './SettingsClient';
import '@/components/settings/settings.css';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function SettingsPage({ params }: PageProps) {
  const { locale } = await params;
  const session = await requireAppSession();
  const { userId, activeWorkspaceId } = session;

  // Fetch user data with workspaces
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
        where: { isActive: true, workspace: { isActive: true } },
        include: { workspace: { select: { id: true, name: true, slug: true } } },
      },
    },
  });

  // Fetch settings stats
  const [accountRequests, securityEvents, notifications, workspaceCount] = await Promise.all([
    prisma.legalRequest.count({ where: { createdById: userId } }),
    prisma.auditEvent.count({ where: { actorId: userId, action: { contains: 'auth' } } }),
    // Notification count query
    workspaceCount,
  ]);

  return (
    <UserLayout>
      <SettingsClient user={user} stats={stats} />
    </UserLayout>
  );
}
```

---

### `src/app/[locale]/settings/SettingsClient.tsx` (component, request-response)

**Analog:** `src/components/my-cases/MyCasesClient.tsx`

**Client component pattern** (lines 1-45, 60-80):
```typescript
'use client';

import React, { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { SettingsMenu, SettingsTab } from '@/components/settings/SettingsMenu';
import { SettingsStats } from '@/components/settings/SettingsStats';
import { ProfileForm } from '@/components/settings/ProfileForm';
import { NotificationSettings } from '@/components/settings/NotificationSettings';
import { AuditSettings } from '@/components/settings/AuditSettings';
// ... other imports

export interface SettingsClientProps {
  user: UserData;
  stats: SettingsStatsData;
}

export function SettingsClient({ user, stats }: SettingsClientProps): React.ReactElement {
  const t = useTranslations('UserSettings');
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [saving, setSaving] = useState(false);

  const handleSaveProfile = useCallback(async (data: ProfileFormData) => {
    setSaving(true);
    try {
      const response = await fetch('/api/settings/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to save');
      // Show success message
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setSaving(false);
    }
  }, []);

  return (
    <div className="settings-page">
      <div className="page-header">
        <h1>{t('pageTitle')}</h1>
      </div>

      <SettingsStats {...stats} />

      <div className="settings-layout">
        <SettingsMenu activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="settings-content">
          {activeTab === 'profile' && <ProfileForm user={user} onSave={handleSaveProfile} />}
          {activeTab === 'notifications' && <NotificationSettings />}
          {activeTab === 'audit' && <AuditSettings userId={user.id} />}
          {/* Other tabs */}
        </div>
      </div>
    </div>
  );
}
```

---

### `src/app/api/settings/profile/route.ts` (route, CRUD)

**Analog:** `src/app/api/messages/send/route.ts`

**API route pattern with session auth** (lines 1-22, 40-70):
```typescript
import { prisma } from '@/lib/prisma';
import { requireAppSession } from '@/lib/security/session';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(request: NextRequest) {
  try {
    const session = await requireAppSession();
    const { userId } = session;

    const body = await request.json();
    const { name, email, phone, title, timezone } = body;

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json(
        { error: 'MISSING_FIELDS', message: 'Name and email are required' },
        { status: 400 }
      );
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        email,
        phone: phone || null,
        title: title || null,
        timezone: timezone || 'Asia/Ho_Chi_Minh',
      },
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error('Profile update failed:', error);
    return NextResponse.json(
      { error: 'UPDATE_FAILED', message: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
```

---

### `src/app/api/settings/password/route.ts` (route, CRUD)

**Analog:** `src/app/api/intake/submit/route.ts`

**Password change with validation**:
```typescript
import { prisma } from '@/lib/prisma';
import { requireAppSession } from '@/lib/security/session';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';

export async function PUT(request: NextRequest) {
  try {
    const session = await requireAppSession();
    const { userId } = session;

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'MISSING_FIELDS', message: 'Current and new password are required' },
        { status: 400 }
      );
    }

    // Find account with password
    const account = await prisma.account.findFirst({
      where: { userId, password: { not: null } },
    });

    if (!account?.password) {
      return NextResponse.json(
        { error: 'NO_PASSWORD', message: 'No password set for this account' },
        { status: 400 }
      );
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, account.password);
    if (!isValid) {
      return NextResponse.json(
        { error: 'INVALID_PASSWORD', message: 'Current password is incorrect' },
        { status: 400 }
      );
    }

    // Hash and update new password
    const newHash = await bcrypt.hash(newPassword, 10);
    await prisma.account.update({
      where: { id: account.id },
      data: { password: newHash },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Password change failed:', error);
    return NextResponse.json(
      { error: 'CHANGE_FAILED', message: 'Failed to change password' },
      { status: 500 }
    );
  }
}
```

---

### `src/app/api/settings/notifications/route.ts` (route, CRUD)

**Analog:** `src/app/api/messages/send/route.ts`

**Notification preferences pattern**:
```typescript
import { prisma } from '@/lib/prisma';
import { requireAppSession } from '@/lib/security/session';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(request: NextRequest) {
  try {
    const session = await requireAppSession();
    const { userId } = session;

    const body = await request.json();
    const { emailOnReply, slaReminder, weeklySummary } = body;

    // Upsert user preferences
    const preferences = await prisma.userPreferences.upsert({
      where: { userId },
      create: {
        userId,
        emailOnReply: emailOnReply ?? true,
        slaReminder: slaReminder ?? true,
        weeklySummary: weeklySummary ?? false,
      },
      update: {
        emailOnReply: emailOnReply ?? true,
        slaReminder: slaReminder ?? true,
        weeklySummary: weeklySummary ?? false,
      },
    });

    return NextResponse.json({ success: true, preferences });
  } catch (error) {
    console.error('Notification update failed:', error);
    return NextResponse.json(
      { error: 'UPDATE_FAILED', message: 'Failed to update preferences' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireAppSession();
    const { userId } = session;

    const preferences = await prisma.userPreferences.findUnique({
      where: { userId },
    });

    return NextResponse.json({
      emailOnReply: preferences?.emailOnReply ?? true,
      slaReminder: preferences?.slaReminder ?? true,
      weeklySummary: preferences?.weeklySummary ?? false,
    });
  } catch (error) {
    console.error('Fetch preferences failed:', error);
    return NextResponse.json(
      { error: 'FETCH_FAILED', message: 'Failed to fetch preferences' },
      { status: 500 }
    );
  }
}
```

---

### `src/app/api/settings/audit/route.ts` (route, CRUD)

**Analog:** `src/app/api/messages/send/route.ts`

**Audit log query pattern**:
```typescript
import { prisma } from '@/lib/prisma';
import { requireAppSession } from '@/lib/security/session';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAppSession();
    const { userId } = session;

    const auditEvents = await prisma.auditEvent.findMany({
      where: { actorId: userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        workspace: { select: { name: true } },
      },
    });

    return NextResponse.json({
      data: auditEvents.map((event) => ({
        id: event.id,
        action: event.action,
        targetType: event.targetType,
        targetId: event.targetId,
        workspace: event.workspace.name,
        createdAt: event.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Fetch audit failed:', error);
    return NextResponse.json(
      { error: 'FETCH_FAILED', message: 'Failed to fetch audit events' },
      { status: 500 }
    );
  }
}
```

---

## Shared Patterns

### Authentication

**Source:** `src/lib/security/session.ts` (lines 14-40)

**Apply to:** All API route files

```typescript
export async function requireAppSession(): Promise<AppSession> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) throw new Error('UNAUTHENTICATED');

  const userId = session.user.id;
  const user = await prisma.user.findFirst({
    where: { id: userId, isActive: true },
    select: {
      id: true,
      memberships: {
        where: { isActive: true, workspace: { isActive: true } },
        select: { workspaceId: true, role: true },
        orderBy: { createdAt: 'asc' },
        take: 1,
      },
    },
  });

  const membership = user?.memberships[0];
  if (!user || !membership) throw new Error('UNAUTHENTICATED');

  return {
    userId: user.id,
    activeWorkspaceId: membership.workspaceId,
    roles: [membership.role as import('@/lib/types').AppRole],
  };
}
```

### Error Handling

**Source:** `src/app/api/intake/submit/route.ts` (lines 25-65)

**Apply to:** All API route files

```typescript
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error('Submit intake failed:', message);

  if (message === 'FORBIDDEN') {
    return NextResponse.json(
      { error: 'FORBIDDEN', message: 'Access denied' },
      { status: 403 }
    );
  }
  if (message === 'UNAUTHENTICATED') {
    return NextResponse.json(
      { error: 'UNAUTHORIZED', message: 'Authentication required' },
      { status: 401 }
    );
  }

  return NextResponse.json(
    { error: 'INTERNAL_ERROR', message: 'Internal server error' },
    { status: 500 }
  );
}
```

### Input Validation

**Source:** `src/app/api/intake/submit/route.ts` (lines 11-16)

**Apply to:** All API PUT/POST handlers

```typescript
if (!requestId || typeof requestId !== 'string') {
  return NextResponse.json(
    { error: 'REQUEST_ID_REQUIRED', message: 'requestId is required' },
    { status: 400 }
  );
}
```

### Prisma Schema Pattern (UserPreferences)

**Source:** `prisma/schema.prisma` (existing User model, lines 20-46)

**Apply to:** New UserPreferences model

```prisma
model UserPreferences {
  id           String   @id @default(cuid())
  userId       String   @unique
  emailOnReply Boolean @default(true)
  slaReminder  Boolean @default(true)
  weeklySummary Boolean @default(false)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  user         User     @relation(fields: [userId], references: [id])

  @@index([userId])
}
```

### User Model Relation

**Source:** `prisma/schema.prisma` (lines 34-45)

**Apply to:** Update User model to include preferences relation

```prisma
model User {
  // ... existing fields ...
  preferences  UserPreferences?
  accounts     Account[]
  sessions     Session[]
}
```

---

## No Analog Found

Files with no close match in the codebase (planner should use RESEARCH.md patterns instead):

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `src/components/settings/SecuritySettings.tsx` | component | request-response | New component - combines password form + 2FA toggles |
| `src/components/settings/LanguageSettings.tsx` | component | request-response | Minimal component - next-intl locale switcher |
| `src/components/settings/settings.css` | style | - | CSS file - copy from legacy + Tailwind |
| `src/app/api/settings/language/route.ts` | route | CRUD | Simple locale update - single Prisma field |

---

## Metadata

**Analog search scope:** `src/components/`, `src/app/api/`, `src/legacy/[locale]/customer/components/Settings/`, `src/lib/`, `prisma/`
**Files scanned:** 45
**Pattern extraction date:** 2026-06-13
