'use client';

import UserStatCard from '@/app/components/admin/UserStatCard';
import RolePill from '@/app/components/admin/RolePill';
import UserToolbar from '@/app/components/admin/UserToolbar';
import UserTable from '@/app/components/admin/UserTable';
import FloatingAlertButton from '@/app/components/admin/FloatingAlertButton';

export default function UsersPage() {
  const rolePills = [
    { role: 'Customer', count: 72, variant: 'blue' as const },
    { role: 'Specialist', count: 18, variant: 'blue' as const },
    { role: 'Reviewer', count: 14, variant: 'purple' as const },
    { role: 'Coordinator', count: 10, variant: 'green' as const },
    { role: 'Super Admin', count: 4, variant: 'red' as const },
    { role: 'Pending', count: 9, variant: 'orange' as const },
  ];

  return (
    <div style={{ padding: '31px 36px 42px' }}>
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 22,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 31,
              letterSpacing: '-0.8px',
              marginBottom: 12,
              color: '#020617',
              fontWeight: 800,
            }}
          >
            User Management
          </h1>
          <p
            style={{
              fontSize: 15,
              color: '#5f6e83',
              fontWeight: 500,
              margin: 0,
            }}
          >
            Platform with 5 roles: customer, specialist, reviewer, coordinator_admin and super_admin.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button
            style={{
              height: 45,
              padding: '0 18px',
              border: 'none',
              borderRadius: 8,
              background: 'linear-gradient(180deg, #0b8f86, #087970)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontWeight: 700,
              boxShadow: '0 8px 18px rgba(8, 127, 120, 0.25)',
              cursor: 'pointer',
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="19" x2="19" y1="8" y2="14" />
              <line x1="22" x2="16" y1="11" y2="11" />
            </svg>
            Create User
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 18,
          marginBottom: 24,
        }}
      >
        {/* Total Users */}
        <UserStatCard
          variant="blue"
          title="Total Users"
          value="128"
          description="Across all workspaces"
          icon={
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              width="30"
              height="30"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            </svg>
          }
        />

        {/* Active Users */}
        <UserStatCard
          variant="green"
          title="Active Users"
          value="112"
          description="87.5% of total users"
          icon={
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              width="30"
              height="30"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          }
        />

        {/* Workspaces */}
        <UserStatCard
          variant="purple"
          title="Workspaces"
          value="12"
          description="11 active workspaces"
          icon={
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              width="30"
              height="30"
            >
              <path d="M3 21h18" />
              <path d="M5 21V7h6v14" />
              <path d="M13 21V3h6v18" />
            </svg>
          }
        />

        {/* Pending Invitations */}
        <UserStatCard
          variant="orange"
          title="Pending Invitations"
          value="9"
          description="Awaiting acceptance"
          icon={
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              width="30"
              height="30"
            >
              <path d="M4 4h16v16H4z" />
              <path d="m22 6-10 7L2 6" />
            </svg>
          }
        />
      </div>

      {/* Role Pills Section */}
      <div className="roles-card">
        <div className="section-title">
          <svg
            width="21"
            height="21"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          System Roles
        </div>
        <div className="pills">
          {rolePills.map((pill) => (
            <RolePill
              key={pill.role}
              role={pill.role}
              count={pill.count}
              variant={pill.variant}
            />
          ))}
        </div>
        <div className="audit-note">
          Role assignments are audited. Changes require super_admin approval.
        </div>
      </div>

      {/* User Toolbar */}
      <UserToolbar />

      {/* User Table */}
      <UserTable />

      {/* Floating Alert Button */}
      <FloatingAlertButton alertCount={3} />
    </div>
  );
}
