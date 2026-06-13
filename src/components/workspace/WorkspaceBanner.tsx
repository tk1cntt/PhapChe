'use client';

import React, { useState } from 'react';
import { Plus, X, Mail } from 'lucide-react';
import { useTranslations } from 'next-intl';

export interface WorkspaceBannerProps {
  workspaceName: string;
  workspaceSlug: string;
}

export function WorkspaceBanner({ workspaceName, workspaceSlug }: WorkspaceBannerProps): React.ReactElement {
  const t = useTranslations('UserWorkspace');
  const [showDialog, setShowDialog] = useState(false);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleInviteClick = () => {
    setShowDialog(true);
    setEmail('');
    setError('');
    setSuccess('');
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEmail('');
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError(t('invalidEmailError'));
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/workspace/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || t('inviteFailed'));
      }

      setSuccess(t('inviteSuccess'));
      setTimeout(() => {
        handleCloseDialog();
        // Optionally refresh the page to show the new member
        window.location.reload();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('inviteFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="workspace-banner">
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
            {workspaceName}
          </h2>
          <p className="subtitle">
            {t('bannerDesc')}
          </p>
        </div>
        <button className="create-btn" onClick={handleInviteClick}>
          <Plus size={18} />
          {t('inviteMember')}
        </button>
      </div>

      {showDialog && (
        <div className="invite-dialog-overlay" onClick={handleCloseDialog}>
          <div className="invite-dialog" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #d4f4ed, #eefbf8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Mail size={22} color="#087f78" />
                </div>
                <div>
                  <h3 style={{ margin: 0 }}>{t('inviteMember')}</h3>
                  <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>{t('inviteMemberDesc')}</p>
                </div>
              </div>
              <button
                onClick={handleCloseDialog}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  color: '#64748b'
                }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-field">
                <label>{t('emailAddress')}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('emailPlaceholder')}
                  disabled={isLoading}
                  autoFocus
                />
              </div>

              {error && <div className="error-message">{error}</div>}
              {success && <div className="success-message">{success}</div>}

              <div className="dialog-actions">
                <button type="button" className="btn-cancel" onClick={handleCloseDialog} disabled={isLoading}>
                  {t('cancel')}
                </button>
                <button type="submit" className="btn-invite" disabled={isLoading || !email}>
                  {isLoading ? t('sending') : (
                    <>
                      <Mail size={16} />
                      {t('sendInvite')}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default WorkspaceBanner;
