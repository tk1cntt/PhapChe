---
description: Component nào dùng data api nào thì tự lấy data đó
date: 2026-06-14
status: in-progress
commit: 
---

## Tasks

### 1. Analyze current Dashboard data fetching pattern

**Files:**
- src/components/dashboard/DashboardClient.tsx
- src/components/dashboard/RecentCases.tsx
- src/components/dashboard/RecentDocuments.tsx
- src/components/dashboard/DeadlineSLA.tsx
- src/components/dashboard/ActivityTimeline.tsx
- src/components/dashboard/WelcomeBanner.tsx

**Action:**
- Analyze what data each component needs
- Current: DashboardClient fetches all data from /api/dashboard, passes down as props
- Target: Each component fetches its own data from dedicated APIs

**Verify:** `grep -r "useEffect.*fetch" src/components/dashboard/` shows each component fetching its own data

**Done:** Each component has its own useEffect with fetch to dedicated API endpoint

---

### 2. Create API endpoints for each data type

**Files to create:**
- src/app/api/dashboard/stats/route.ts
- src/app/api/dashboard/recent-cases/route.ts
- src/app/api/dashboard/recent-documents/route.ts
- src/app/api/dashboard/deadlines/route.ts
- src/app/api/dashboard/activities/route.ts

**Action:**
- Create dedicated API endpoints for each data type
- Return only the data needed by each component

**Verify:** Each endpoint returns correct JSON when called

**Done:** All 5 API endpoints created and returning correct data

---

### 3. Update components to fetch their own data

**Files:**
- src/components/dashboard/WelcomeBanner.tsx
- src/components/dashboard/RecentCases.tsx
- src/components/dashboard/RecentDocuments.tsx
- src/components/dashboard/DeadlineSLA.tsx
- src/components/dashboard/ActivityTimeline.tsx
- src/components/dashboard/StatCard.tsx (needs stats data)

**Action:**
- Add useEffect and useState to each component
- Fetch data from dedicated API on mount
- Handle loading and error states
- Remove data props from parent components

**Verify:** 
- Components render with fetched data
- No prop drilling of data from DashboardClient

**Done:** All components self-sufficient, DashboardClient only passes non-data props
