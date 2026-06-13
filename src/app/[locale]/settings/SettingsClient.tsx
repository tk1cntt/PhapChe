'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { SettingsMenu, SettingsTab } from '@/components/settings/SettingsMenu';
import { SettingsStats } from '@/components/settings/SettingsStats';
import { ProfileForm } from '@/components/settings/ProfileForm';
import { SecuritySettings } from '@/components/settings/SecuritySettings';
import { NotificationSettings } from '@/components/settings/NotificationSettings';
import { LanguageSettings } from '@/components/settings/LanguageSettings';
import { AuditSettings } from '@/components/settings/AuditSettings';

export interface UserData {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  title: string | null;
  timezone: string;
  locale: string;
}

export interface SettingsStatsData {
  accountStatus: string;
  securityStatus: string;
  notificationCount: number;
  workspaceCount: number;
}

export interface WorkspaceData {
  id: string;
  name: string;
  slug: string;
}

export interface SettingsClientProps {
  user: UserData;
  stats: SettingsStatsData;
  workspaces: WorkspaceData[];
}

export function SettingsClient({ user, stats, workspaces }: SettingsClientProps): React.ReactElement {
  const t = useTranslations('UserSettings');
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [profileSaved, setProfileSaved] = useState(false);
  // Local state to track locale changes without mutating props
  const [currentLocale, setCurrentLocale] = useState(user.locale);

  const handleSaveProfile = async (data: UserData) => {
    try {
      const response = await fetch('/api/settings/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save profile');
      }

      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    } catch (error) {
      console.error('Save profile failed:', error);
      throw error;
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <ProfileForm
            user={user}
            workspaces={workspaces}
            onSave={handleSaveProfile}
            savedMessage={profileSaved ? t('profileSaved') : undefined}
          />
        );
      case 'security':
        return <SecuritySettings userId={user.id} />;
      case 'notifications':
        return <NotificationSettings />;
      case 'workspace':
        return (
          <div className="tab-panel">
            <h3>{t('tabWorkspace')}</h3>
            <p className="text-muted">{t('workspaceInfo')}</p>
            <div className="workspace-list">
              {workspaces.map((ws) => (
                <div key={ws.id} className="workspace-item">
                  <span className="workspace-name">{ws.name}</span>
                  <span className="workspace-slug">{ws.slug}</span>
                </div>
              ))}
            </div>
          </div>
        );
      case 'language':
        return (
          <LanguageSettings
            currentLocale={currentLocale}
            onLocaleChange={(newLocale) => {
              setCurrentLocale(newLocale);
            }}
          />
        );
      case 'audit':
        return <AuditSettings userId={user.id} />;
      default:
        return null;
    }
  };

  return (
    <div className="settings-page">
      <div className="page-header">
        <h1>{t('pageTitle')}</h1>
        <p className="subtitle">{t('pageDesc')}</p>
      </div>

      <SettingsStats {...stats} />

      <div className="settings-layout">
        <SettingsMenu activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="settings-content">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}

export default SettingsClient;
