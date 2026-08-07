'use client';

import { useTranslations } from 'next-intl';

type ColorVariant = 'green' | 'blue' | 'orange';

interface WorkspaceItemProps {
  initials: string;
  iconColor: ColorVariant;
  name: string;
  description: string;
  badge: string;
  badgeColor: ColorVariant;
}
  badgeColor: ColorVariant;
}
  green: 'badge green',
  blue: 'badge blue',
  orange: 'badge orange',
};

function WorkspaceItem({ initials, iconColor, name, description, badge, badgeColor }: WorkspaceItemProps) {
  return (
    <div className="workspace-item">
      <div className="item-left">
        <div className={`item-icon ${iconColor}`}>{initials}</div>
        <div className="item-info">
          <strong>{name}</strong>
          <span>{description}</span>
        </div>
      </div>
      <span className={badgeClass[badgeColor] || badgeClass.blue}>{badge}</span>
    </div>
  );
}

export function WorkspacePanel({ workspaces = [] }: { workspaces?: WorkspaceItemProps[] }) {
  const t = useTranslations('AdminDashboard');

  return (
    <div className="panel">
      <div className="panel-title">
        <div className="panel-title-left">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 21h18" />
            <path d="M5 21V7h6v14" />
            <path d="M13 21V3h6v18" />
          </svg>
          {t('workspacesPanel')}
        </div>
      </div>

      <div className="workspace-list">
        {workspaces.length === 0 ? (
          <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            {t('noWorkspaces')}
          </div>
        ) : (
workspaces.map((ws, index) => <WorkspaceItem key={ws.name ?? index} {...ws} />)
        )}
      </div>
    </div>
  );
}

export default WorkspacePanel;
