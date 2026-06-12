---
phase: "40-scaffold"
plan: "01"
type: execute
wave: 1
depends_on: []
files_modified:
  - src/v2/app/[locale]/
  - src/v2/app/[locale]/admin/
autonomous: true
requirements:
  - SCAFFOLD-01
  - SCAFFOLD-02
must_haves:
  truths:
    - "All 13 routes have page.tsx with layout wrapper"
    - "User pages use UserLayout"
    - "Admin pages use AdminLayout"
artifacts:
  - path: "src/v2/app/[locale]/*/page.tsx"
    provides: "Page skeletons for all routes"
  - path: "src/v2/app/[locale]/admin/*/page.tsx"
    provides: "Admin page skeletons"
key_links:
  - from: "page.tsx"
    to: "src/components/layout/UserLayout.tsx"
    via: "User pages wrap with layout"
---

<objective>
Create page.tsx skeletons for all 13 v2 routes. Each page imports the appropriate layout wrapper and contains a placeholder for future content.
</objective>

<tasks>

<task type="execute">
  <name>Task 1: Create User Portal page skeletons (6 pages)</name>
  <read_first>src/components/layout/UserLayout.tsx</read_first>
  <files>src/v2/app/[locale]/dashboard/page.tsx, src/v2/app/[locale]/create/page.tsx, src/v2/app/[locale]/cases/page.tsx, src/v2/app/[locale]/messages/page.tsx, src/v2/app/[locale]/workspace/page.tsx, src/v2/app/[locale]/settings/page.tsx</files>
  <action>
    Create 6 page.tsx files, each importing UserLayout and returning placeholder content.

    ```typescript
    // src/v2/app/[locale]/dashboard/page.tsx
    import { UserLayout } from '@/components/layout/UserLayout';

    export default function DashboardPage() {
      return (
        <UserLayout>
          <div>Dashboard coming soon</div>
        </UserLayout>
      );
    }
    ```

    Repeat pattern for:
    - create/page.tsx
    - cases/page.tsx
    - messages/page.tsx
    - workspace/page.tsx
    - settings/page.tsx
  </action>
  <acceptance_criteria>
    - "All 6 user pages exist at src/v2/app/[locale]/*/page.tsx"
    - "Each page imports UserLayout"
    - "TypeScript compiles without errors"
  </acceptance_criteria>
</task>

<task type="execute">
  <name>Task 2: Create Admin Portal page skeletons (7 pages)</name>
  <read_first>src/components/layout/AdminLayout.tsx</read_first>
  <files>src/v2/app/[locale]/admin/dashboard/page.tsx, src/v2/app/[locale]/admin/users/page.tsx, src/v2/app/[locale]/admin/requests/page.tsx, src/v2/app/[locale]/admin/vault/page.tsx, src/v2/app/[locale]/admin/audit/page.tsx, src/v2/app/[locale]/admin/workspace/page.tsx, src/v2/app/[locale]/admin/operations/page.tsx</files>
  <action>
    Create 7 page.tsx files, each importing AdminLayout and returning placeholder content.

    ```typescript
    // src/v2/app/[locale]/admin/dashboard/page.tsx
    import { AdminLayout } from '@/components/layout/AdminLayout';

    export default function AdminDashboardPage() {
      return (
        <AdminLayout>
          <div>Admin Dashboard coming soon</div>
        </AdminLayout>
      );
    }
    ```

    Repeat pattern for:
    - users/page.tsx
    - requests/page.tsx
    - vault/page.tsx
    - audit/page.tsx
    - workspace/page.tsx
    - operations/page.tsx
  </action>
  <acceptance_criteria>
    - "All 7 admin pages exist at src/v2/app/[locale]/admin/*/page.tsx"
    - "Each page imports AdminLayout"
    - "TypeScript compiles without errors"
  </acceptance_criteria>
</task>

<task type="execute">
  <name>Task 3: Verify all routes compile</name>
  <read_first>tsconfig.json</read_first>
  <files>src/v2/app/</files>
  <action>
    Run TypeScript compiler to verify all pages compile:
    ```bash
    npx tsc --noEmit
    ```

    Verify routes are recognized by Next.js:
    ```bash
    ls src/v2/app/[locale]/*/page.tsx | wc -l
    # Should return 6
    ls src/v2/app/[locale]/admin/*/page.tsx | wc -l
    # Should return 7
    ```
  </action>
  <acceptance_criteria>
    - "TypeScript compiles without errors"
    - "13 page.tsx files exist in v2 routes"
    - "Build passes"
  </acceptance_criteria>
</task>

</tasks>

