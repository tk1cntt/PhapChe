'use client';

import React, { useState } from 'react';
import UserLayout from '../../customer/components/UserLayout';
import { SettingsStats } from '../../customer/components/Settings/SettingsStats';
import { SettingsMenu, SettingsTab } from '../../customer/components/Settings/SettingsMenu';

export default function SettingsPage(): JSX.Element {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  return (
    <UserLayout
      userName="Mai Phuong"
      userRole="Customer"
      workspaceName="Cong ty An Phat"
      workspaceSlug="an-phat"
    >
      <div className="settings-page">
        <div className="page-header">
          <div>
            <h1>Cai dat</h1>
            <p className="subtitle">
              Quan ly ho so ca nhan, thong bao, bao mat dang nhap va tuy chon workspace.
            </p>
          </div>
        </div>

        <SettingsStats />

        <div className="settings-grid">
          <SettingsMenu activeTab={activeTab} onTabChange={setActiveTab} />
          <div className="form-card">
            <div className="form-section">
              <div className="panel-title">
                <div className="panel-title-left">Tab: {activeTab}</div>
              </div>
              <p style={{ color: '#64748b', padding: '20px' }}>
                Noi dung tab nay se duoc trien khai trong Plan 31-02.
              </p>
            </div>
          </div>
        </div>
      </div>
    </UserLayout>
  );
}
