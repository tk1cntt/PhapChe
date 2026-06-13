'use client';

import React from 'react';
import { useTranslations } from 'next-intl';

export interface WorkspaceOption {
  id: string;
  name: string;
  slug: string;
}

export interface UserProfile {
  name: string;
  email: string;
  phone: string | null;
  title: string | null;
  timezone: string;
  currentWorkspaceId?: string;
}

export interface ProfileFormProps {
  user: UserProfile;
  workspaces: WorkspaceOption[];
  onSave?: (data: UserProfile) => Promise<void>;
  savedMessage?: string;
}

export function ProfileForm({ user, workspaces, onSave, savedMessage }: ProfileFormProps): React.ReactElement {
  const t = useTranslations('UserSettings');
  const [formData, setFormData] = React.useState<UserProfile>(user);
  const [saving, setSaving] = React.useState(false);
  const saveTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSave = async (data: UserProfile) => {
    if (!onSave) return;
    setSaving(true);
    try {
      await onSave(data);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof UserProfile, value: string) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);

    // Debounce save to avoid API spam
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      handleSave(newData);
    }, 1000);
  };

  React.useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="profile-form">
      {(savedMessage || saving) && (
        <div className={`save-status ${saving ? 'saving' : 'saved'}`}>
          {saving ? t('saving') : savedMessage}
        </div>
      )}
      <div className="field-grid">
        <div className="field">
          <label htmlFor="fullName">{t('fieldFullName')}</label>
          <input
            type="text"
            id="fullName"
            name="fullName"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder={t('placeholderFullName')}
          />
        </div>

        <div className="field">
          <label htmlFor="email">{t('fieldEmail')}</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder={t('placeholderEmail')}
          />
        </div>

        <div className="field">
          <label htmlFor="phone">{t('fieldPhone')}</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone || ''}
            onChange={(e) => handleChange('phone', e.target.value)}
            placeholder={t('placeholderPhone')}
          />
        </div>

        <div className="field">
          <label htmlFor="title">{t('fieldTitle')}</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title || ''}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder={t('placeholderTitle')}
          />
        </div>

        <div className="field">
          <label htmlFor="workspace">{t('fieldWorkspace')}</label>
          <select
            id="workspace"
            name="workspace"
            value={formData.currentWorkspaceId || ''}
            onChange={(e) => handleChange('currentWorkspaceId', e.target.value)}
          >
            {workspaces.map((ws) => (
              <option key={ws.id} value={ws.id}>
                {ws.name}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="timezone">{t('fieldTimezone')}</label>
          <select
            id="timezone"
            name="timezone"
            value={formData.timezone}
            onChange={(e) => handleChange('timezone', e.target.value)}
          >
            <option value="Asia/Ho_Chi_Minh">Asia/Ho_Chi_Minh (ICT)</option>
            <option value="Asia/Bangkok">Asia/Bangkok (ICT)</option>
            <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
            <option value="UTC">UTC</option>
          </select>
        </div>
      </div>
    </div>
  );
}

export default ProfileForm;
