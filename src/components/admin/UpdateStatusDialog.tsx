'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

interface WorkbenchRequest {
  id: string;
  code: string;
  title: string;
  status: string;
  priority: string;
  workspaceName: string;
  customerName: string;
  reviewerName: string | null;
}

interface UpdateStatusDialogProps {
  request: WorkbenchRequest;
  onClose: () => void;
  onSuccess: () => void;
}

export function UpdateStatusDialog({ request, onClose, onSuccess }: UpdateStatusDialogProps) {
  const t = useTranslations('SpecialistWorkbench');
  const tStatus = useTranslations('RequestStatus');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Determine next status
  let nextStatus = '';
  let confirmLabel = t('btnConfirm');
  if (request.status === 'assigned') { nextStatus = 'in_progress'; confirmLabel = t('btnStartWork'); }
  else if (request.status === 'in_progress') { nextStatus = 'pending_review'; confirmLabel = t('btnSubmitReview'); }
  else if (request.status === 'revision_required') { nextStatus = 'in_progress'; confirmLabel = t('btnResubmit'); }

  const handleConfirm = async () => {
    setSaving(true);
    setError(null);

    try {
      // Use status API with workflow engine
      const res = await fetch(`/api/admin/requests/${request.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: nextStatus,
          note: note || t('defaultTransitionNote', { from: tStatus(request.status) || request.status, to: tStatus(nextStatus) || nextStatus }),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 403) throw new Error(t('errorForbidden'));
        throw new Error(data.error || t('errorTransitionFailed'));
      }

      setSuccessMsg(t('successTransitioned', { status: tStatus(nextStatus) || nextStatus }));
      setTimeout(() => onSuccess(), 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errorUnknown'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog-container" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="dialog-header">
          <div>
            <h2>{t('dialogTitle')}</h2>
            <p className="dialog-subtitle">{request.code} — {request.title}</p>
          </div>
          <button className="dialog-close" onClick={onClose} aria-label={t('close')}>
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Summary */}
        <div className="dialog-summary">
          <div className="summary-row">
            <span className="summary-label">{t('colWorkspace')}</span>
            <span className="summary-value">{request.workspaceName}</span>
          </div>
          <div className="summary-row">
            <span className="summary-label">{t('colCustomer')}</span>
            <span className="summary-value">{request.customerName}</span>
          </div>
          <div className="summary-row">
            <span className="summary-label">{t('colStatus')}</span>
            <span className="summary-value">
              <span className="status-badge status-gray">{tStatus(request.status) || request.status}</span>
              <span style={{ margin: '0 8px', color: 'var(--color-text-muted)' }}>→</span>
              <span className="status-badge status-blue">{tStatus(nextStatus) || nextStatus}</span>
            </span>
          </div>
        </div>

        {/* Note field */}
        <div className="dialog-field">
          <label className="field-label">{t('labelNote')}</label>
          <textarea
            className="field-select"
            rows={3}
            placeholder={t('placeholderNote')}
            value={note}
            onChange={e => setNote(e.target.value)}
            disabled={saving}
            style={{ resize: 'vertical' }}
          />
        </div>

        {/* Info note */}
        <div className="dialog-note">
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>
            {request.status === 'assigned' ? t('noteStartWork') :
             request.status === 'in_progress' ? t('noteSubmitReview') :
             t('noteResubmit')}
          </span>
        </div>

        {/* Error / Success */}
        {error && (
          <div className="dialog-error">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="dialog-success">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{successMsg}</span>
          </div>
        )}

        {/* Actions */}
        <div className="dialog-actions">
          <button className="btn-cancel" onClick={onClose} disabled={saving}>
            {t('btnCancel')}
          </button>
          <button className="btn-assign" onClick={handleConfirm} disabled={saving}>
            {saving ? (
              <>
                <span className="spinner-small" />
                {t('btnSaving')}
              </>
            ) : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
