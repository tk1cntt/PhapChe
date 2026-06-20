'use client';

import { useState } from 'react';
import { CheckCircle2, AlertCircle, Edit2, Loader2 } from 'lucide-react';
import { SEED_LEGAL_DOMAINS, SEED_MATTER_TYPES } from '@/lib/i18n/seed-legal-domains';
import type { WizardState } from '@/lib/types/wizard';

interface ReviewStepProps {
  state: WizardState;
  onEdit: (step: number) => void;
  onSubmit: () => Promise<void>;
  locale?: string;
  userContactInfo?: {
    email?: string;
    phone?: string;
    companyName?: string;
    taxCode?: string;
  };
}

/**
 * Review step component displaying summary of wizard data with edit capabilities
 * Layout: 70% summary, 30% actions
 */
export default function ReviewStep({
  state,
  onEdit,
  onSubmit,
  locale = 'vi',
  userContactInfo,
}: ReviewStepProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const domain = state.domainId ? SEED_LEGAL_DOMAINS[state.domainId] : null;
  const service = state.serviceType ? SEED_MATTER_TYPES[state.serviceType] : null;
  const domainLabel = domain?.label[locale] || domain?.label.vi || 'Chưa chọn';
  const serviceLabel = service?.label[locale] || service?.label.vi || 'Chưa chọn';

  const isFormValid = state.domainId && state.serviceType && state.contactInfo.email;

  const handleSubmit = async () => {
    if (!isFormValid) {
      setError('Vui lòng điền đầy đủ thông tin bắt buộc');
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
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi gửi yêu cầu');
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
          <h2 className="success-title">Yêu cầu đã được gửi!</h2>
          <p className="success-desc">
            Yêu cầu của bạn đã được gửi thành công. Chúng tôi sẽ liên hệ với bạn trong thời gian sớm nhất.
          </p>
          <div className="success-redirect">
            <Loader2 size={16} className="animate-spin" />
            <span>Đang chuyển hướng đến trang yêu cầu...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="review-grid">
      {/* Summary Column */}
      <div className="review-summary">
        {/* Domain & Service */}
        <div className="review-card">
          <div className="review-card-header">
            <h3 className="review-card-title">Lĩnh vực & Dịch vụ</h3>
            <button onClick={() => onEdit(1)} className="edit-btn">
              <Edit2 size={14} />
              <span>Chỉnh sửa</span>
            </button>
          </div>
          <div className="review-card-content">
            <div className="review-row">
              <span className="review-label">Lĩnh vực:</span>
              <p className="review-value">{domainLabel}</p>
            </div>
            <div className="review-row">
              <span className="review-label">Dịch vụ:</span>
              <p className="review-value">{serviceLabel}</p>
            </div>
          </div>
        </div>

        {/* Questions & Answers */}
        {state.serviceType && service && (
          <div className="review-card">
            <div className="review-card-header">
              <h3 className="review-card-title">Thông tin chi tiết</h3>
              <button onClick={() => onEdit(3)} className="edit-btn">
                <Edit2 size={14} />
                <span>Chỉnh sửa</span>
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
                      {answer || <span className="text-gray-400 italic">Chưa nhập</span>}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Files */}
        <div className="review-card">
          <div className="review-card-header">
            <h3 className="review-card-title">Tài liệu đính kèm</h3>
            <button onClick={() => onEdit(4)} className="edit-btn">
              <Edit2 size={14} />
              <span>Chỉnh sửa</span>
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
              <p className="text-gray-500 text-sm">Chưa có tài liệu nào</p>
            )}
          </div>
        </div>

        {/* Priority */}
        <div className="review-card">
          <h3 className="review-card-title">Mức độ ưu tiên</h3>
          <div className="priority-options">
            <label className={`priority-option ${state.priority === 'normal' ? 'selected' : ''}`}>
              <input type="radio" name="priority" value="normal" checked={state.priority === 'normal'} onChange={() => {}} className="sr-only" />
              <div className="priority-content">
                <p className="priority-label">Bình thường</p>
                <p className="priority-desc">Xử lý trong 72 giờ</p>
              </div>
            </label>
            <label className={`priority-option ${state.priority === 'urgent' ? 'selected urgent' : ''}`}>
              <input type="radio" name="priority" value="urgent" checked={state.priority === 'urgent'} onChange={() => {}} className="sr-only" />
              <div className="priority-content">
                <p className="priority-label">Khẩn cấp</p>
                <p className="priority-desc">Xử lý trong 24 giờ</p>
              </div>
            </label>
          </div>
        </div>

        {/* Contact Info */}
        <div className="review-card">
          <h3 className="review-card-title">Thông tin liên hệ</h3>
          <div className="contact-form">
            <div className="form-field">
              <label className="form-label">Email <span className="required-star">*</span></label>
              <input type="email" className="form-input" value={state.contactInfo.email || userContactInfo?.email || ''} placeholder="email@example.com" />
            </div>
            <div className="form-field">
              <label className="form-label">Số điện thoại</label>
              <input type="tel" className="form-input" value={state.contactInfo.phone || userContactInfo?.phone || ''} placeholder="0123456789" />
            </div>
            <div className="form-field">
              <label className="form-label">Tên công ty</label>
              <input type="text" className="form-input" value={state.contactInfo.companyName || userContactInfo?.companyName || ''} placeholder="Công ty ABC" />
            </div>
            <div className="form-field">
              <label className="form-label">Mã số thuế</label>
              <input type="text" className="form-input" value={state.contactInfo.taxCode || userContactInfo?.taxCode || ''} placeholder="0123456789" />
            </div>
          </div>
        </div>
      </div>

      {/* Actions Column */}
      <div className="review-actions">
        <div className="action-card">
          <h3 className="action-title">Xác nhận & Gửi</h3>

          <div className="check-list">
            <div className="check-item">
              {state.domainId ? <CheckCircle2 size={16} className="check-ok" /> : <AlertCircle size={16} className="check-no" />}
              <span>Đã chọn lĩnh vực</span>
            </div>
            <div className="check-item">
              {state.serviceType ? <CheckCircle2 size={16} className="check-ok" /> : <AlertCircle size={16} className="check-no" />}
              <span>Đã chọn dịch vụ</span>
            </div>
            <div className="check-item">
              {state.contactInfo.email ? <CheckCircle2 size={16} className="check-ok" /> : <AlertCircle size={16} className="check-no" />}
              <span>Đã nhập email</span>
            </div>
          </div>

          {error && (
            <div className="error-box">
              <p>{error}</p>
              <button onClick={handleRetry} className="retry-btn">Thử lại</button>
            </div>
          )}

          <button onClick={handleSubmit} disabled={!isFormValid || isSubmitting} className="submit-btn">
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Đang gửi...</span>
              </>
            ) : (
              <span>Gửi yêu cầu</span>
            )}
          </button>

          <p className="submit-note">Vui lòng kiểm tra kỹ thông tin trước khi gửi</p>
        </div>
      </div>
    </div>
  );
}
