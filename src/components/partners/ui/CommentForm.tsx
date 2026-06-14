'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

interface CommentFormProps {
  requestId: string;
  onSuccess?: (comment: unknown) => void;
}

export function CommentForm({ requestId, onSuccess }: CommentFormProps) {
  const t = useTranslations();
  const [content, setContent] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch(`/api/partner/requests/${requestId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, isInternal }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to add comment');
      }

      const data = await res.json();
      setContent('');
      setIsInternal(false);
      onSuccess?.(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 p-4 bg-white rounded-lg border">
      <h3 className="font-medium text-lg">{t('partner.comments.add')}</h3>
      
      <div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
          rows={4}
          placeholder={t('partner.comments.placeholder')}
        />
      </div>

      <div className="flex items-center justify-between">
        <label className="flex items-center text-sm text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={isInternal}
            onChange={(e) => setIsInternal(e.target.checked)}
            className="mr-2 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
          />
          {t('partner.comments.internal')}
        </label>

        <button
          type="submit"
          disabled={isSubmitting || !content.trim()}
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? t('common.sending') : t('partner.comments.send')}
        </button>
      </div>

      {error && (
        <p className="text-red-600 text-sm bg-red-50 p-2 rounded">{error}</p>
      )}
    </form>
  );
}
