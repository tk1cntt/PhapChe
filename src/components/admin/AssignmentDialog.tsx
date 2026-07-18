'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

interface TriageRequest {
  id: string;
  code: string;
  title: string;
  description: string;
  workspaceId: string;
  workspaceName: string;
  status: string;
  priority: string;
  customerName: string;
  customerEmail: string;
  matterTypeKey: string | null;
}

interface StaffMember {
  id: string;
  name: string;
  email: string;
  workspaceId: string;
}

interface AssignmentDialogProps {
  request: TriageRequest;
  specialists: StaffMember[];
  reviewers: StaffMember[];
  onClose: () => void;
  onSuccess: () => void;
}

export function AssignmentDialog({ request, specialists, reviewers, onClose, onSuccess }: AssignmentDialogProps) {
  const t = useTranslations('AdminTriage');
  const tWorkflow = useTranslations('RequestWorkflow');
  const [selectedSpecialist, setSelectedSpecialist] = useState<string>('');
  const [selectedReviewer, setSelectedReviewer] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filter specialists/reviewers for this request's workspace
  const wsSpecialists = specialists.filter(s => s.workspaceId === request.workspaceId);
  const wsReviewers = reviewers.filter(r => r.workspaceId === request.workspaceId);

  const handleAssign = async () => {
    if (!selectedSpecialist) {
      setError(t('errorNoSpecialist'));
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // 1. Gán specialist + reviewer
      const assignRes = await fetch(`/api/admin/requests/${request.id}/assign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          specialistId: selectedSpecialist,
          reviewerId: selectedReviewer || null,
        }),
      });

      if (!assignRes.ok) {
        const data = await assignRes.json().catch(() => ({}));
        throw new Error(data.error || t('errorAssignFailed'));
      }

      // 2. Workflow transition: triage/draft_intake → assigned
      const statusRes = await fetch(`/api/admin/requests/${request.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'assigned',
          note: tWorkflow('transitionNote', {
            specialist: specialists.find(s => s.id === selectedSpecialist)?.name ?? '',
            reviewer: selectedReviewer ? reviewers.find(r => r.id === selectedReviewer)?.name ?? '' : t('none'),
          }),
        }),
      });

      if (!statusRes.ok) {
        const data = await statusRes.json().catch(() => ({}));
        // Assignment succeeded but status transition failed — still show warning
        if (statusRes.status === 400) {
          setError(t('errorStatusTransition', { detail: data.error || '' }));
          setSaving(false);
          return;
        }
        throw new Error(data.error || t('errorStatusTransition', { detail: '' }));
      }

      setSuccessMsg(t('successAssigned'));
      setTimeout(() => onSuccess(), 1200);
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
            <p className="dialog-subtitle">{t('dialogSubtitle', { code: request.code })}</p>
          </div>
          <button className="dialog-close" onClick={onClose} aria-label={t('close')}>
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Request Summary */}
        <div className="dialog-summary">
          <div className="summary-row">
            <span className="summary-label">{t('colTitle')}</span>
            <span className="summary-value">{request.title}</span>
          </div>
          <div className="summary-row">
            <span className="summary-label">{t('colCustomer')}</span>
            <span className="summary-value">{request.customerName} ({request.customerEmail})</span>
          </div>
          <div className="summary-row">
            <span className="summary-label">{t('colWorkspace')}</span>
            <span className="summary-value">{request.workspaceName}</span>
          </div>
          <div className="summary-row">
            <span className="summary-label">{t('colStatus')}</span>
            <span className={`status-badge ${request.status === 'triage' ? 'status-blue' : 'status-gray'}`}>
              {request.status === 'triage' ? t('statusTriage') : t('statusDraft')}
            </span>
          </div>
        </div>

        {/* Specialist Selection */}
        <div className="dialog-field">
          <label className="field-label">
            {t('labelSpecialist')} <span className="required">*</span>
          </label>
          <select
            value={selectedSpecialist}
            onChange={e => setSelectedSpecialist(e.target.value)}
            className="field-select"
            disabled={saving}
          >
            <option value="">{t('placeholderSelectSpecialist')}</option>
            {wsSpecialists.map(s => (
              <option key={s.id} value={s.id}>{s.name} ({s.email})</option>
            ))}
            {wsSpecialists.length === 0 && (
              <option value="" disabled>{t('noSpecialistsAvailable')}</option>
            )}
          </select>
        </div>

        {/* Reviewer Selection */}
        <div className="dialog-field">
          <label className="field-label">{t('labelReviewer')}</label>
          <select
            value={selectedReviewer}
            onChange={e => setSelectedReviewer(e.target.value)}
            className="field-select"
            disabled={saving}
          >
            <option value="">{t('placeholderSelectReviewer')}</option>
            {wsReviewers.map(r => (
              <option key={r.id} value={r.id}>{r.name} ({r.email})</option>
            ))}
            {wsReviewers.length === 0 && (
              <option value="" disabled>{t('noReviewersAvailable')}</option>
            )}
          </select>
        </div>

        {/* Transition Note */}
        <div className="dialog-note">
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>
            {request.status === 'draft_intake'
              ? t('noteDraftToAssigned')
              : t('noteTriageToAssigned')}
          </span>
        </div>

        {/* Error/Success Messages */}
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
          <button
            className="btn-assign"
            onClick={handleAssign}
            disabled={saving || !selectedSpecialist}
          >
            {saving ? (
              <>
                <span className="spinner-small" />
                {t('btnSaving')}
              </>
            ) : (
              t('btnConfirmAssign')
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
