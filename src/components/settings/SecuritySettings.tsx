'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Shield, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';

export interface SecuritySettingsProps {
  // Reserved for future use (e.g., two-factor setup)
}

export function SecuritySettings(_props: SecuritySettingsProps): React.ReactElement {
  // If absolutely needed later: const { userId } = _props;
  // If absolutely needed later: const { userId } = _props;
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

const MIN_PASSWORD_LENGTH = 8;

// ... inside handleSubmit:
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setError(t('errorPasswordTooShort'));
// ... inside handleSubmit:
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setError(t('errorPasswordTooShort'));
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
// Extract above the component:
interface PasswordFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  autoComplete: string;
  showPassword: boolean;
  onToggleVisibility: () => void;
}

function PasswordField({
  id, label, value, onChange, placeholder, autoComplete,
  showPassword, onToggleVisibility,
}: PasswordFieldProps) {
  const t = useTranslations('UserSettings');
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="password-input-wrapper">
        <input
          type={showPassword ? 'text' : 'password'}
          id={id}
          name={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
        />
        <button
          type="button"
          className="password-toggle"
          onClick={onToggleVisibility}
          aria-label={showPassword ? t('hidePassword') : t('showPassword')}
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
}

// Usage in the form:
<PasswordField
  id="currentPassword"
  label={t('fieldCurrentPassword')}
  value={currentPassword}
  onChange={setCurrentPassword}
  placeholder={t('placeholderCurrentPassword')}
  autoComplete="current-password"
  showPassword={showCurrentPassword}
  onToggleVisibility={() => setShowCurrentPassword((v) => !v)}
/>
<PasswordField
  id="newPassword"
  label={t('fieldNewPassword')}
  value={newPassword}
  onChange={setNewPassword}
  placeholder={t('placeholderNewPassword')}
  autoComplete="new-password"
  showPassword={showNewPassword}
  onToggleVisibility={() => setShowNewPassword((v) => !v)}
/>
<PasswordField
  id="confirmPassword"
  label={t('fieldConfirmPassword')}
  value={confirmPassword}
  onChange={setConfirmPassword}
  placeholder={t('placeholderConfirmPassword')}
  autoComplete="new-password"
  showPassword={showConfirmPassword}
  onToggleVisibility={() => setShowConfirmPassword((v) => !v)}
/>
          type={showPassword ? 'text' : 'password'}
          id={id}
          name={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
        />
        <button
          type="button"
          className="password-toggle"
          onClick={onToggleVisibility}
          aria-label={showPassword ? t('hidePassword') : t('showPassword')}
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
}

// Usage in the form:
<PasswordField
  id="currentPassword"
  label={t('fieldCurrentPassword')}
  value={currentPassword}
  onChange={setCurrentPassword}
  placeholder={t('placeholderCurrentPassword')}
  autoComplete="current-password"
  showPassword={showCurrentPassword}
  onToggleVisibility={() => setShowCurrentPassword((v) => !v)}
/>
<PasswordField
  id="newPassword"
  label={t('fieldNewPassword')}
  value={newPassword}
  onChange={setNewPassword}
  placeholder={t('placeholderNewPassword')}
  autoComplete="new-password"
  showPassword={showNewPassword}
  onToggleVisibility={() => setShowNewPassword((v) => !v)}
/>
<PasswordField
  id="confirmPassword"
  label={t('fieldConfirmPassword')}
  value={confirmPassword}
  onChange={setConfirmPassword}
  placeholder={t('placeholderConfirmPassword')}
  autoComplete="new-password"
  showPassword={showConfirmPassword}
  onToggleVisibility={() => setShowConfirmPassword((v) => !v)}
/>
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
