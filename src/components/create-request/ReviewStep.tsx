'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { CheckCircle2, AlertCircle, Edit2, Loader2 } from 'lucide-react';
import { SEED_LEGAL_DOMAINS, SEED_MATTER_TYPES } from '@/lib/i18n/seed-legal-domains';
import type { WizardState } from '@/lib/types/wizard';

interface ReviewStepProps {
  state: WizardState;
  onEdit: (step: 1 | 2 | 3 | 4 | 5) => void;
  onSubmit: () => Promise<void>;
  locale?: string;
  userContactInfo?: {
    email?: string;
    phone?: string;
    companyName?: string;
    taxCode?: string;
  };
}

export default function ReviewStep({
  state,
  onEdit,
  onSubmit,
  locale = 'vi',
  userContactInfo,
}: ReviewStepProps) {
  const t = useTranslations('CreateRequest');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const domain = state.domainId ? SEED_LEGAL_DOMAINS[state.domainId] : null;
  const service = state.serviceType ? SEED_MATTER_TYPES[state.serviceType] : null;
  const tKey = (locale || 'vi') as 'vi' | 'en' | 'zh' | 'ja';
  const domainLabel = domain?.label[tKey] || domain?.label.vi || t('label.notSelected');
  const serviceLabel = service?.label[tKey] || service?.label.vi || t('label.notSelected');

  const isFormValid = state.domainId && state.serviceType && state.contactInfo.email;

  const handleSubmit = async () => {
    if (!isFormValid) {
      setError(t('error.fillAllRequired'));
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit();
      setShowSuccess(true);

      setTimeout(() => {
        window.location.href = `/${locale}/cases`;
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('error.submitGeneralError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = () => {
    setError(null);
  };

  if (showSuccess) {
    return (
      <div className="success-overlay">
        <div className="success-modal">
          <div className="success-icon-large">
            <CheckCircle2 size={64} />
          </div>
          <h2 className="success-title">{t('message.submitSuccessTitle')}</h2>
          <p className="success-desc">
            {t('message.submitSuccessDesc')}
          </p>
          <div className="success-redirect">
            <Loader2 size={16} className="animate-spin" />
            <span>{t('review.redirectingToRequests')}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="review-grid">
      {/* Summary Column */}
      <div className="review-summary">
        <div className="review-card">
          <div className="review-card-header">
            <h3 className="review-card-title">{t('review.domainAndService')}</h3>
            <button onClick={() => onEdit(1)} className="edit-btn">
              <Edit2 size={14} />
              <span>{t('button.edit')}</span>
            </button>
          </div>
          <div className="review-card-content">
            <div className="review-row">
              <span className="review-label">{t('label.domain')}:</span>
              <p className="review-value">{domainLabel}</p>
            </div>
            <div className="review-row">
              <span className="review-label">{t('label.service')}:</span>
              <p className="review-value">{serviceLabel}</p>
            </div>
          </div>
        </div>

        {state.serviceType && service && (
          <div className="review-card">
            <div className="review-card-header">
              <h3 className="review-card-title">{t('review.details')}</h3>
              <button onClick={() => onEdit(3)} className="edit-btn">
                <Edit2 size={14} />
                <span>{t('button.edit')}</span>
              </button>
            </div>
            <div className="review-card-content">
              {service.questions.map((question) => {
                const answer = state.answers[question.key] || '';
                return (
                  <div key={question.key} className="review-row">
                    <span className="review-label">
                      {question.label}
                      {question.required && <span className="required-star">*</span>}
                    </span>
                    <p className="review-value">
                      {answer || <span className="text-gray-400 italic">{t('label.notEntered')}</span>}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="review-card">
          <div className="review-card-header">
            <h3 className="review-card-title">{t('fileUpload.title')}</h3>
            <button onClick={() => onEdit(4)} className="edit-btn">
              <Edit2 size={14} />
              <span>{t('button.edit')}</span>
            </button>
          </div>
          <div className="review-card-content">
            {state.files.length > 0 ? (
              <ul className="files-list">
                {state.files.map((file) => (
                  <li key={file.vaultFileId} className="files-list-item">
                    <span className="file-name">{file.filename}</span>
                    <span className="file-size">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-sm">{t('review.noDocuments')}</p>
            )}
          </div>
        </div>

        <div className="review-card">
          <h3 className="review-card-title">{t('label.priority')}</h3>
          <div className="priority-options">
            <label className={`priority-option ${state.priority === 'normal' ? 'selected' : ''}`}>
              <input type="radio" name="priority" value="normal" checked={state.priority === 'normal'} onChange={() => {}} className="sr-only" />
              <div className="priority-content">
                <p className="priority-label">{t('label.normal')}</p>
                <p className="priority-desc">{t('label.normalSla')}</p>
              </div>
            </label>
            <label className={`priority-option ${state.priority === 'urgent' ? 'selected urgent' : ''}`}>
              <input type="radio" name="priority" value="urgent" checked={state.priority === 'urgent'} onChange={() => {}} className="sr-only" />
              <div className="priority-content">
                <p className="priority-label">{t('label.urgent')}</p>
                <p className="priority-desc">{t('label.urgentSla')}</p>
              </div>
            </label>
          </div>
        </div>

        <div className="review-card">
          <h3 className="review-card-title">{t('label.contactInfo')}</h3>
          <div className="contact-form">
            <div className="form-field">
              <label className="form-label">{t('label.email')} <span className="required-star">*</span></label>
              <input type="email" className="form-input" value={state.contactInfo.email || userContactInfo?.email || ''} placeholder="email@example.com" readOnly />
            </div>
            <div className="form-field">
              <label className="form-label">{t('label.phone')}</label>
              <input type="tel" className="form-input" value={state.contactInfo.phone || userContactInfo?.phone || ''} placeholder="0123456789" readOnly />
            </div>
            <div className="form-field">
              <label className="form-label">{t('label.companyName')}</label>
              <input type="text" className="form-input" value={state.contactInfo.companyName || userContactInfo?.companyName || ''} placeholder={t('label.companyName')} readOnly />
            </div>
            <div className="form-field">
              <label className="form-label">{t('label.taxCode')}</label>
              <input type="text" className="form-input" value={state.contactInfo.taxCode || userContactInfo?.taxCode || ''} placeholder={t('label.taxCode')} readOnly />
            </div>
          </div>
        </div>
      </div>

      {/* Actions Column */}
      <div className="review-actions">
        <div className="action-card">
          <h3 className="action-title">{t('review.confirmAndSubmit')}</h3>

          <div className="check-list">
            <div className="check-item">
              {state.domainId ? <CheckCircle2 size={16} className="check-ok" /> : <AlertCircle size={16} className="check-no" />}
              <span>{t('review.domainSelected')}</span>
            </div>
            <div className="check-item">
              {state.serviceType ? <CheckCircle2 size={16} className="check-ok" /> : <AlertCircle size={16} className="check-no" />}
              <span>{t('review.serviceSelected')}</span>
            </div>
            <div className="check-item">
              {state.contactInfo.email ? <CheckCircle2 size={16} className="check-ok" /> : <AlertCircle size={16} className="check-no" />}
              <span>{t('review.emailEntered')}</span>
            </div>
          </div>

          {error && (
            <div className="error-box">
              <p>{error}</p>
              <button onClick={handleRetry} className="retry-btn">{t('button.back')}</button>
            </div>
          )}

          <button onClick={handleSubmit} disabled={!isFormValid || isSubmitting} className="submit-btn">
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>{t('review.submitting')}</span>
              </>
            ) : (
              <span>{t('button.submit')}</span>
            )}
          </button>

          <p className="submit-note">{t('review.reviewBeforeSubmit')}</p>
        </div>
      </div>
    </div>
  );
}
