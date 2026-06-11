'use client';

import React from 'react';
import { Plus } from 'lucide-react';

export interface WorkspaceBannerProps {
  workspaceName: string;
  workspaceSlug: string;
}

export function WorkspaceBanner({ workspaceName, workspaceSlug }: WorkspaceBannerProps): JSX.Element {
  return (
    <div className="workspace-banner">
      <div>
        <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
          {workspaceName}
        </h2>
        <p className="subtitle">
          Workspace rieng cho ho so, tai lieu, thanh vien va phan quyen du lieu cua cong ty.
        </p>
      </div>
      <button className="create-btn">
        <Plus size={18} />
        Moi thanh vien
      </button>
    </div>
  );
}
