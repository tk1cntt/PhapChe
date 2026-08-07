'use client';

import { useTranslations } from 'next-intl';

interface ApprovalItemProps {
  icon: string;
  iconColor: 'orange' | 'blue' | 'red';
  title: string;
  description: string;
  badge: string;
  badgeColor: 'orange' | 'blue' | 'red';
}

type BadgeColor = 'orange' | 'blue' | 'red';

const badgeClass: Record<BadgeColor, string> = {
  orange: 'badge orange',
  blue: 'badge blue',
  red: 'badge red',
};
  red: 'badge red',
};
  return (
    <div className="approval-item">
      <div className="item-left">
        <div className={`item-icon ${iconColor}`}>{icon}</div>
        <div className="item-info">
          <strong>{title}</strong>
          <span>{description}</span>
        </div>
      </div>
      <span className={badgeClass[badgeColor]}>{badge}</span>
    </div>
  );
}

export function ApprovalPanel({ approvals = [] }: { approvals?: ApprovalItemProps[] }) {
  const t = useTranslations('AdminDashboard');

  return (
    <div className="panel">
      <div className="panel-title">
        <div className="panel-title-left">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 6 9 17l-5-5" />
          </svg>
          {t('approvalsPanel')}
        </div>
      </div>

      <div className="approval-list">
        {approvals.length === 0 ? (
          <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            {t('noApprovals')}
          </div>
        ) : (
          approvals.map((item) => <ApprovalItem key={item.id ?? item.title} {...item} />)
        )}
      </div>
    </div>
  );
}

export default ApprovalPanel;
