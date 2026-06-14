'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

interface StatusUpdateFormProps {
  requestId: string;
  currentStatus: string;
  onSuccess?: () => void;
}

const ALLOWED_STATUSES = [
  { value: 'in_progress', labelKey: 'partner.status.inProgress' },
  { value: 'waiting_customer', labelKey: 'partner.status.waitingCustomer' },
  { value: 'review_pending', labelKey: 'partner.status.reviewPending' },
  { value: 'completed', labelKey: 'partner.status.completed' },
];

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

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update status');
      }

      setSuccess(t('partner.status.updateSuccess'));
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsSubmitting(false);
    }
  };

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
          {ALLOWED_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{t(s.labelKey)}</option>
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
        <p className="text-red-600 text-sm bg-red-50 p-2 rounded">{error}</p>
      )}
      
      {success && (
        <p className="text-green-600 text-sm bg-green-50 p-2 rounded">{success}</p>
      )}

      <button
        type="submit"
        disabled={isSubmitting || (status === currentStatus && !note)}
        className="w-full px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isSubmitting ? t('common.saving') : t('partner.status.update')}
      </button>
    </form>
  );
}
