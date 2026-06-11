'use client';

import AdminStatCard from '@/app/components/admin/AdminStatCard';
import AdminBanner from '@/app/components/admin/AdminBanner';

export default function AdminDashboardPage() {
  return (
    <div>
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
            Admin Dashboard
          </h1>
          <p
            style={{
              fontSize: 15,
              color: '#5f6e83',
              fontWeight: 500,
              margin: 0,
            }}
          >
            Tổng quan vận hành hệ thống, người dùng, workspace, hồ sơ pháp lý, SLA và audit an toàn.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button
            style={{
              height: 45,
              padding: '0 16px',
              border: '1px solid var(--border)',
              background: '#fff',
              borderRadius: 8,
              color: '#1e293b',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            Xuất báo cáo
          </button>
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
              stroke="white"
              strokeWidth="2"
            >
              <path d="M12 5v14" />
              <path d="M5 12h14" />
            </svg>
            Tạo hồ sơ mới
          </button>
        </div>
      </div>

      {/* Admin Banner */}
      <AdminBanner />

      {/* Stats Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 18,
          marginBottom: 24,
        }}
      >
        <AdminStatCard
          variant="blue"
          title="Tổng người dùng"
          value="128"
          description="+14 người dùng trong tháng"
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
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          }
        />

        <AdminStatCard
          variant="green"
          title="Workspaces"
          value="12"
          description="11 đang hoạt động"
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

        <AdminStatCard
          variant="orange"
          title="Sắp quá SLA"
          value="6"
          description="Cần xử lý trong 24 giờ"
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
              <path d="M12 6v6l4 2" />
            </svg>
          }
        />

        <AdminStatCard
          variant="red"
          title="Cảnh báo audit"
          value="3"
          description="Liên quan quyền truy cập"
          icon={
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              width="30"
              height="30"
            >
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <path d="M12 9v4" />
              <path d="M12 17h.01" />
            </svg>
          }
        />
      </div>
    </div>
  );
}
