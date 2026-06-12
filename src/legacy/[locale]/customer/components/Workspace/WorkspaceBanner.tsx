'use client';

import React from 'react';
import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';

export interface WorkspaceBannerProps {
  workspaceName: string;
  workspaceSlug: string;
}

export function WorkspaceBanner({ workspaceName, workspaceSlug }: WorkspaceBannerProps): React.ReactElement {
  const t = useTranslations('UserWorkspace');
  return (
    <div className="workspace-banner">
      <div>
        <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
          {workspaceName}
        </h2>
        <p className="subtitle">
          {t('bannerDesc')}
        </p>
      </div>
      <button className="create-btn">
        <Plus size={18} />
        {t('inviteMember')}
      </button>
    </div>
  );
}

export default WorkspaceBanner;
