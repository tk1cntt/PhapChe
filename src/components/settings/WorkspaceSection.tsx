'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Building2, ArrowRight } from 'lucide-react';

export interface WorkspaceSectionProps {
  workspaces: Array<{ id: string; name: string; slug: string }>;
}

export function WorkspaceSection({ workspaces }: WorkspaceSectionProps): React.ReactElement {
  const t = useTranslations('UserSettings');

  return (
    <div className="form-section">
      <div className="form-section-header">
        <Building2 size={20} />
        <h3>{t('workspaceTitle')}</h3>
      </div>
      <p className="section-description">{t('workspaceDesc')}</p>

      <div className="workspace-list">
        {workspaces.map((ws) => (
          <div key={ws.id} className="workspace-item">
            <div className="workspace-info">
              <div className="workspace-icon">
                <Building2 size={18} />
              </div>
              <div className="workspace-details">
                <span className="workspace-name">{ws.name}</span>
                <span className="workspace-slug">/{ws.slug}</span>
              </div>
            </div>
            <ArrowRight size={18} className="workspace-arrow" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default WorkspaceSection;
