'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { SettingsStats } from '../../customer/components/Settings/SettingsStats';
import { SettingsMenu, SettingsTab } from '../../customer/components/Settings/SettingsMenu';
import { ProfileForm } from '../../customer/components/Settings/ProfileForm';
import { ToggleRow } from '../../customer/components/Settings/ToggleRow';

export interface SettingsClientProps {
  userName: string;
  userEmail: string;
  workspaceName: string;
}

export function SettingsClient({ userName, userEmail, workspaceName }: SettingsClientProps): React.ReactElement {
  const t = useTranslations('UserSettings');
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileForm />;

      case 'security':
        return (
          <div className="security-settings">
            <div className="field-grid">
              <div className="field">
                <label htmlFor="currentPassword">{t('currentPassword')}</label>
                <input
                  type="password"
                  id="currentPassword"
                  name="currentPassword"
                  placeholder={t('currentPasswordPlaceholder')}
                />
              </div>

              <div className="field">
                <label htmlFor="newPassword">{t('newPassword')}</label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  placeholder={t('newPasswordPlaceholder')}
                />
              </div>

              <div className="field">
                <label htmlFor="confirmPassword">{t('confirmPassword')}</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  placeholder={t('confirmPasswordPlaceholder')}
                />
              </div>
            </div>

            <div className="toggle-section" style={{ marginTop: 32 }}>
              <ToggleRow
                label={t('twoFactor')}
                description={t('twoFactorDesc')}
                defaultChecked={false}
              />
              <ToggleRow
                label={t('loginAlert')}
                description={t('loginAlertDesc')}
                defaultChecked={true}
              />
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="notification-settings">
            <ToggleRow
              label={t('emailOnReply')}
              description={t('emailOnReplyDesc')}
              defaultChecked={true}
            />
            <ToggleRow
              label={t('slaReminder')}
              description={t('slaReminderDesc')}
              defaultChecked={true}
            />
            <ToggleRow
              label={t('weeklySummary')}
              description={t('weeklySummaryDesc')}
              defaultChecked={false}
            />
          </div>
        );

      case 'workspace':
        return (
          <div className="workspace-settings">
            <div className="field">
              <label htmlFor="defaultWorkspace">{t('defaultWorkspace')}</label>
              <input
                type="text"
                id="defaultWorkspace"
                name="defaultWorkspace"
                defaultValue={workspaceName}
                readOnly
              />
              <p className="field-hint">{t('workspaceHint')}</p>
            </div>
          </div>
        );

      case 'language':
        return (
          <div className="language-settings">
            <div className="field">
              <label htmlFor="language">{t('language')}</label>
              <select id="language" name="language" defaultValue="vi">
                <option value="vi">Tiếng Việt</option>
                <option value="en">English</option>
                <option value="zh">中文</option>
                <option value="ja">日本語</option>
              </select>
            </div>
          </div>
        );

      case 'audit':
        return (
          <div className="audit-settings">
            <p className="audit-hint">{t('auditHint')}</p>
            <div className="empty-state">
              <p>{t('noAuditData')}</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <SettingsStats />

      <div className="settings-grid">
        <SettingsMenu activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="form-card">
          <div className="form-section">
            <div className="panel-title">
              <div className="panel-title-left">{t(`tab${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`)}</div>
            </div>
            {renderTabContent()}
          </div>
        </div>
      </div>
    </>
  );
}
