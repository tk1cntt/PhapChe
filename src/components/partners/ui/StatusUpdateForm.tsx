'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { PARTNER_ALLOWED_STATUSES, PARTNER_STATUS_LABELS, type PartnerAllowedStatus } from '@/lib/constants/partner-statuses';

interface StatusUpdateFormProps {
  requestId: string;
  currentStatus: string;
  onSuccess?: () => void;
}

export function StatusUpdateForm({ requestId, currentStatus, onSuccess }: StatusUpdateFormProps) {
  const t = useTranslations();
  const [status, setStatus] = useState(currentStatus);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === currentStatus && !note) return;

    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`/api/partner/requests/${requestId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, note }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || data.error || 'Failed to update status');
      }

      setSuccess(t('partner.status.updateSuccess'));
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if status transition is allowed
  const isAllowedStatus = PARTNER_ALLOWED_STATUSES.includes(status as PartnerAllowedStatus);
  const canSubmit = !isSubmitting && (status !== currentStatus || note.length > 0) && isAllowedStatus;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-white rounded-lg border">
      <h3 className="font-medium text-lg">{t('partner.status.title')}</h3>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('partner.status.label')}
        </label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
          disabled={isSubmitting}
        >
          {PARTNER_ALLOWED_STATUSES.map((s) => (
            <option key={s} value={s}>
              {PARTNER_STATUS_LABELS[s]?.vi || s}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('partner.status.note')}
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
          rows={3}
          placeholder={t('partner.status.notePlaceholder')}
        />
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-green-600 text-sm">{success}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isSubmitting ? t('common.saving') : t('partner.status.update')}
      </button>
    </form>
  );
}
