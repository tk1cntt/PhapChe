'use client';

import { useTranslations } from 'next-intl';

type AlertType = 'accessDenied' | 'nearSla' | 'roleChange' | 'noAlerts';

type AlertColor = 'red' | 'orange' | 'blue' | 'green';

interface AlertItemProps {
  type: AlertType;
  icon: string;
  iconColor: AlertColor;
  count: number;
  badgeKey: string;
  badgeColor: AlertColor;
}
  badgeColor: AlertColor;
}
  red: 'badge red',
  orange: 'badge orange',
  blue: 'badge blue',
  green: 'badge green',
};

function AlertItem({ type, icon, iconColor, count, badgeKey, badgeColor }: AlertItemProps) {
  const t = useTranslations('AdminDashboard');
  return (
    <div className="alert-item">
      <div className="item-left">
        <div className={`item-icon ${iconColor}`}>{icon}</div>
        <div className="item-info">
          <strong>{t(`alert.${type}`, { count })}</strong>
          <span>{t(`alert.${type}Desc`)}</span>
        </div>
      </div>
      <span className={badgeClass[badgeColor] || badgeClass.blue}>{t(`alert.badge.${badgeKey}`)}</span>
    </div>
  );
}

export function AlertPanel({ alerts = [] }: { alerts?: AlertItemProps[] }) {
  const t = useTranslations('AdminDashboard');

  return (
    <div className="panel">
      <div className="panel-title">
        <div className="panel-title-left">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <path d="M12 9v4" />
            <path d="M12 17h.01" />
          </svg>
          {t('alertsPanel')}
        </div>
      </div>

      <div className="alert-list">
        {alerts.length === 0 ? (
          <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            {t('noAlerts')}
          </div>
        ) : (
alerts.map((alert) => <AlertItem key={alert.type} {...alert} />)
        )}
      </div>
    </div>
  );
}

export default AlertPanel;
