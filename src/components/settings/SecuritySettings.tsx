'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Shield, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';

export interface SecuritySettingsProps {
  userId: string;
}

export function SecuritySettings({ userId }: SecuritySettingsProps): React.ReactElement {
  const t = useTranslations('UserSettings');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validate passwords
    if (!currentPassword) {
      setError(t('errorCurrentPasswordRequired'));
      return;
    }

    if (!newPassword) {
      setError(t('errorNewPasswordRequired'));
      return;
    }

    if (newPassword.length < 8) {
      setError(t('errorPasswordTooShort'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t('errorPasswordMismatch'));
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/settings/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t('errorPasswordChangeFailed'));
      }

      setSuccess(t('passwordChangeSuccess'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errorPasswordChangeFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="security-settings">
      <div className="settings-section">
        <div className="section-header">
          <Shield size={20} />
          <h3>{t('securityTitle')}</h3>
        </div>

        <form onSubmit={handleSubmit} className="password-form">
          <div className="field">
            <label htmlFor="currentPassword">{t('fieldCurrentPassword')}</label>
            <div className="password-input-wrapper">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                id="currentPassword"
                name="currentPassword"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder={t('placeholderCurrentPassword')}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                aria-label={showCurrentPassword ? t('hidePassword') : t('showPassword')}
              >
                {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="field">
            <label htmlFor="newPassword">{t('fieldNewPassword')}</label>
            <div className="password-input-wrapper">
              <input
                type={showNewPassword ? 'text' : 'password'}
                id="newPassword"
                name="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t('placeholderNewPassword')}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowNewPassword(!showNewPassword)}
                aria-label={showNewPassword ? t('hidePassword') : t('showPassword')}
              >
                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="field">
            <label htmlFor="confirmPassword">{t('fieldConfirmPassword')}</label>
            <div className="password-input-wrapper">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t('placeholderConfirmPassword')}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? t('hidePassword') : t('showPassword')}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="alert alert-error">
              <XCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="alert alert-success">
              <CheckCircle size={16} />
              <span>{success}</span>
            </div>
          )}

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? t('changing') : t('changePassword')}
            </button>
          </div>
        </form>
      </div>

      <div className="settings-section">
        <div className="section-header">
          <Shield size={20} />
          <h3>{t('twoFactorTitle')}</h3>
        </div>
        <p className="text-muted">{t('twoFactorDesc')}</p>
        <div className="two-factor-status">
          <span className="status-badge">{t('comingSoon')}</span>
        </div>
      </div>
    </div>
  );
}

export default SecuritySettings;
