'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { StatsData } from './DashboardClient';

interface StatCardProps {
  variant: 'blue' | 'green' | 'orange' | 'purple';
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  href?: string;
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
  href,
}: StatCardProps) {
  const styles = variantStyles[variant];

  const cardContent = (
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

  if (href) {
    return (
      <Link href={href} className="stat-card-link">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}

// StatsCardGrid - receives stats data from parent with i18n
export function StatsCardGrid({ data }: { data: StatsData }) {
  const t = useTranslations('StatCard');

  return (
    <div className="stats-grid">
      <StatCard
        variant="blue"
        title={t('totalRequests')}
        value={data.totalRequests}
        description={t('totalRequestsDesc')}
        href="/cases"
        icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <path d="M14 2v6h6" />
          </svg>
        }
      />
      <StatCard
        variant="orange"
        title={t('inProgress')}
        value={data.inProgress}
        description={t('inProgressDesc')}
        href="/cases?status=in_progress"
        icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
        }
      />
      <StatCard
        variant="green"
        title={t('completed')}
        value={data.completed}
        description={t('completedDesc')}
        href="/cases?status=completed"
        icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        }
      />
      <StatCard
        variant="purple"
        title={t('vaultDocs')}
        value={data.vaultDocs}
        description={t('vaultDocsDesc')}
        href="/vault"
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
