'use client';

import { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { SEED_MATTER_TYPES } from '@/lib/i18n/seed-multilingual';

interface IntakeQuestionsFormProps {
  requestId: string;
  selectedService: string;
  onAnswersSaved: () => void;
  locale?: string;
}

interface Question {
  key: string;
  label: string;
  required: boolean;
  type: 'text' | 'textarea';
}

export default function IntakeQuestionsForm({ requestId, selectedService, onAnswersSaved, locale = 'vi' }: IntakeQuestionsFormProps) {
  const t = useTranslations('UserCreateRequest');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Map selected service to matterTypeKey
  const matterTypeKey = selectedService === 'trademark' ? 'trademark_registration' : selectedService;

  // Get questions from catalog
  const matterType = SEED_MATTER_TYPES[matterTypeKey as keyof typeof SEED_MATTER_TYPES];
  const questions: Question[] = matterType?.questions || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation
    const form = formRef.current;
    if (!form) return;

    const formData = new FormData(form);
    const newErrors: Record<string, string> = {};

    for (const question of questions) {
      if (question.required) {
        const value = formData.get(`answer.${question.key}`) as string;
        if (!value?.trim()) {
          newErrors[question.key] = `Vui lòng nhập ${question.label}`;
        }
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Collect answers
      const answers: Record<string, string> = {};
      for (const question of questions) {
        const value = formData.get(`answer.${question.key}`) as string;
        if (value?.trim()) {
          answers[question.key] = value.trim();
        }
      }

      // Save answers via API
      const saveResponse = await fetch('/api/intake/save-answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, answers }),
      });

      const saveResult = await saveResponse.json();

      if (saveResponse.ok) {
        onAnswersSaved();
      } else {
        setSubmitError(saveResult.error || 'Có lỗi khi lưu câu trả lời');
      }
    } catch (error) {
      console.error('Save answers failed:', error);
      setSubmitError('Có lỗi xảy ra khi lưu câu trả lời');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit}>
      <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.7, marginBottom: '18px' }}>
        {matterType?.description?.[locale as keyof typeof matterType.description] || matterType?.description?.vi || 'Điền thông tin cần thiết'}
      </p>

      {questions.map((question) => (
        <div key={question.key} className="mb-4">
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            {question.label}
            {question.required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
          {question.type === 'textarea' ? (
            <textarea
              name={`answer.${question.key}`}
              rows={4}
              placeholder={`Nhập ${question.label.toLowerCase()}...`}
              className={`w-full border rounded-lg px-3 py-2.5 text-sm text-slate-700 focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 outline-none resize-none ${
                errors[question.key] ? 'border-red-500' : 'border-slate-200'
              }`}
            />
          ) : (
            <input
              type="text"
              name={`answer.${question.key}`}
              placeholder={`Nhập ${question.label.toLowerCase()}...`}
              className={`h-11 w-full border rounded-lg px-3 text-sm text-slate-700 focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 outline-none ${
                errors[question.key] ? 'border-red-500' : 'border-slate-200'
              }`}
            />
          )}
          {errors[question.key] && (
            <p className="text-red-500 text-xs mt-1">{errors[question.key]}</p>
          )}
        </div>
      ))}

      {submitError && (
        <div className="text-red-500 text-sm mb-4">{submitError}</div>
      )}

      <div className="text-xs text-slate-500 mb-4">
        <span className="text-red-500">*</span> Thông tin bắt buộc
      </div>

      <button
        type="submit"
        className="w-full create-btn"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            Đang lưu...
          </span>
        ) : (
          'Lưu câu trả lời'
        )}
      </button>
    </form>
  );
}
