'use client';

import { StatsData } from './DashboardClient';

interface StatCardProps {
  variant: 'blue' | 'green' | 'orange' | 'purple';
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
}

const variantStyles = {
  blue: {
    iconColor: '#2563eb',
    background: 'linear-gradient(135deg, #dfe8ff, #eef4ff)',
  },
  green: {
    iconColor: '#0f766e',
    background: 'linear-gradient(135deg, #d4f4ed, #eefbf8)',
  },
  orange: {
    iconColor: '#f97316',
    background: 'linear-gradient(135deg, #ffe2bf, #fff1df)',
  },
  purple: {
    iconColor: '#7c3aed',
    background: 'linear-gradient(135deg, #ede9fe, #f5f3ff)',
  },
};

export default function StatCard({
  variant,
  title,
  value,
  description,
  icon,
}: StatCardProps) {
  const styles = variantStyles[variant];

  return (
    <div className="stat-card">
      <div
        className="stat-icon"
        style={{
          color: styles.iconColor,
          background: styles.background,
        }}
      >
        {icon}
      </div>
      <div className="stat-info">
        <div className="stat-title">{title}</div>
        <div className="stat-value">{value}</div>
        <div className="stat-desc">{description}</div>
      </div>
    </div>
  );
}

// StatsCardGrid - receives stats data from parent
export function StatsCardGrid({ data }: { data: StatsData }) {
  return (
    <div className="stats-grid">
      <StatCard
        variant="blue"
        title="Tổng hồ sơ"
        value={data.totalRequests}
        description="Trong workspace hiện tại"
        icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <path d="M14 2v6h6" />
          </svg>
        }
      />
      <StatCard
        variant="orange"
        title="Đang xử lý"
        value={data.inProgress}
        description="Chờ phản hồi chuyên viên"
        icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
        }
      />
      <StatCard
        variant="green"
        title="Đã hoàn tất"
        value={data.completed}
        description="Đúng SLA xử lý"
        icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        }
      />
      <StatCard
        variant="purple"
        title="Tài liệu vault"
        value={data.vaultDocs}
        description="Được phân quyền an toàn"
        icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 7h18v13H3z" />
            <path d="M3 7l3-4h12l3 4" />
          </svg>
        }
      />
    </div>
  );
}
