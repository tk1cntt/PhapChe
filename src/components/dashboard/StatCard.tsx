'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { StatsData } from './DashboardClient';

interface StatCardContent {
  title: string;
  value: string | number;
  description: string;
}

interface StatCardProps {
  variant: 'blue' | 'green' | 'orange' | 'purple';
  data: StatCardContent;
  icon: React.ReactNode;
  href?: string;
}
  data: StatCardContent;
  icon: React.ReactNode;
  href?: string;
}
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
} as const;

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

  interface CardConfig {
    variant: StatCardProps['variant'];
    titleKey: Parameters<typeof t>[0];
    valueKey: keyof StatsData;
    descKey: Parameters<typeof t>[0];
    href: string;
    icon: React.ReactNode;
  }

  const cardConfigs: CardConfig[] = [
    { variant: 'blue',   titleKey: 'totalRequests',  valueKey: 'totalRequests',  descKey: 'totalRequestsDesc',  href: '/cases',                    icon: FILE_ICON },
    { variant: 'orange', titleKey: 'inProgress',     valueKey: 'inProgress',     descKey: 'inProgressDesc',     href: '/cases?status=in_progress',  icon: CLOCK_ICON },
    { variant: 'green',  titleKey: 'completed',      valueKey: 'completed',      descKey: 'completedDesc',      href: '/cases?status=completed',    icon: CHECK_ICON },
    { variant: 'purple', titleKey: 'vaultDocs',      valueKey: 'vaultDocs',      descKey: 'vaultDocsDesc',      href: '/vault',                     icon: VAULT_ICON },
  ];

  return (
    <div className="stats-grid">
      {cardConfigs.map((cfg) => (
        <StatCard
          key={cfg.valueKey}
          variant={cfg.variant}
          title={t(cfg.titleKey)}
          value={data[cfg.valueKey]}
          description={t(cfg.descKey)}
          href={cfg.href}
          icon={cfg.icon}
        />
      ))}
    </div>
  );
}
