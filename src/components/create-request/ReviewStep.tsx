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

  // Get domain and service labels
  const domain = state.domainId ? SEED_LEGAL_DOMAINS[state.domainId] : null;
  const service = state.serviceType ? SEED_MATTER_TYPES[state.serviceType] : null;
  const domainLabel = domain?.label[locale] || domain?.label.vi || 'Chưa chọn';
  const serviceLabel = service?.label[locale] || service?.label.vi || 'Chưa chọn';

  // Check if form is ready for submission
  const isFormValid = state.domainId && state.serviceType && state.contactInfo.email;

  // Handle submit with loading state and error handling
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

      // Auto-redirect after 2 seconds
      setTimeout(() => {
        window.location.href = `/${locale}/cases`;
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi gửi yêu cầu');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Retry after error
  const handleRetry = () => {
    setError(null);
  };

  // Success modal
  if (showSuccess) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 text-center">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Yêu cầu đã được gửi!</h2>
          <p className="text-gray-600 mb-6">
            Yêu cầu của bạn đã được gửi thành công. Chúng tôi sẽ liên hệ với bạn trong thời gian sớm nhất.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Đang chuyển hướng đến trang yêu cầu...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[70%_30%] gap-6">
      {/* Summary Column (70%) */}
      <div className="space-y-6">
        {/* Domain & Service */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Lĩnh vực & Dịch vụ</h3>
            <button
              onClick={() => onEdit(1)}
              className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm"
            >
              <Edit2 className="w-4 h-4" />
              <span>Chỉnh sửa</span>
            </button>
          </div>
          <div className="space-y-2">
            <div>
              <span className="text-sm text-gray-500">Lĩnh vực:</span>
              <p className="text-gray-900 font-medium">{domainLabel}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Dịch vụ:</span>
              <p className="text-gray-900 font-medium">{serviceLabel}</p>
            </div>
          </div>
        </div>

        {/* Questions & Answers */}
        {state.serviceType && service && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Thông tin chi tiết</h3>
              <button
                onClick={() => onEdit(3)}
                className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm"
              >
                <Edit2 className="w-4 h-4" />
                <span>Chỉnh sửa</span>
              </button>
            </div>
            <div className="space-y-3">
              {service.questions.map((question) => {
                const answer = state.answers[question.key] || '';
                return (
                  <div key={question.key}>
                    <span className="text-sm text-gray-500">
                      {question.label}
                      {question.required && <span className="text-red-500 ml-1">*</span>}
                    </span>
                    <p className="text-gray-900 whitespace-pre-wrap">
                      {answer || <span className="italic text-gray-400">Chưa nhập</span>}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Files */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Tài liệu đính kèm</h3>
            <button
              onClick={() => onEdit(4)}
              className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm"
            >
              <Edit2 className="w-4 h-4" />
              <span>Chỉnh sửa</span>
            </button>
          </div>
          {state.files.length > 0 ? (
            <ul className="space-y-2">
              {state.files.map((file) => (
                <li key={file.vaultFileId} className="flex items-center justify-between text-sm">
                  <span className="text-gray-900 line-clamp-1">{file.filename}</span>
                  <span className="text-gray-500 ml-2">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-sm">Chưa có tài liệu nào</p>
          )}
        </div>

        {/* Priority */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Mức độ ưu tiên</h3>
          <div className="flex gap-4">
            <label className="flex-1 cursor-pointer">
              <input
                type="radio"
                name="priority"
                value="normal"
                checked={state.priority === 'normal'}
                onChange={() => {}}
                className="sr-only"
              />
              <div
                className={`p-4 rounded-lg border-2 transition-colors ${
                  state.priority === 'normal'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                }`}
              >
                <p className="font-medium text-gray-900">Bình thường</p>
                <p className="text-sm text-gray-500 mt-1">Xử lý trong 72 giờ</p>
              </div>
            </label>
            <label className="flex-1 cursor-pointer">
              <input
                type="radio"
                name="priority"
                value="urgent"
                checked={state.priority === 'urgent'}
                onChange={() => {}}
                className="sr-only"
              />
              <div
                className={`p-4 rounded-lg border-2 transition-colors ${
                  state.priority === 'urgent'
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                }`}
              >
                <p className="font-medium text-gray-900">Khẩn cấp</p>
                <p className="text-sm text-gray-500 mt-1">Xử lý trong 24 giờ</p>
              </div>
            </label>
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin liên hệ</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={state.contactInfo.email || userContactInfo?.email || ''}
                onChange={() => {}}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="email@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Số điện thoại
              </label>
              <input
                type="tel"
                value={state.contactInfo.phone || userContactInfo?.phone || ''}
                onChange={() => {}}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0123456789"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tên công ty
              </label>
              <input
                type="text"
                value={state.contactInfo.companyName || userContactInfo?.companyName || ''}
                onChange={() => {}}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Công ty ABC"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mã số thuế
              </label>
              <input
                type="text"
                value={state.contactInfo.taxCode || userContactInfo?.taxCode || ''}
                onChange={() => {}}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0123456789"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Actions Column (30%) */}
      <div className="lg:sticky lg:top-6 lg:self-start">
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Xác nhận & Gửi</h3>

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              {state.domainId ? (
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              ) : (
                <AlertCircle className="w-4 h-4 text-gray-400" />
              )}
              <span className="text-gray-700">Đã chọn lĩnh vực</span>
            </div>
            <div className="flex items-center gap-2">
              {state.serviceType ? (
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              ) : (
                <AlertCircle className="w-4 h-4 text-gray-400" />
              )}
              <span className="text-gray-700">Đã chọn dịch vụ</span>
            </div>
            <div className="flex items-center gap-2">
              {state.contactInfo.email ? (
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              ) : (
                <AlertCircle className="w-4 h-4 text-gray-400" />
              )}
              <span className="text-gray-700">Đã nhập email</span>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <p className="mb-2">{error}</p>
              <button
                onClick={handleRetry}
                className="text-red-600 hover:text-red-700 underline text-xs"
              >
                Thử lại
              </button>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={!isFormValid || isSubmitting}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Đang gửi...</span>
              </>
            ) : (
              <span>Gửi yêu cầu</span>
            )}
          </button>

          <p className="text-xs text-gray-500 text-center">
            Vui lòng kiểm tra kỹ thông tin trước khi gửi
          </p>
        </div>
      </div>
    </div>
  );
}
